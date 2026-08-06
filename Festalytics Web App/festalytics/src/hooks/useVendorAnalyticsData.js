"use client";

import { useState, useEffect, useMemo } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase";
import { useVendorVenue } from "@/hooks/useVendorVenue";
import {
  listenToVenueBookings,
  fetchLegacyVenueBookings,
} from "@/lib/firestore/bookings";
import {
  listenToVenueQuotations,
  mapQuotationToBookingRow,
  QUOTATION_STATUS,
} from "@/lib/firestore/quotations";

const DAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function mergeRows(...lists) {
  const byKey = new Map();
  for (const list of lists) {
    for (const row of list) {
      byKey.set(row.docId || row.id, row);
    }
  }
  return Array.from(byKey.values());
}

function normalizeStatus(status) {
  return String(status || "").toLowerCase().trim();
}

function bookingAmount(row) {
  const n = Number(row.amount);
  if (Number.isFinite(n) && n > 0) return n;
  const grand = Number(row.raw?.financials?.grandTotal);
  if (Number.isFinite(grand) && grand > 0) return grand;
  return 0;
}

function parseFirestoreTimestamp(value) {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate();
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseEventDate(row) {
  const d = row.eventDate || row.raw?.eventDetails?.date;
  if (!d) return null;
  const parsed = new Date(d);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Best date for charts: event date → quotation/booking timestamp → booked label */
function parseRecordDate(row) {
  const event = parseEventDate(row);
  if (event) return event;
  const ts = parseFirestoreTimestamp(row.raw?.timestamp || row.raw?.createdAt);
  if (ts) return ts;
  if (row.bookedDate && row.bookedDate !== "Today") {
    const parsed = new Date(row.bookedDate);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return null;
}

function formatDisplayDate(date) {
  if (!date) return "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function computeRatingFromReviews(reviews) {
  if (!Array.isArray(reviews) || reviews.length === 0) {
    return { average: 0, count: 0 };
  }
  const rated = reviews.filter((r) => Number(r.rating) > 0);
  if (rated.length === 0) return { average: 0, count: reviews.length };
  const sum = rated.reduce((s, r) => s + Number(r.rating), 0);
  return { average: sum / rated.length, count: reviews.length };
}

/**
 * Maps ERP UI + Firestore status into analytics buckets.
 * @returns {"confirmed"|"pending"|"completed"|"cancelled"|"other"}
 */
export function classifyRecordStatus(row) {
  const firestore = normalizeStatus(
    row.raw?.firestoreStatus || row.raw?.status || ""
  ).replace(/\s+/g, "_");
  const ui = normalizeStatus(row.status);

  if (
    firestore === QUOTATION_STATUS.CONFIRMED ||
    firestore === "confirmed" ||
    ui.includes("confirmed")
  ) {
    return "confirmed";
  }

  if (
    firestore === QUOTATION_STATUS.DECLINED ||
    firestore === "declined" ||
    ui.includes("declined") ||
    ui.includes("cancel")
  ) {
    return "cancelled";
  }

  if (ui === "completed" || firestore === "completed") {
    return "completed";
  }

  if (
    firestore === QUOTATION_STATUS.PENDING ||
    firestore === QUOTATION_STATUS.COUNTER ||
    firestore === "counter_offer" ||
    ui.includes("pending") ||
    ui.includes("quote") ||
    ui.includes("counter")
  ) {
    return "pending";
  }

  if (ui === "confirmed" || normalizeStatus(row.raw?.status) === "confirmed") {
    return "confirmed";
  }

  return "other";
}

function isConfirmedRecord(row) {
  return classifyRecordStatus(row) === "confirmed";
}

function isPendingRecord(row) {
  return classifyRecordStatus(row) === "pending";
}

function buildAnalytics(allRecords, venueMeta) {
  const confirmedRecords = allRecords.filter(isConfirmedRecord);
  const pendingRecords = allRecords.filter(isPendingRecord);

  const totalBookings = allRecords.length;
  const confirmedCount = confirmedRecords.length;
  const totalRevenue = confirmedRecords.reduce((s, b) => s + bookingAmount(b), 0);
  const pendingCount = pendingRecords.length;

  const venueStats = venueMeta?.stats || {};
  const reviews = Array.isArray(venueMeta?.reviews) ? venueMeta.reviews : [];
  const reviewStats = computeRatingFromReviews(reviews);
  const averageRating =
    Number(venueStats.averageRating) > 0
      ? Number(venueStats.averageRating)
      : reviewStats.average;
  const reviewCount =
    Number(venueStats.reviewCount) > 0
      ? Number(venueStats.reviewCount)
      : reviewStats.count;

  const statusCounts = { confirmed: 0, pending: 0, completed: 0, cancelled: 0 };
  for (const row of allRecords) {
    const bucket = classifyRecordStatus(row);
    if (bucket === "other") {
      statusCounts.pending += 1;
    } else if (statusCounts[bucket] !== undefined) {
      statusCounts[bucket] += 1;
    }
  }

  const statusTotal = allRecords.length || 0;
  const statusBreakdown = [
    { label: "Confirmed", key: "confirmed", count: statusCounts.confirmed },
    { label: "Pending", key: "pending", count: statusCounts.pending },
    { label: "Completed", key: "completed", count: statusCounts.completed },
    { label: "Cancelled", key: "cancelled", count: statusCounts.cancelled },
  ].map((item) => ({
    ...item,
    pct: statusTotal > 0 ? Math.round((item.count / statusTotal) * 100) : 0,
    value:
      statusTotal > 0
        ? `${Math.round((item.count / statusTotal) * 100)}%`
        : "0%",
  }));

  const now = new Date();
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    last7Days.push({ day: DAY_LABELS[d.getDay()], key, count: 0 });
  }
  const last7Map = Object.fromEntries(last7Days.map((d) => [d.key, d]));
  for (const row of allRecords) {
    const ed = parseRecordDate(row);
    if (!ed) continue;
    const key = ed.toISOString().slice(0, 10);
    if (last7Map[key]) last7Map[key].count += 1;
  }
  const max7 = Math.max(1, ...last7Days.map((d) => d.count));
  const last7DaysBookings = last7Days.map((d, i) => ({
    day: d.day,
    count: d.count,
    height: `${Math.round((d.count / max7) * 100)}%`,
    active: i === last7Days.length - 1,
  }));

  const serviceMap = new Map();
  for (const row of allRecords) {
    const label = row.service || row.raw?.eventDetails?.category || "General Booking";
    const prev = serviceMap.get(label) || { label, count: 0, revenue: 0 };
    prev.count += 1;
    if (isConfirmedRecord(row)) {
      prev.revenue += bookingAmount(row);
    }
    serviceMap.set(label, prev);
  }
  const popularServices = Array.from(serviceMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  const maxServiceCount = Math.max(1, ...popularServices.map((s) => s.count), 1);
  const servicePopularity = popularServices.map((s, i) => ({
    label: s.label,
    value: Math.round((s.count / maxServiceCount) * 100),
    bookings: s.count,
    width: `${Math.round((s.count / maxServiceCount) * 100)}%`,
    color: ["primary", "secondary", "tertiary", "primary-container", "outline"][i] || "outline",
  }));

  const monthlyBuckets = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthlyBuckets.push({
      month: MONTH_LABELS[d.getMonth()],
      year: d.getFullYear(),
      monthIndex: d.getMonth(),
      revenue: 0,
      bookings: 0,
    });
  }

  for (const row of confirmedRecords) {
    const ed = parseRecordDate(row);
    if (!ed) continue;
    const bucket = monthlyBuckets.find(
      (b) => b.year === ed.getFullYear() && b.monthIndex === ed.getMonth()
    );
    if (bucket) {
      bucket.bookings += 1;
      bucket.revenue += bookingAmount(row);
    }
  }

  const maxMonthlyRevenue = Math.max(1, ...monthlyBuckets.map((b) => b.revenue));
  const maxMonthlyBookings = Math.max(1, ...monthlyBuckets.map((b) => b.bookings));
  const monthlyPerformance = monthlyBuckets.map((b, i) => ({
    month: b.month,
    revenue: b.revenue,
    bookings: b.bookings,
    h1: Math.round((b.revenue / maxMonthlyRevenue) * 100),
    h2: Math.round((b.bookings / maxMonthlyBookings) * 100),
    index: i,
  }));

  const revenueTrend = monthlyBuckets.map((b) => ({
    label: b.month,
    revenue: b.revenue,
    height: Math.round((b.revenue / maxMonthlyRevenue) * 100) / 100,
  }));

  const recentBookings = [...allRecords]
    .sort((a, b) => {
      const da = parseRecordDate(a)?.getTime() || 0;
      const db = parseRecordDate(b)?.getTime() || 0;
      return db - da;
    })
    .slice(0, 5)
    .map((row) => {
      const bucket = classifyRecordStatus(row);
      return {
        customer: row.customer?.name || "Client",
        service: row.service || "Event",
        date: row.eventDate || row.bookedDate || "—",
        status: row.status || "Pending",
        statusColor:
          bucket === "completed"
            ? "bg-surface-container-highest text-on-surface-variant border-outline/20"
            : bucket === "pending"
              ? "bg-tertiary-fixed text-on-tertiary-fixed-variant border-tertiary/20"
              : bucket === "cancelled"
                ? "bg-error-container text-on-error-container border-error/20"
                : "bg-secondary-container text-on-secondary-container border-secondary/20",
      };
    });

  const servicePerformance = popularServices.map((s) => ({
    name: s.label,
    bookings: s.count,
    revenue: `Rs. ${s.revenue.toLocaleString()}`,
    rating: averageRating > 0 ? averageRating.toFixed(1) : "—",
    date: "—",
    img: null,
  }));

  const weeklyPerformance = last7Days.map((d) => {
    const dayRecords = allRecords.filter((row) => {
      const ed = parseRecordDate(row);
      return ed && ed.toISOString().slice(0, 10) === d.key;
    });
    const confirmedDay = dayRecords.filter(isConfirmedRecord);
    const rev = confirmedDay.reduce((s, b) => s + bookingAmount(b), 0);
    return {
      day: d.day,
      bookings: dayRecords.length,
      revenue: `Rs. ${rev.toLocaleString()}`,
      active: d.key === now.toISOString().slice(0, 10),
    };
  });

  const recentPayments = confirmedRecords
    .filter((b) => {
      const advance = Number(b.raw?.financials?.advancePaid);
      const paid = Number(b.raw?.financials?.amountPaid);
      return advance > 0 || paid > 0;
    })
    .slice(0, 5)
    .map((b) => {
      const paid =
        Number(b.raw?.financials?.advancePaid) ||
        Number(b.raw?.financials?.amountPaid) ||
        0;
      return {
        date: formatDisplayDate(parseRecordDate(b)),
        id: b.id || b.docId,
        amount: `Rs. ${paid.toLocaleString()}`,
        status: "Paid",
        color: "tertiary",
      };
    });

  const latestReviews = reviews.slice(0, 3).map((r) => ({
    name: r.name || "Customer",
    initials: (r.name || "C").slice(0, 2).toUpperCase(),
    service: r.role || r.service || "Event",
    rating: Number(r.rating) || 5,
    comment: r.comment || "",
    color: "secondary",
  }));

  const conversionRate =
    totalBookings > 0
      ? Math.round((confirmedCount / totalBookings) * 1000) / 10
      : 0;

  return {
    totalBookings,
    confirmedCount,
    totalRevenue,
    pendingCount,
    averageRating,
    reviewCount,
    conversionRate,
    statusBreakdown,
    statusTotal,
    last7DaysBookings,
    servicePopularity,
    monthlyPerformance,
    revenueTrend,
    recentBookings,
    servicePerformance,
    weeklyPerformance,
    recentPayments,
    latestReviews,
    hasData: allRecords.length > 0,
  };
}

/**
 * Live vendor analytics from Firestore quotations, bookings, and venue profile.
 */
export function useVendorAnalyticsData() {
  const { venueId, isLoading: venueLoading } = useVendorVenue();
  const [quotationRows, setQuotationRows] = useState([]);
  const [bookingRows, setBookingRows] = useState([]);
  const [legacyRows, setLegacyRows] = useState([]);
  const [venueMeta, setVenueMeta] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (venueLoading || !venueId) {
      if (!venueLoading) {
        setDataLoading(false);
        setQuotationRows([]);
        setBookingRows([]);
        setLegacyRows([]);
      }
      return;
    }

    setDataLoading(true);
    setError(null);

    let quotationsReady = false;
    let bookingsReady = false;

    const maybeDoneLoading = () => {
      if (quotationsReady && bookingsReady) {
        setDataLoading(false);
      }
    };

    const unsubQuotations = listenToVenueQuotations(
      venueId,
      (quotations) => {
        setQuotationRows(quotations.map(mapQuotationToBookingRow));
        quotationsReady = true;
        maybeDoneLoading();
      },
      (err) => {
        setError(err.message);
        quotationsReady = true;
        maybeDoneLoading();
      }
    );

    const unsubBookings = listenToVenueBookings(
      venueId,
      (rows) => {
        setBookingRows(rows);
        bookingsReady = true;
        maybeDoneLoading();
      },
      (err) => {
        setError(err.message);
        bookingsReady = true;
        maybeDoneLoading();
      }
    );

    fetchLegacyVenueBookings(venueId)
      .then(setLegacyRows)
      .catch((err) => {
        console.error("[useVendorAnalyticsData] legacy bookings:", err);
      });

    const unsubVenue = onSnapshot(
      doc(db, "venues", venueId),
      (snap) => setVenueMeta(snap.exists() ? snap.data() : null),
      (err) => setError(err.message)
    );

    return () => {
      unsubQuotations();
      unsubBookings();
      unsubVenue();
    };
  }, [venueId, venueLoading]);

  const allRecords = useMemo(
    () => mergeRows(quotationRows, bookingRows, legacyRows),
    [quotationRows, bookingRows, legacyRows]
  );

  const pendingQuotations = useMemo(
    () => quotationRows.filter(isPendingRecord),
    [quotationRows]
  );

  const pendingRecords = useMemo(
    () => allRecords.filter(isPendingRecord),
    [allRecords]
  );

  const analytics = useMemo(
    () => buildAnalytics(allRecords, venueMeta),
    [allRecords, venueMeta]
  );

  return {
    venueId,
    isLoading: venueLoading || dataLoading,
    error,
    analytics,
    allRecords,
    pendingQuotations,
    pendingRecords,
    quotationRows,
    bookingRows,
    venueMeta,
  };
}
