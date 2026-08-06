"use client";
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const RecentBookings = ({ bookings = [], isLoading = false }) => {
    return (
        <div className="bg-white border border-outline-variant/70 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest/80">
                <h4 className="text-lg font-black tracking-tight text-on-surface">Recent activity</h4>
                <Link href="/vendor-dashboard/bookings">
                    <motion.span
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="text-primary font-bold hover:underline bg-primary-fixed px-4 py-1.5 rounded-full inline-block cursor-pointer"
                    >
                        View All Bookings
                    </motion.span>
                </Link>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-surface-container-low/30 border-b border-outline-variant">
                        <tr>
                            <th className="px-6 py-4 text-xs font-black text-on-surface-variant uppercase tracking-widest">Customer Name</th>
                            <th className="px-6 py-4 text-xs font-black text-on-surface-variant uppercase tracking-widest">Service</th>
                            <th className="px-6 py-4 text-xs font-black text-on-surface-variant uppercase tracking-widest">Date</th>
                            <th className="px-6 py-4 text-xs font-black text-on-surface-variant uppercase tracking-widest">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant">
                        {isLoading ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-10 text-center text-sm text-on-surface-variant font-bold">
                                    Loading bookings…
                                </td>
                            </tr>
                        ) : bookings.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-10 text-center text-sm text-on-surface-variant font-bold">
                                    No bookings yet. Walk-ins and quotations will appear here.
                                </td>
                            </tr>
                        ) : (
                            bookings.map((booking, idx) => (
                                <motion.tr
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    key={`${booking.customer}-${idx}`}
                                    className="hover:bg-primary-fixed/30 transition-colors"
                                >
                                    <td className="px-6 py-6 font-bold text-on-surface">{booking.customer}</td>
                                    <td className="px-6 py-6 text-on-surface-variant">{booking.service}</td>
                                    <td className="px-6 py-6 text-on-surface-variant">{booking.date}</td>
                                    <td className="px-6 py-6">
                                        <span className={`px-4 py-1.5 text-[10px] font-black rounded-full uppercase tracking-widest border ${booking.statusColor}`}>
                                            {booking.status}
                                        </span>
                                    </td>
                                </motion.tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RecentBookings;
