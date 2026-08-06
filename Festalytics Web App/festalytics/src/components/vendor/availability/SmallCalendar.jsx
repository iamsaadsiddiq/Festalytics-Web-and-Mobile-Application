"use client";
import React from 'react';
import { motion } from 'framer-motion';

const SmallCalendar = () => {
    // Mock data for March 2024
    const days = Array.from({ length: 31 }, (_, i) => i + 1);
    const startOffset = 4; // March 2024 starts on Friday (if Mon=0, then Mon, Tue, Wed, Thu = 4 empty)
    
    return (
        <div className="bg-white p-6 rounded-3xl shadow-[0_8px_32px_rgba(124,82,170,0.1)] border border-outline-variant h-fit">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-secondary">March 2024</h3>
                <div className="flex gap-1">
                    <button className="p-2 hover:bg-surface-container-low rounded-full transition-colors text-primary font-bold">
                        <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    <button className="p-2 hover:bg-surface-container-low rounded-full transition-colors text-primary font-bold">
                        <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                    <div key={idx} className={`text-center text-xs font-bold py-2 ${idx >= 5 ? 'text-primary' : 'text-outline'}`}>
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {/* Empty slots for previous month */}
                {Array.from({ length: startOffset }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-14 flex items-center justify-center text-outline-variant text-sm font-medium">
                        {26 + i}
                    </div>
                ))}

                {/* Days of March */}
                {days.map(day => {
                    const isToday = day === 12;
                    const isSelected = day === 15;
                    const hasBookings = [4, 15].includes(day);
                    const isAvailable = [1, 6, 12, 20].includes(day);

                    return (
                        <motion.div
                            key={day}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className={`h-14 flex flex-col items-center justify-center text-sm font-bold relative rounded-2xl cursor-pointer transition-colors group
                                ${isSelected ? 'bg-tertiary text-white shadow-[0_4px_12px_rgba(0,150,204,0.3)]' : ''}
                                ${isToday && !isSelected ? 'border-2 border-tertiary bg-white' : ''}
                                ${!isSelected && !isToday ? 'hover:bg-surface-container text-on-surface' : ''}
                            `}
                        >
                            {day}
                            
                            {/* Booking Indicator */}
                            {hasBookings && (
                                <div className={`absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded-full border border-white text-[10px] 
                                    ${isSelected ? 'bg-white text-tertiary' : 'bg-tertiary-container text-on-tertiary-container'}
                                `}>
                                    {day === 15 ? 3 : 2}
                                </div>
                            )}

                            {/* Availability Dot */}
                            {isAvailable && (
                                <div className="absolute bottom-2 flex gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            <div className="mt-8 pt-6 border-t border-outline-variant space-y-3">
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Available for Booking</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-tertiary-container"></div>
                    <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Upcoming Bookings</span>
                </div>
            </div>
        </div>
    );
};

export default SmallCalendar;
