"use client";

import React from "react";
import { Calendar } from "lucide-react";
import { usePublicVenueCalendar } from "@/hooks/usePublicVenueCalendar";
import {
  buildMonthGrid,
  getMonthLabel,
  toDateKey,
} from "@/lib/firestore/venueCalendar";

const CUSTOMER_STATUS_STYLES = {
  available:
    "bg-white text-gray-800 border border-gray-100 hover:border-[#D6336C]/40 hover:text-[#D6336C] shadow-sm cursor-pointer",
  booked: "bg-[#D6336C] text-white shadow-sm cursor-not-allowed",
  blackout: "bg-slate-400 text-white cursor-not-allowed",
  pending: "bg-amber-100 text-amber-800 border border-amber-300 cursor-not-allowed",
};

const STATUS_LABELS = {
  available: "Available Slot",
  booked: "Fully Booked / Blocked Date",
  blackout: "Vendor Blackout / Maintenance Day",
  pending: "Pending Request (Not Open)",
};

/**
 * Customer-facing calendar — live sync with vendor dashboard (Firestore venues + bookings + quotations).
 */
export default function PublicVenueCalendar({
  venueSlug,
  selectedDateKey,
  onSelectDate,
  hallName,
}) {
  const cal = usePublicVenueCalendar(venueSlug);
  const todayKey = toDateKey(
    new Date().getFullYear(),
    new Date().getMonth(),
    new Date().getDate()
  );
  const cells = buildMonthGrid(cal.viewYear, cal.viewMonth);

  if (!venueSlug) return null;

  if (cal.isLoading) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-gray-100 flex justify-center py-12">
        <span className="animate-spin w-8 h-8 border-4 border-[#D6336C] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 space-y-6">
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-[#D6336C]" /> Availability Calendar
      </h2>
      <p className="text-sm text-gray-500 font-medium leading-relaxed">
        Live availability for {hallName || "this venue"}. Dates match the vendor dashboard —
        booked, blackout, and pending requests update in real time.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 shadow-inner">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-extrabold text-gray-800 text-sm uppercase tracking-wider">
              {getMonthLabel(cal.viewYear, cal.viewMonth)}
            </h4>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={cal.goToPrevMonth}
                className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center border border-gray-200"
                aria-label="Previous month"
              >
                <span className="material-symbols-outlined text-lg">chevron_left</span>
              </button>
              <button
                type="button"
                onClick={cal.goToNextMonth}
                className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center border border-gray-200"
                aria-label="Next month"
              >
                <span className="material-symbols-outlined text-lg">chevron_right</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-black text-gray-400 uppercase mb-2">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {cells.map((cell, idx) => {
              if (cell.muted || !cell.dateKey) {
                return (
                  <div
                    key={`e-${idx}`}
                    className="h-10 flex items-center justify-center text-[10px] text-gray-300"
                  >
                    {cell.day}
                  </div>
                );
              }

              const status = cal.getStatus(cell.dateKey);
              const isSelected = selectedDateKey === cell.dateKey;
              const isToday = cell.dateKey === todayKey;
              const selectable = cal.isDateSelectable(cell.dateKey);

              return (
                <button
                  key={cell.dateKey}
                  type="button"
                  disabled={!selectable}
                  onClick={() => selectable && onSelectDate?.(cell.dateKey)}
                  title={`${cell.dateKey} — ${STATUS_LABELS[status]}`}
                  className={`h-10 rounded-xl flex items-center justify-center text-xs font-black select-none transition-all
                    ${CUSTOMER_STATUS_STYLES[status]}
                    ${isSelected ? "ring-2 ring-[#D6336C] ring-offset-2" : ""}
                    ${isToday && !isSelected ? "ring-1 ring-[#D6336C]/40" : ""}`}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          {selectedDateKey && (
            <p className="mt-4 text-[10px] font-bold text-[#D6336C] uppercase tracking-wider text-center">
              Selected: {selectedDateKey}
            </p>
          )}
        </div>

        <div className="space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Calendar Legend
            </h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-lg bg-[#D6336C] shadow-sm" />
                <span className="text-xs font-bold text-gray-700">
                  {STATUS_LABELS.booked}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-lg bg-slate-400 shadow-sm" />
                <span className="text-xs font-bold text-gray-700">
                  {STATUS_LABELS.blackout}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-lg bg-amber-100 border border-amber-300 shadow-sm" />
                <span className="text-xs font-bold text-gray-700">
                  {STATUS_LABELS.pending}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-lg bg-white border border-gray-200 shadow-sm" />
                <span className="text-xs font-bold text-gray-700">
                  {STATUS_LABELS.available}
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-[#D6336C]/5 border border-[#D6336C]/10 rounded-2xl space-y-2">
            <span className="text-[10px] font-black text-[#D6336C] uppercase tracking-wider block">
              Planning an Event?
            </span>
            <p className="text-xs text-gray-600 leading-relaxed">
              Click an available date on the calendar or use the date field in the quote form.
              Unavailable dates cannot be selected.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
