"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useVendorVenue } from "@/hooks/useVendorVenue";
import {
  subscribeVenueCalendar,
  saveVenueCalendar,
  toDateKey,
  getDateStatus,
  normalizeLegacyDayNumbers,
} from "@/lib/firestore/venueCalendar";

export function useVenueCalendar() {
  const { venueId, isLoading: venueLoading, hasVenue } = useVendorVenue();
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());
  const [selectedDateKey, setSelectedDateKey] = useState(() => {
    const n = new Date();
    return toDateKey(n.getFullYear(), n.getMonth(), n.getDate());
  });

  const [blockedDates, setBlockedDates] = useState([]);
  const [blackoutDates, setBlackoutDates] = useState([]);
  const [operatingHours, setOperatingHours] = useState({
    defaultFrom: "9:00 AM",
    defaultTo: "6:00 PM",
  });
  const [dayOverrides, setDayOverrides] = useState({});

  const [firestoreBookings, setFirestoreBookings] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (venueLoading || !venueId) return;
    setIsLoading(true);

    const unsubVenue = subscribeVenueCalendar(venueId, (data) => {
      if (data) {
        const blocked =
          data.blockedDates ||
          normalizeLegacyDayNumbers(data.bookedDates, viewYear, viewMonth) ||
          [];
        const blackout =
          data.blackoutDates ||
          normalizeLegacyDayNumbers(data.blackoutDates, viewYear, viewMonth) ||
          [];
        setBlockedDates(Array.isArray(blocked) ? [...new Set(blocked)] : []);
        setBlackoutDates(Array.isArray(blackout) ? [...new Set(blackout)] : []);
        if (data.operatingHours) setOperatingHours(data.operatingHours);
        if (data.dayOverrides) setDayOverrides(data.dayOverrides);
      }
      setIsLoading(false);
    });

    const unsubBookings = onSnapshot(
      collection(db, "bookings"),
      (snap) => {
        const list = snap.docs
          .map((d) => ({ docId: d.id, ...d.data() }))
          .filter(
            (b) =>
              b.targetVenueId === venueId || b.eventDetails?.venueId === venueId
          );
        setFirestoreBookings(list);
      }
    );

    const quotationsQuery = query(
      collection(db, "quotations"),
      where("targetVenueId", "==", venueId)
    );
    const unsubQuotations = onSnapshot(quotationsQuery, (snap) => {
      setQuotations(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubVenue();
      unsubBookings();
      unsubQuotations();
    };
  }, [venueId]);

  const pendingDates = useMemo(() => {
    const dates = new Set();
    quotations
      .filter((q) => q.status === "pending_vendor_approval")
      .forEach((q) => q.eventDate && dates.add(q.eventDate));

    firestoreBookings
      .filter((b) => {
        const s = (b.status || "").toLowerCase();
        return s === "pending" || s === "quote request" || s === "counter offer";
      })
      .forEach((b) => {
        const d = b.eventDetails?.date;
        if (d) dates.add(d);
      });

    return Array.from(dates);
  }, [quotations, firestoreBookings]);

  const bookingDatesFromFirestore = useMemo(() => {
    const dates = new Set(blockedDates);
    firestoreBookings
      .filter((b) => {
        const s = (b.status || "").toLowerCase();
        return s === "confirmed" || s === "completed";
      })
      .forEach((b) => {
        const d = b.eventDetails?.date;
        if (d) dates.add(d);
      });
    return Array.from(dates);
  }, [blockedDates, firestoreBookings]);

  const calendarMeta = useMemo(
    () => ({
      blockedDates: bookingDatesFromFirestore,
      blackoutDates,
      pendingDates,
    }),
    [bookingDatesFromFirestore, blackoutDates, pendingDates]
  );

  const eventsByDate = useMemo(() => {
    const map = {};
    const ensure = (key) => {
      if (!map[key]) map[key] = { bookings: [], quotations: [] };
      return map[key];
    };

    firestoreBookings.forEach((b) => {
      const d = b.eventDetails?.date;
      if (!d) return;
      ensure(d).bookings.push({
        id: b.id || b.docId,
        customer: b.customer?.name || "Client",
        contact: b.customer?.contact || "",
        service: b.eventDetails?.category || "Event",
        timing: b.eventDetails?.timing || "",
        status: b.status || "Pending",
        guests: b.eventDetails?.guests,
        source: b.bookingSource === "walk-in" ? "Walk-in ERP" : "Online",
        raw: b,
      });
    });

    quotations.forEach((q) => {
      if (!q.eventDate) return;
      ensure(q.eventDate).quotations.push({
        id: q.quotationId || q.id,
        customer: q.customerName,
        service:
          typeof q.selectedMenu === "object"
            ? q.selectedMenu?.packageName || "Quotation"
            : "Quotation",
        status: "Quote Request",
        guests: q.guestCount,
        source: "Online Portal",
        raw: q,
      });
    });

    return map;
  }, [firestoreBookings, quotations]);

  const selectedDayEvents = eventsByDate[selectedDateKey] || {
    bookings: [],
    quotations: [],
  };

  const getStatus = useCallback(
    (dateKey) => getDateStatus(dateKey, calendarMeta),
    [calendarMeta]
  );

  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const goToToday = () => {
    const n = new Date();
    setViewYear(n.getFullYear());
    setViewMonth(n.getMonth());
    setSelectedDateKey(toDateKey(n.getFullYear(), n.getMonth(), n.getDate()));
  };

  const toggleDateStatus = useCallback(
    (dateKey) => {
      if (!dateKey) return;
      const status = getDateStatus(dateKey, calendarMeta);
      const hasSystemBooking = (eventsByDate[dateKey]?.bookings || []).some(
        (b) => (b.status || "").toLowerCase() === "confirmed"
      );

      if (status === "booked" && hasSystemBooking) {
        setError("This date has a confirmed booking. Change status from Bookings page.");
        return;
      }

      setError(null);

      if (status === "blackout") {
        setBlackoutDates((prev) => prev.filter((d) => d !== dateKey));
        return;
      }
      if (status === "booked") {
        setBlockedDates((prev) => prev.filter((d) => d !== dateKey));
        return;
      }
      if (status === "pending") {
        setError("Pending quotations/bookings must be approved or declined in Bookings.");
        return;
      }
      setBlackoutDates((prev) =>
        prev.includes(dateKey) ? prev : [...prev, dateKey]
      );
    },
    [calendarMeta, eventsByDate]
  );

  const markSelectedAsBooked = useCallback(() => {
    if (!selectedDateKey) return;
    setBlackoutDates((prev) => prev.filter((d) => d !== selectedDateKey));
    setBlockedDates((prev) =>
      prev.includes(selectedDateKey) ? prev : [...prev, selectedDateKey]
    );
  }, [selectedDateKey]);

  const markSelectedAsBlackout = useCallback(() => {
    if (!selectedDateKey) return;
    setBlockedDates((prev) => prev.filter((d) => d !== selectedDateKey));
    setBlackoutDates((prev) =>
      prev.includes(selectedDateKey) ? prev : [...prev, selectedDateKey]
    );
  }, [selectedDateKey]);

  const markSelectedAsAvailable = useCallback(() => {
    if (!selectedDateKey) return;
    const hasConfirmed = (eventsByDate[selectedDateKey]?.bookings || []).some(
      (b) => (b.status || "").toLowerCase() === "confirmed"
    );
    if (hasConfirmed) {
      setError("Cannot clear a confirmed booking date here.");
      return;
    }
    setBlockedDates((prev) => prev.filter((d) => d !== selectedDateKey));
    setBlackoutDates((prev) => prev.filter((d) => d !== selectedDateKey));
    setError(null);
  }, [selectedDateKey, eventsByDate]);

  const clearSelectedDayOverrides = markSelectedAsAvailable;

  const setSelectedDayHours = useCallback(
    (from, to, isAvailable = true) => {
      if (!selectedDateKey) return;
      setDayOverrides((prev) => ({
        ...prev,
        [selectedDateKey]: { from, to, isAvailable },
      }));
    },
    [selectedDateKey]
  );

  const persistCalendar = useCallback(async () => {
    setIsSaving(true);
    setError(null);
    try {
      await saveVenueCalendar(venueId, {
        blockedDates: bookingDatesFromFirestore,
        blackoutDates,
        operatingHours,
        dayOverrides,
      });
      return true;
    } catch (err) {
      console.error("persistCalendar failed:", err);
      setError(err.message);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [venueId, bookingDatesFromFirestore, blackoutDates, operatingHours, dayOverrides]);

  const selectedDayHours = dayOverrides[selectedDateKey] || {
    from: operatingHours.defaultFrom,
    to: operatingHours.defaultTo,
    isAvailable: getStatus(selectedDateKey) !== "blackout",
  };

  return {
    venueId: venueId || null,
    hasVenue,
    venueLoading,
    viewYear,
    viewMonth,
    selectedDateKey,
    setSelectedDateKey,
    calendarMeta,
    eventsByDate,
    selectedDayEvents,
    operatingHours,
    setOperatingHours,
    selectedDayHours,
    setSelectedDayHours,
    isLoading,
    isSaving,
    error,
    setError,
    getStatus,
    goToPrevMonth,
    goToNextMonth,
    goToToday,
    toggleDateStatus,
    markSelectedAsBooked,
    markSelectedAsBlackout,
    markSelectedAsAvailable,
    clearSelectedDayOverrides,
    persistCalendar,
  };
}
