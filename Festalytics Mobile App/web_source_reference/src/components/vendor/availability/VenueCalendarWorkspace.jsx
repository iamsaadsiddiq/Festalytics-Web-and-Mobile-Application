"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useVenueCalendar } from "@/hooks/useVenueCalendar";
import VenueAvailabilityCalendar from "./VenueAvailabilityCalendar";
import VenueCalendarDayPanel from "./VenueCalendarDayPanel";

/**
 * Shared calendar workspace — same data on My Services (Calendar tab) and Availability page.
 */
export default function VenueCalendarWorkspace({
  variant = "full",
  showHeader = true,
  publishLabel = "Save Calendar",
}) {
  const cal = useVenueCalendar();
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const triggerToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3500);
  };

  const handlePublish = async () => {
    const ok = await cal.persistCalendar();
    triggerToast(
      ok ? "Calendar saved — synced across My Services & Availability." : cal.error || "Save failed",
      ok ? "success" : "error"
    );
  };

  const handleSaveDay = async () => {
    const ok = await cal.persistCalendar();
    triggerToast(ok ? "Day settings saved." : cal.error || "Save failed", ok ? "success" : "error");
  };

  if (cal.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8 relative">
      {toast.show && (
        <div
          className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider shadow-xl ${
            toast.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-rose-600 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}

      {cal.error && (
        <p className="text-sm text-rose-600 font-bold bg-rose-50 px-4 py-3 rounded-xl">{cal.error}</p>
      )}

      {showHeader && (
        <div className="flex flex-wrap justify-between items-center gap-4 pb-4 border-b border-outline-variant/20">
          <div>
            <h3 className="text-2xl font-black text-on-surface tracking-tight">
              Availability Calendar
            </h3>
            <p className="text-sm font-medium text-on-surface-variant mt-1">
              Synced with Firestore · bookings, quotations & blackout dates for{" "}
              <span className="text-primary font-bold">{cal.venueId}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {variant === "embedded" && (
              <Link
                href="/vendor-dashboard/availability"
                className="px-5 py-3 rounded-full text-xs font-black border-2 border-secondary text-secondary hover:bg-secondary-container transition-all"
              >
                Open Full Calendar
              </Link>
            )}
            <motion.button
              type="button"
              onClick={handlePublish}
              disabled={cal.isSaving}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="px-6 py-3 rounded-full text-xs font-black text-white bg-primary shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">cloud_upload</span>
              {cal.isSaving ? "Saving..." : publishLabel}
            </motion.button>
          </div>
        </div>
      )}

      <div
        className={
          variant === "full"
            ? "flex flex-col xl:flex-row gap-8"
            : "grid grid-cols-1 lg:grid-cols-2 gap-8"
        }
      >
        <aside className={variant === "full" ? "w-full xl:w-[420px] shrink-0" : ""}>
          <VenueAvailabilityCalendar
            viewYear={cal.viewYear}
            viewMonth={cal.viewMonth}
            selectedDateKey={cal.selectedDateKey}
            onSelectDate={cal.setSelectedDateKey}
            getStatus={cal.getStatus}
            onToggleDate={cal.toggleDateStatus}
            onPrevMonth={cal.goToPrevMonth}
            onNextMonth={cal.goToNextMonth}
            onToday={cal.goToToday}
            compact={variant === "embedded"}
          />
        </aside>

        {variant === "full" && (
          <main className="flex-1 space-y-8">
            <VenueCalendarDayPanel
              selectedDateKey={cal.selectedDateKey}
              selectedDayEvents={cal.selectedDayEvents}
              selectedDayHours={cal.selectedDayHours}
              getStatus={cal.getStatus}
              onMarkBooked={cal.markSelectedAsBooked}
              onMarkBlackout={cal.markSelectedAsBlackout}
              onMarkAvailable={cal.markSelectedAsAvailable}
              onHoursChange={cal.setSelectedDayHours}
              onSaveDay={handleSaveDay}
              isSaving={cal.isSaving}
            />

            <div className="flex flex-wrap items-center gap-4">
              <motion.button
                type="button"
                onClick={cal.markSelectedAsBlackout}
                whileHover={{ scale: 1.03 }}
                className="bg-error-container text-on-error-container px-8 py-4 rounded-full font-black text-xs tracking-widest flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-error">block</span>
                Mark Unavailable
              </motion.button>
              <motion.button
                type="button"
                onClick={handlePublish}
                disabled={cal.isSaving}
                whileHover={{ scale: 1.03 }}
                className="bg-primary text-white px-10 py-4 rounded-full font-black text-xs tracking-widest ml-auto disabled:opacity-50"
              >
                {cal.isSaving ? "Saving..." : "Save All Changes"}
              </motion.button>
            </div>
          </main>
        )}
      </div>

      {variant === "embedded" && (
        <VenueCalendarDayPanel
          selectedDateKey={cal.selectedDateKey}
          selectedDayEvents={cal.selectedDayEvents}
          selectedDayHours={cal.selectedDayHours}
          getStatus={cal.getStatus}
          onMarkBooked={cal.markSelectedAsBooked}
          onMarkBlackout={cal.markSelectedAsBlackout}
          onMarkAvailable={cal.markSelectedAsAvailable}
          onHoursChange={cal.setSelectedDayHours}
          onSaveDay={handleSaveDay}
          isSaving={cal.isSaving}
        />
      )}
    </div>
  );
}
