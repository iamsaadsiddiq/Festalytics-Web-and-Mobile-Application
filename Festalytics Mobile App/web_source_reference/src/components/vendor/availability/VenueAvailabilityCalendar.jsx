"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  buildMonthGrid,
  getMonthLabel,
  toDateKey,
} from "@/lib/firestore/venueCalendar";

const STATUS_STYLES = {
  available:
    "bg-white text-on-surface hover:bg-primary-fixed hover:text-primary border border-outline-variant/30",
  booked: "bg-primary text-white shadow-md",
  blackout: "bg-secondary text-white shadow-md",
  pending: "bg-amber-100 text-amber-800 border border-amber-300",
};

const STATUS_LABELS = {
  available: "Available",
  booked: "Booked",
  blackout: "Blackout",
  pending: "Pending",
};

export default function VenueAvailabilityCalendar({
  viewYear,
  viewMonth,
  selectedDateKey,
  onSelectDate,
  getStatus,
  onToggleDate,
  onPrevMonth,
  onNextMonth,
  onToday,
  compact = false,
}) {
  const todayKey = toDateKey(
    new Date().getFullYear(),
    new Date().getMonth(),
    new Date().getDate()
  );
  const cells = buildMonthGrid(viewYear, viewMonth);
  const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <div
      className={`bg-white rounded-3xl border border-outline-variant shadow-sm ${
        compact ? "p-5" : "p-6"
      }`}
    >
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-black text-on-surface text-sm uppercase tracking-wider">
          {getMonthLabel(viewYear, viewMonth)}
        </h4>
        <div className="flex gap-1 items-center">
          <button
            type="button"
            onClick={onToday}
            className="px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider text-primary hover:bg-primary-fixed transition-colors"
          >
            Today
          </button>
          <button
            type="button"
            onClick={onPrevMonth}
            className="w-8 h-8 rounded-full bg-surface-container-low hover:bg-surface-variant flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-lg">chevron_left</span>
          </button>
          <button
            type="button"
            onClick={onNextMonth}
            className="w-8 h-8 rounded-full bg-surface-container-low hover:bg-surface-variant flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-lg">chevron_right</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-outline uppercase mb-2">
        {dayLabels.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>

      <div className={`grid grid-cols-7 ${compact ? "gap-1" : "gap-2"}`}>
        {cells.map((cell, idx) => {
          if (cell.muted || !cell.dateKey) {
            return (
              <div
                key={`m-${idx}`}
                className={`${compact ? "h-9" : "h-10"} flex items-center justify-center text-[10px] text-outline-variant`}
              >
                {cell.day}
              </div>
            );
          }

          const status = getStatus(cell.dateKey);
          const isSelected = selectedDateKey === cell.dateKey;
          const isToday = cell.dateKey === todayKey;
          const eventCount =
            (status === "pending" ? 1 : 0) + (status === "booked" ? 1 : 0);

          return (
            <motion.button
              key={cell.dateKey}
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (selectedDateKey === cell.dateKey) {
                  onToggleDate?.(cell.dateKey);
                } else {
                  onSelectDate(cell.dateKey);
                }
              }}
              title={`${cell.dateKey} — ${STATUS_LABELS[status]}`}
              className={`${compact ? "h-9" : "h-10"} rounded-xl flex flex-col items-center justify-center text-xs font-black cursor-pointer transition-all relative
                ${STATUS_STYLES[status]}
                ${isSelected ? "ring-2 ring-tertiary ring-offset-2" : ""}
                ${isToday && !isSelected ? "ring-1 ring-tertiary/50" : ""}`}
            >
              {cell.day}
              {status === "pending" && (
                <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-amber-500" />
              )}
              {eventCount > 0 && status === "booked" && (
                <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-white/80" />
              )}
            </motion.button>
          );
        })}
      </div>

      <div className={`mt-4 pt-4 border-t border-outline-variant/30 space-y-2 ${compact ? "text-[10px]" : "text-xs"}`}>
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <div key={key} className="flex items-center gap-2">
            <div
              className={`w-4 h-4 rounded-md ${
                key === "available"
                  ? "bg-white border border-outline-variant/40"
                  : key === "booked"
                  ? "bg-primary"
                  : key === "blackout"
                  ? "bg-secondary"
                  : "bg-amber-100 border border-amber-300"
              }`}
            />
            <span className="font-bold text-on-surface-variant">{label}</span>
          </div>
        ))}
        <p className="text-[10px] text-outline font-medium pt-1">
          Click a day to select · click again to toggle blackout (when available)
        </p>
      </div>
    </div>
  );
}
