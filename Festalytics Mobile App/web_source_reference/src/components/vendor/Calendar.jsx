"use client";
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useVenueCalendar } from '@/hooks/useVenueCalendar';
import VenueAvailabilityCalendar from '@/components/vendor/availability/VenueAvailabilityCalendar';

const Calendar = () => {
    const cal = useVenueCalendar();

    if (cal.isLoading) {
        return (
            <div className="card-level-1 rounded-3xl p-6 flex flex-col bg-white min-h-[320px] items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-primary animate-spin">sync</span>
            </div>
        );
    }

    return (
        <div className="card-level-1 rounded-3xl p-2 flex flex-col bg-white">
            <VenueAvailabilityCalendar
                compact
                viewYear={cal.viewYear}
                viewMonth={cal.viewMonth}
                selectedDateKey={cal.selectedDateKey}
                onSelectDate={cal.setSelectedDateKey}
                getStatus={cal.getStatus}
                onToggleDate={() => {}}
                onPrevMonth={cal.goToPrevMonth}
                onNextMonth={cal.goToNextMonth}
                onToday={cal.goToToday}
            />
            <motion.div className="px-4 pb-4">
                <Link
                    href="/vendor-dashboard/availability"
                    className="mt-2 w-full py-3.5 border-2 border-primary text-primary font-black rounded-full hover:bg-primary hover:text-white transition-all shadow-md uppercase tracking-widest text-[11px] text-center block no-underline"
                >
                    Open Full Calendar
                </Link>
            </motion.div>
        </div>
    );
};

export default Calendar;
