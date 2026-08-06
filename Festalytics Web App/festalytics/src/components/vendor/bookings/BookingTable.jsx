"use client";
import React from 'react';

/**
 * Legacy table component — bookings page renders its own table from live Firestore data.
 * Kept for reuse; pass `bookings` from parent when wiring a standalone table view.
 */
const BookingTable = ({ bookings = [], isLoading = false }) => {
    if (isLoading) {
        return (
            <p className="p-12 text-center text-outline font-bold uppercase tracking-widest text-xs">
                Loading bookings…
            </p>
        );
    }

    if (!bookings.length) {
        return (
            <p className="p-12 text-center text-outline font-bold uppercase tracking-widest text-xs">
                No bookings or quotation requests yet.
            </p>
        );
    }

    return (
        <p className="p-6 text-center text-sm text-on-surface-variant">
            {bookings.length} booking{bookings.length === 1 ? "" : "s"} — use the main Bookings page table view.
        </p>
    );
};

export default BookingTable;
