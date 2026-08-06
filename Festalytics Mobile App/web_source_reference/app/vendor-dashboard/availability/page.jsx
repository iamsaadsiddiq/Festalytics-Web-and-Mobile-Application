"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import VenueCalendarWorkspace from "@/components/vendor/availability/VenueCalendarWorkspace";

const AvailabilityPage = () => {
  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-80px)]">
      <header className="flex flex-wrap justify-between items-center gap-6 mb-8 px-2">
        <div>
          <h2 className="text-4xl font-black text-on-surface tracking-tight mb-2">
            Availability
          </h2>
          <p className="text-secondary font-bold uppercase text-[10px] tracking-[0.2em]">
            Same calendar as My Services · live bookings & quotations
          </p>
        </div>
        <Link
          href="/vendor-dashboard/my-services"
          className="text-xs font-black text-primary uppercase tracking-widest hover:underline"
        >
          Edit venue in My Services →
        </Link>
      </header>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white/50 rounded-[2rem] p-4 md:p-6 border border-outline-variant/20"
      >
        <VenueCalendarWorkspace variant="full" publishLabel="Save Calendar" />
      </motion.div>
    </div>
  );
};

export default AvailabilityPage;
