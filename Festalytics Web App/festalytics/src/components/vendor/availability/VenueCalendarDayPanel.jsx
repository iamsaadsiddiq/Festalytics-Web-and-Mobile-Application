"use client";

import React from "react";
import { motion } from "framer-motion";
import { formatDisplayDate } from "@/lib/firestore/venueCalendar";
import Link from "next/link";

export default function VenueCalendarDayPanel({
  selectedDateKey,
  selectedDayEvents,
  selectedDayHours,
  getStatus,
  onMarkBooked,
  onMarkBlackout,
  onMarkAvailable,
  onHoursChange,
  onSaveDay,
  isSaving,
}) {
  const status = getStatus(selectedDateKey);
  const allEvents = [
    ...(selectedDayEvents.bookings || []).map((b) => ({ ...b, type: "booking" })),
    ...(selectedDayEvents.quotations || []).map((q) => ({ ...q, type: "quotation" })),
  ];

  const statusBadge = {
    available: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
    booked: "bg-primary/10 text-primary border-primary/20",
    blackout: "bg-secondary/10 text-secondary border-secondary/20",
    pending: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-8 rounded-3xl shadow-[0_8px_32px_rgba(124,82,170,0.05)] border border-outline-variant"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-primary-container rounded-[2rem] flex items-center justify-center text-primary shadow-lg shadow-primary/10">
            <span className="material-symbols-outlined text-3xl">event</span>
          </div>
          <div>
            <h4 className="text-2xl md:text-3xl font-black text-secondary leading-tight tracking-tight">
              {formatDisplayDate(selectedDateKey)}
            </h4>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <span
                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${statusBadge[status]}`}
              >
                {status}
              </span>
              <span className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">
                {allEvents.length} event{allEvents.length !== 1 ? "s" : ""}
              </span>
              <span className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">
                {selectedDayHours.isAvailable !== false
                  ? `${selectedDayHours.from} – ${selectedDayHours.to}`
                  : "Closed"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onMarkBooked}
            className="px-5 py-2.5 rounded-full border-2 border-primary text-primary font-black text-[10px] tracking-widest hover:bg-primary-fixed transition-all"
          >
            Mark Booked
          </button>
          <button
            type="button"
            onClick={onMarkBlackout}
            className="px-5 py-2.5 rounded-full border-2 border-secondary text-secondary font-black text-[10px] tracking-widest hover:bg-secondary-container transition-all"
          >
            Mark Unavailable
          </button>
          <button
            type="button"
            onClick={onMarkAvailable}
            className="px-5 py-2.5 rounded-full border-2 border-outline text-outline font-black text-[10px] tracking-widest hover:bg-surface-variant transition-all"
          >
            Clear Day
          </button>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h5 className="text-[10px] font-black text-outline uppercase tracking-[0.2em]">
            Edit day hours
          </h5>
          <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-2xl border border-outline-variant/30">
            <span className="font-bold text-sm">Open for bookings</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={selectedDayHours.isAvailable !== false}
                onChange={(e) =>
                  onHoursChange(
                    selectedDayHours.from,
                    selectedDayHours.to,
                    e.target.checked
                  )
                }
                className="sr-only peer"
              />
              <div className="w-12 h-7 bg-outline-variant rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all" />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-outline uppercase tracking-widest">
                From
              </label>
              <input
                type="text"
                value={selectedDayHours.from}
                onChange={(e) =>
                  onHoursChange(e.target.value, selectedDayHours.to, selectedDayHours.isAvailable)
                }
                className="w-full mt-1 bg-surface-variant rounded-xl px-4 py-3 text-sm font-bold"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-outline uppercase tracking-widest">
                To
              </label>
              <input
                type="text"
                value={selectedDayHours.to}
                onChange={(e) =>
                  onHoursChange(selectedDayHours.from, e.target.value, selectedDayHours.isAvailable)
                }
                className="w-full mt-1 bg-surface-variant rounded-xl px-4 py-3 text-sm font-bold"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={onSaveDay}
            disabled={isSaving}
            className="w-full py-3 bg-primary text-white rounded-full font-black text-xs tracking-widest disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Day Settings"}
          </button>
        </div>

        <div>
          <h5 className="text-[10px] font-black text-outline uppercase tracking-[0.2em] mb-4">
            Bookings & quotations
          </h5>
          {allEvents.length === 0 ? (
            <p className="text-sm text-on-surface-variant font-medium py-6 text-center bg-surface-container-low rounded-2xl">
              No bookings or quotations on this date.
            </p>
          ) : (
            <ul className="space-y-3 max-h-64 overflow-y-auto">
              {allEvents.map((ev, idx) => (
                <li
                  key={`${ev.type}-${ev.id}-${idx}`}
                  className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex justify-between items-start gap-3"
                >
                  <div>
                    <p className="font-black text-sm text-on-surface">{ev.customer}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">{ev.service}</p>
                    <p className="text-[10px] text-outline font-bold uppercase mt-1">
                      {ev.type === "quotation" ? "Quotation" : ev.source || "Booking"} ·{" "}
                      {ev.timing || "—"}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-[9px] font-black uppercase shrink-0 ${
                      ev.status === "Confirmed"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {ev.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/vendor-dashboard/bookings"
            className="mt-4 inline-flex items-center gap-2 text-primary font-bold text-sm hover:underline"
          >
            Manage in Bookings
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
