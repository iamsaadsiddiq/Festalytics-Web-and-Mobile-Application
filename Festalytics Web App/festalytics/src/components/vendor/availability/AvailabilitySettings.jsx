"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';

const AvailabilitySettings = () => {
    const [isAvailable, setIsAvailable] = useState(true);
    const [recurrence, setRecurrence] = useState('day');

    return (
        <div className="bg-white p-8 rounded-3xl shadow-[0_8px_32px_rgba(124,82,170,0.05)] border border-outline-variant space-y-8">
            <div>
                <h5 className="text-xl font-bold text-secondary mb-8">Availability Settings</h5>
                
                {/* Toggle */}
                <div className="flex items-center justify-between p-6 bg-surface-container-low rounded-3xl mb-8 border border-outline-variant/30">
                    <div className="flex items-center gap-4">
                        <span className={`material-symbols-outlined text-3xl ${isAvailable ? 'text-primary' : 'text-outline'}`}>
                            {isAvailable ? 'check_circle' : 'cancel'}
                        </span>
                        <div>
                            <span className="font-bold text-lg text-on-surface block leading-none">Is Available</span>
                            <span className="text-xs text-on-surface-variant font-medium mt-1 inline-block">Toggle your availability for this date</span>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={isAvailable}
                            onChange={(e) => setIsAvailable(e.target.checked)}
                            className="sr-only peer" 
                        />
                        <div className="w-14 h-8 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                </div>

                {/* Time Pickers */}
                <div className="grid grid-cols-2 gap-6 mb-10">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-outline uppercase px-2 tracking-widest">From</label>
                        <div className="relative group">
                            <input 
                                className="w-full bg-surface-variant border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-primary transition-all" 
                                type="text" 
                                defaultValue="9:00 AM"
                            />
                            <span className="material-symbols-outlined absolute right-5 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl group-focus-within:text-primary transition-colors">schedule</span>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-outline uppercase px-2 tracking-widest">To</label>
                        <div className="relative group">
                            <input 
                                className="w-full bg-surface-variant border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-primary transition-all" 
                                type="text" 
                                defaultValue="6:00 PM"
                            />
                            <span className="material-symbols-outlined absolute right-5 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl group-focus-within:text-primary transition-colors">schedule</span>
                        </div>
                    </div>
                </div>

                {/* Recurring Pattern */}
                <div className="space-y-5">
                    <label className="text-[10px] font-black text-outline uppercase px-2 tracking-widest">Recurring Pattern</label>
                    <div className="grid grid-cols-1 gap-3">
                        {[
                            { id: 'day', label: 'This day only', icon: 'today' },
                            { id: 'week', label: 'This week (Mon-Fri)', icon: 'date_range' },
                            { id: 'month', label: 'Every Friday this month', icon: 'calendar_view_month' }
                        ].map((option) => (
                            <label 
                                key={option.id}
                                className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all border-2 
                                    ${recurrence === option.id 
                                        ? 'border-primary bg-primary-fixed text-on-primary-fixed-variant' 
                                        : 'border-transparent bg-surface-container hover:bg-surface-variant text-on-surface'
                                    }
                                `}
                            >
                                <input 
                                    type="radio" 
                                    name="recurrence" 
                                    className="hidden" 
                                    checked={recurrence === option.id}
                                    onChange={() => setRecurrence(option.id)}
                                />
                                <span className={`material-symbols-outlined ${recurrence === option.id ? 'fill-1' : ''}`}>
                                    {option.icon}
                                </span>
                                <span className="font-bold text-sm">{option.label}</span>
                                {recurrence === option.id && (
                                    <span className="material-symbols-outlined ml-auto text-primary">check_circle</span>
                                )}
                            </label>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AvailabilitySettings;
