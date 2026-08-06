"use client";
import React from 'react';
import { motion } from 'framer-motion';

const DayBookings = () => {
    const bookings = [
        { time: '10:00 AM', customer: 'Sarah Jenkins', service: 'Cake Tasting', status: 'Confirmed' },
        { time: '01:30 PM', customer: 'Michael Chen', service: 'Menu Planning', status: 'Confirmed' },
        { time: '04:00 PM', customer: 'Amara Okafor', service: 'Site Visit', status: 'Pending' },
    ];

    return (
        <div className="bg-white p-8 rounded-3xl shadow-[0_8px_32px_rgba(124,82,170,0.05)] border border-outline-variant flex flex-col h-full">
            <div className="flex items-center justify-between mb-8">
                <h5 className="text-xl font-bold text-secondary">Bookings for the Day</h5>
                <span className="bg-tertiary-fixed text-on-tertiary-fixed-variant px-4 py-1 rounded-full text-xs font-black tracking-widest">
                    3 RESERVED
                </span>
            </div>
            
            <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="border-b border-outline-variant">
                        <tr className="text-xs font-black text-outline tracking-wider uppercase">
                            <th className="pb-4">Time</th>
                            <th className="pb-4">Customer</th>
                            <th className="pb-4">Service</th>
                            <th className="pb-4 text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/30">
                        {bookings.map((booking, idx) => (
                            <motion.tr 
                                key={idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="group hover:bg-surface-container-low transition-colors"
                            >
                                <td className="py-5 text-sm font-bold text-on-surface">{booking.time}</td>
                                <td className="py-5 text-sm text-on-surface-variant font-medium">{booking.customer}</td>
                                <td className="py-5 text-sm text-on-surface-variant font-medium">{booking.service}</td>
                                <td className="py-5 text-right">
                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider
                                        ${booking.status === 'Confirmed' 
                                            ? 'bg-emerald-100 text-emerald-700' 
                                            : 'bg-amber-100 text-amber-700'}
                                    `}>
                                        {booking.status}
                                    </span>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <button className="mt-8 pt-6 border-t border-outline-variant text-primary font-bold text-sm flex items-center justify-center gap-2 hover:gap-3 transition-all group">
                View Full Schedule 
                <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </button>
        </div>
    );
};

export default DayBookings;
