"use client";
import React from 'react';
import { motion } from 'framer-motion';

const AnalyticsPreview = ({ last7DaysBookings = [], servicePopularity = [], isLoading = false }) => {
    const barData = last7DaysBookings.length > 0
        ? last7DaysBookings
        : [
            { day: 'MON', height: '0%', active: false, count: 0 },
            { day: 'TUE', height: '0%', active: false, count: 0 },
            { day: 'WED', height: '0%', active: false, count: 0 },
            { day: 'THU', height: '0%', active: false, count: 0 },
            { day: 'FRI', height: '0%', active: false, count: 0 },
            { day: 'SAT', height: '0%', active: false, count: 0 },
            { day: 'SUN', height: '0%', active: false, count: 0 },
        ];

    const serviceData = servicePopularity.length > 0
        ? servicePopularity
        : [{ label: 'No booking data yet', value: 0, color: 'outline' }];

    return (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card-level-1 p-6 rounded-3xl bg-white">
                <h4 className="text-xl font-black tracking-tight mb-6">Last 7 Days Bookings</h4>
                {isLoading ? (
                    <p className="text-sm text-on-surface-variant font-bold py-16 text-center">Loading…</p>
                ) : (
                    <div className="h-[240px] flex items-end justify-between gap-4 px-4">
                        {barData.map((bar, idx) => (
                            <div key={idx} className="w-full flex flex-col items-center gap-2">
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: bar.height || '4%' }}
                                    transition={{ duration: 0.6, delay: idx * 0.08 }}
                                    className={`w-full min-h-[4px] rounded-full ${bar.active ? 'bg-primary shadow-lg shadow-primary/20' : 'bg-primary-fixed'}`}
                                    title={`${bar.count ?? 0} bookings`}
                                />
                                <span className={`text-[10px] font-black ${bar.active ? 'text-primary' : 'text-on-surface-variant'}`}>
                                    {bar.day}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="card-level-1 p-6 rounded-3xl bg-white">
                <div className="flex justify-between items-center mb-6">
                    <h4 className="text-xl font-black tracking-tight">Service Popularity</h4>
                    <span className="text-[10px] font-black text-outline uppercase tracking-widest">By event type</span>
                </div>
                <div className="space-y-6">
                    {serviceData.map((service, idx) => (
                        <div key={idx} className="space-y-2">
                            <div className="flex justify-between text-xs font-black tracking-wide">
                                <span>{service.label}</span>
                                <span className="text-on-surface-variant">
                                    {service.bookings != null ? `${service.bookings} bookings` : `${service.value}%`}
                                </span>
                            </div>
                            <div className="h-3 w-full bg-surface-container rounded-full overflow-hidden border border-outline-variant">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: service.width || `${service.value}%` }}
                                    transition={{ duration: 0.6, delay: idx * 0.1 }}
                                    className={
                                      service.color === "secondary"
                                        ? "h-full rounded-full bg-secondary"
                                        : service.color === "tertiary"
                                          ? "h-full rounded-full bg-tertiary"
                                          : "h-full rounded-full bg-primary"
                                    }
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default AnalyticsPreview;
