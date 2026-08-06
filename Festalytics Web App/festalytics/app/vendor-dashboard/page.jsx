"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import MetricCard from "@/components/vendor/MetricCard";
import RecentBookings from "@/components/vendor/RecentBookings";
import Calendar from "@/components/vendor/Calendar";
import AnalyticsPreview from "@/components/vendor/AnalyticsPreview";
import { db, auth } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useVendorAnalyticsData } from "@/hooks/useVendorAnalyticsData";

const VendorDashboard = () => {
  const [vendorName, setVendorName] = useState("Vendor");
  const {
    venueId: vendorSlug,
    analytics,
    isLoading: analyticsLoading,
    pendingRecords,
    error: analyticsError,
  } = useVendorAnalyticsData();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        if (user.displayName) {
          setVendorName(user.displayName);
        } else {
          try {
            const userDocRef = doc(db, "users", user.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
              const userData = userDocSnap.data();
              setVendorName(userData.fullName || userData.name || "Vendor");
            }
          } catch (err) {
            console.error("Error fetching vendor name: ", err);
          }
        }
      } else {
        setVendorName("Vendor");
      }
    });
    return () => unsubscribe();
  }, []);

  const formatRevenue = (amount) => {
    if (!amount || amount <= 0) return "Rs. 0";
    if (amount >= 1_000_000) {
      return `Rs. ${(amount / 1_000_000).toFixed(2)}M`;
    }
    return `Rs. ${amount.toLocaleString("en-PK")}`;
  };

  const metrics = [
    {
      icon: "event_available",
      label: "Confirmed Bookings",
      value: analyticsLoading ? "—" : String(analytics.confirmedCount ?? 0),
      hint: analyticsLoading
        ? "Syncing…"
        : `${analytics.totalBookings ?? 0} total requests · ${analytics.conversionRate ?? 0}% conversion`,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      icon: "payments",
      label: "Revenue",
      value: analyticsLoading ? "—" : formatRevenue(analytics.totalRevenue),
      hint: analyticsLoading
        ? "Syncing…"
        : `Full: Rs. ${(analytics.totalRevenue || 0).toLocaleString("en-PK")} · confirmed only`,
      iconBg: "bg-tertiary/10",
      iconColor: "text-tertiary",
      compactValue: true,
    },
    {
      icon: "pending_actions",
      label: "Pending Requests",
      value: analyticsLoading ? "—" : String(analytics.pendingCount ?? 0),
      hint: analyticsLoading ? "Syncing…" : "Quotes & counters awaiting action",
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-700",
    },
    {
      icon: "star",
      label: "Average Rating",
      value: analyticsLoading
        ? "—"
        : analytics.averageRating > 0
          ? `${analytics.averageRating.toFixed(1)}/5`
          : "—",
      hint:
        analytics.reviewCount > 0
          ? `${analytics.reviewCount} venue reviews`
          : "Add reviews in My Services",
      iconBg: "bg-secondary/10",
      iconColor: "text-secondary",
    },
  ];

  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <>
      <section className="mb-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}>
          <p className="text-[10px] font-black text-primary mb-1.5 uppercase tracking-[0.2em]">
            {formattedDate}
          </p>
          <h2 className="text-2xl sm:text-3xl font-black text-on-surface tracking-tight">
            Welcome back, {vendorName}!
          </h2>
          <p className="text-sm sm:text-base text-on-surface-variant mt-1.5 max-w-xl">
            Live overview from your quotations, walk-in bookings, and venue profile.
          </p>
        </motion.div>

        <div className="flex flex-wrap gap-3">
          <Link href="/vendor-dashboard/availability">
            <motion.span
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 px-6 h-11 bg-white border-2 border-primary text-primary font-bold rounded-full hover:bg-primary-fixed transition-all shadow-sm text-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">event</span>
              View Schedule
            </motion.span>
          </Link>
          <Link href="/vendor-dashboard/bookings">
            <motion.span
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 px-6 h-11 bg-primary text-white font-bold rounded-full transition-all shadow-md shadow-primary/25 text-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">inbox</span>
              Open Bookings
            </motion.span>
          </Link>
        </div>
      </section>

      {analyticsError && (
        <p className="mb-6 px-4 py-3 rounded-2xl bg-error-container text-on-error-container text-sm font-bold">
          {analyticsError}
        </p>
      )}

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 mb-8">
        {metrics.map((metric, idx) => (
          <MetricCard key={metric.label} {...metric} index={idx} />
        ))}
      </section>

      <section className="mb-8">
        <div className="bg-white border border-outline-variant/70 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-5 sm:p-6 border-b border-outline-variant flex flex-wrap justify-between items-center gap-4 bg-surface-container-lowest/80">
            <div>
              <h4 className="text-lg font-black tracking-tight text-on-surface">
                Pending quotation requests
              </h4>
              <p className="text-xs text-on-surface-variant mt-1">
                Venue: <span className="font-semibold">{vendorSlug || "—"}</span>
                {!analyticsLoading && (
                  <span className="text-outline"> · updates in real time</span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1.5 text-[10px] font-black rounded-full uppercase tracking-widest border bg-amber-500/10 text-amber-800 border-amber-500/20">
                {analyticsLoading ? "…" : `${pendingRecords.length} pending`}
              </span>
              <Link
                href="/vendor-dashboard/bookings"
                className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
              >
                Manage all
              </Link>
            </div>
          </div>

          {analyticsLoading ? (
            <p className="p-8 text-sm text-on-surface-variant font-medium text-center">
              Loading requests…
            </p>
          ) : pendingRecords.length === 0 ? (
            <p className="p-8 text-sm text-on-surface-variant font-medium text-center">
              No pending requests — you&apos;re all caught up.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-container-low/40 border-b border-outline-variant">
                  <tr>
                    <th className="px-5 py-3 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">
                      Customer
                    </th>
                    <th className="px-5 py-3 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">
                      Event date
                    </th>
                    <th className="px-5 py-3 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">
                      Guests
                    </th>
                    <th className="px-5 py-3 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">
                      Package
                    </th>
                    <th className="px-5 py-3 text-[10px] font-black text-on-surface-variant uppercase tracking-widest text-right">
                      Est. total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/50">
                  {pendingRecords.slice(0, 8).map((q) => (
                    <tr
                      key={q.docId || q.id}
                      className="hover:bg-primary-fixed/20 transition-colors"
                    >
                      <td className="px-5 py-4 font-bold text-on-surface">
                        {q.customer?.name || "Customer"}
                      </td>
                      <td className="px-5 py-4 text-on-surface-variant">
                        {q.eventDate || "—"}
                      </td>
                      <td className="px-5 py-4 text-on-surface-variant">
                        {q.raw?.eventDetails?.guests ?? "—"}
                      </td>
                      <td className="px-5 py-4 text-on-surface-variant max-w-[200px] truncate">
                        {q.service}
                      </td>
                      <td className="px-5 py-4 font-bold text-primary text-right whitespace-nowrap">
                        {Number(q.amount) > 0
                          ? `Rs. ${Number(q.amount).toLocaleString("en-PK")}`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 mb-8">
        <RecentBookings bookings={analytics.recentBookings} isLoading={analyticsLoading} />
        <Calendar />
      </section>

      <div className="flex justify-between items-center mb-4 px-1">
        <h3 className="text-lg font-black text-on-surface tracking-tight">Performance snapshot</h3>
        <Link
          href="/vendor-dashboard/analytics"
          className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
        >
          Full analytics →
        </Link>
      </div>

      <AnalyticsPreview
        last7DaysBookings={analytics.last7DaysBookings}
        servicePopularity={analytics.servicePopularity}
        isLoading={analyticsLoading}
      />
    </>
  );
};

export default VendorDashboard;
