"use client";
import React from 'react';
import { motion } from 'framer-motion';

const BookingFilters = ({ onNewBooking }) => {
    return (
        <div className="bg-surface-container rounded-3xl p-6 flex flex-col xl:flex-row gap-6 items-center justify-between shadow-inner">
            <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
                {/* Search */}
                <div className="relative w-full sm:w-96 group">
                    <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">search</span>
                    <input 
                        className="w-full bg-white border-none rounded-full pl-14 pr-6 py-4 focus:ring-2 focus:ring-primary shadow-sm text-sm font-medium transition-all" 
                        placeholder="Search by customer or booking ID..." 
                        type="text"
                    />
                </div>
                
                {/* Status Filter */}
                <div className="flex gap-3">
                    <select className="bg-white border-none rounded-full px-6 py-4 focus:ring-2 focus:ring-primary shadow-sm text-xs font-black text-on-surface-variant uppercase tracking-widest min-w-[140px] appearance-none cursor-pointer">
                        <option>All Status</option>
                        <option>Pending</option>
                        <option>Confirmed</option>
                        <option>Completed</option>
                        <option>Cancelled</option>
                    </select>
                    <select className="bg-white border-none rounded-full px-6 py-4 focus:ring-2 focus:ring-primary shadow-sm text-xs font-black text-on-surface-variant uppercase tracking-widest min-w-[160px] appearance-none cursor-pointer">
                        <option>All Time</option>
                        <option>Today</option>
                        <option>This Week</option>
                        <option>This Month</option>
                    </select>
                </div>
            </div>

            <div className="flex items-center gap-4 w-full xl:w-auto justify-between sm:justify-end">
                {/* View Toggles */}
                <div className="flex bg-surface-variant p-1.5 rounded-full shadow-inner border border-outline-variant/30">
                    {[
                        { id: 'table', icon: 'table_chart', label: 'Table' },
                        { id: 'calendar', icon: 'calendar_month', label: 'Calendar' },
                        { id: 'grid', icon: 'grid_view', label: 'Cards' }
                    ].map((view) => (
                        <button 
                            key={view.id}
                            className={`flex items-center justify-center px-5 py-2 rounded-full gap-2 transition-all 
                                ${view.id === 'table' ? 'bg-white shadow-md text-primary' : 'text-on-surface-variant hover:bg-white/50'}
                            `}
                        >
                            <span className="material-symbols-outlined text-sm">{view.icon}</span>
                            <span className="text-[10px] font-black uppercase tracking-wider">{view.label}</span>
                        </button>
                    ))}
                </div>

                <motion.button 
                    onClick={onNewBooking}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-primary text-on-primary px-8 py-4 rounded-full font-black text-xs tracking-[0.2em] flex items-center gap-2 shadow-[0_8px_24px_rgba(224,64,160,0.3)] bouncy-microinteraction cursor-pointer"
                >
                    <span className="material-symbols-outlined">add</span>
                    NEW BOOKING
                </motion.button>
            </div>
        </div>
    );
};

export default BookingFilters;
