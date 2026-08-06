"use client";
import React from 'react';
import { motion } from 'framer-motion';

/**
 * @param {{ stats?: { total: number, pending: number, confirmed: number, completed: number, confirmedPct: number }, isLoading?: boolean }} props
 */
const BookingStats = ({ stats, isLoading = false }) => {
    const {
        total = 0,
        pending = 0,
        confirmed = 0,
        completed = 0,
        confirmedPct = 0,
    } = stats || {};

    const display = (n) => (isLoading ? "—" : String(n));

    const cards = [
        {
            label: 'Total Bookings',
            value: display(total),
            change: total > 0 ? 'Live' : null,
            icon: 'list_alt',
            color: 'primary',
        },
        {
            label: 'Pending Approval',
            value: display(pending),
            change: pending > 0 ? 'New' : null,
            icon: 'pending_actions',
            color: 'tertiary',
        },
        {
            label: 'Confirmed',
            value: display(confirmed),
            change: total > 0 ? `${confirmedPct}%` : null,
            icon: 'check_circle',
            color: 'secondary',
        },
        {
            label: 'Completed',
            value: display(completed),
            change: null,
            icon: 'task_alt',
            color: 'outline',
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {cards.map((stat, idx) => (
                <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ y: -5 }}
                    className={`bg-white p-6 rounded-3xl border-b-4 border-${stat.color} shadow-lg hover:shadow-xl transition-all cursor-default relative overflow-hidden group`}
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className={`w-14 h-14 bg-${stat.color}/10 rounded-2xl flex items-center justify-center text-${stat.color} transition-transform group-hover:scale-110`}>
                            <span className="material-symbols-outlined text-3xl fill-1">{stat.icon}</span>
                        </div>
                        {stat.change && (
                            <span className={`text-[10px] font-black text-${stat.color} bg-${stat.color}-fixed px-3 py-1 rounded-full uppercase tracking-wider`}>
                                {stat.change}
                            </span>
                        )}
                    </div>
                    <p className="text-on-surface-variant font-bold text-sm uppercase tracking-widest">{stat.label}</p>
                    <h3 className="text-4xl font-black text-on-surface mt-2 tracking-tight">{stat.value}</h3>
                    <div className={`absolute -right-4 -bottom-4 w-20 h-20 bg-${stat.color}/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                </motion.div>
            ))}
        </div>
    );
};

export default BookingStats;
