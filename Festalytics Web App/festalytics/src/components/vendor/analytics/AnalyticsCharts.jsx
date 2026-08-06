"use client";
import React from 'react';
import { motion } from 'framer-motion';

const EmptyChart = ({ message }) => (
    <div className="flex-1 flex items-center justify-center text-sm font-bold text-on-surface-variant">
        {message}
    </div>
);

export const RevenueTrendChart = ({ revenueTrend = [], isLoading = false }) => {
    const data = revenueTrend.length > 0 ? revenueTrend : [];
    const hasData = data.some((d) => d.revenue > 0);

    return (
        <div className="bg-white p-8 rounded-[2.5rem] border border-outline-variant shadow-xl shadow-primary/5 h-96 flex flex-col group">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h4 className="font-black text-xl text-on-surface tracking-tight">Revenue Trend</h4>
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-1">Last 6 months · confirmed revenue</p>
                </div>
            </div>
            <div className="flex-1 w-full bg-surface-container-low rounded-[2rem] relative overflow-hidden flex items-end px-8 pb-4">
                {isLoading ? (
                    <EmptyChart message="Loading revenue…" />
                ) : !hasData ? (
                    <EmptyChart message="No revenue data yet" />
                ) : (
                    <div className="w-full flex justify-between items-end h-full pt-12 gap-4">
                        {data.map((item, i) => (
                            <motion.div
                                key={item.label}
                                initial={{ height: 0 }}
                                animate={{ height: `${Math.max(item.height * 100, 4)}%` }}
                                transition={{ delay: i * 0.1, duration: 0.8, ease: "easeOut" }}
                                className={`w-full min-h-[4px] ${i === data.length - 1 ? 'bg-primary shadow-lg shadow-primary/30' : 'bg-primary-container'} rounded-t-2xl relative group/bar`}
                                title={`${item.label}: Rs. ${item.revenue.toLocaleString()}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export const BookingStatusChart = ({ statusBreakdown = [], statusTotal = 0, isLoading = false }) => {
    const total = statusTotal || 0;
    let offset = 0;
    const circles = statusBreakdown.map((item, i) => {
        const dash = total > 0 ? (item.count / total) * 100 : 0;
        const circle = { ...item, dash, offset: -offset };
        offset += dash;
        return circle;
    });
    const colors = ['#e040a0', '#7c52aa', '#0096cc', '#e53e3e'];

    return (
        <div className="bg-white p-8 rounded-[2.5rem] border border-outline-variant shadow-xl shadow-secondary/5 h-96 flex flex-col">
            <h4 className="font-black text-xl text-on-surface tracking-tight mb-8">Booking Status</h4>
            {isLoading ? (
                <EmptyChart message="Loading status breakdown…" />
            ) : total === 0 ? (
                <EmptyChart message="No bookings or quotations yet" />
            ) : (
                <div className="flex-1 flex items-center gap-10">
                    <div className="relative w-48 h-48 shrink-0">
                        <svg className="w-full h-full rotate-[-90deg]" viewBox="0 0 36 36">
                            {circles.map((item, i) => (
                                <circle
                                    key={item.label}
                                    cx="18"
                                    cy="18"
                                    r="15.9"
                                    fill="none"
                                    stroke={colors[i] || colors[0]}
                                    strokeWidth="4"
                                    strokeDasharray={`${item.dash}, 100`}
                                    strokeDashoffset={item.offset}
                                />
                            ))}
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-black text-on-surface">{total}</span>
                            <span className="text-[10px] font-black text-outline uppercase tracking-[0.2em] mt-1">Total</span>
                        </div>
                    </div>
                    <div className="space-y-4 flex-1">
                        {statusBreakdown.map((item, i) => (
                            <div key={item.label} className="flex justify-between items-center">
                                <span className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-on-surface-variant">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[i] }} />
                                    {item.label}
                                </span>
                                <span className="text-sm font-black text-on-surface">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export const PopularServicesChart = ({ services = [], isLoading = false }) => (
    <div className="bg-white p-8 rounded-[2.5rem] border border-outline-variant shadow-xl h-[480px] flex flex-col">
        <h4 className="font-black text-xl text-on-surface tracking-tight mb-8">Popular Services</h4>
        {isLoading ? (
            <EmptyChart message="Loading…" />
        ) : services.length === 0 ? (
            <EmptyChart message="No event categories booked yet" />
        ) : (
            <div className="space-y-8">
                {services.map((service, idx) => (
                    <div key={service.label} className="space-y-3">
                        <div className="flex justify-between text-[10px] font-black text-on-surface-variant uppercase tracking-widest">
                            <span>{service.label}</span>
                            <span>{service.bookings} BOOKINGS</span>
                        </div>
                        <div className="w-full h-4 bg-surface-container-high rounded-full overflow-hidden shadow-inner">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: service.width || `${service.value}%` }}
                                transition={{ delay: idx * 0.1 + 0.3, duration: 0.8 }}
                                className="h-full bg-primary rounded-full"
                            />
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
);

export const MonthlyPerformanceChart = ({ months = [], isLoading = false }) => {
    const hasData = months.some((m) => m.revenue > 0 || m.bookings > 0);

    return (
        <div className="bg-white p-8 rounded-[2.5rem] border border-outline-variant shadow-xl h-[480px] flex flex-col">
            <div className="flex justify-between items-center mb-10">
                <h4 className="font-black text-xl text-on-surface tracking-tight">Monthly Performance</h4>
                <div className="flex gap-6 text-[10px] font-black uppercase tracking-widest">
                    <span className="flex items-center gap-2"><div className="w-3 h-3 bg-primary rounded-full"></div> Revenue</span>
                    <span className="flex items-center gap-2"><div className="w-3 h-3 bg-tertiary rounded-full"></div> Bookings</span>
                </div>
            </div>
            {isLoading ? (
                <EmptyChart message="Loading…" />
            ) : !hasData ? (
                <EmptyChart message="No monthly data yet" />
            ) : (
                <div className="flex-1 flex items-end justify-between px-4 pb-4">
                    {months.map((month) => (
                        <div key={month.month} className="flex flex-col items-center gap-6 h-full w-14">
                            <div className="flex-1 flex items-end justify-center gap-1.5 w-full">
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${Math.max(month.h1, 4)}%` }}
                                    transition={{ delay: month.index * 0.05 + 0.3, duration: 0.8 }}
                                    className="w-4 bg-primary rounded-t-lg"
                                    title={`Rs. ${month.revenue.toLocaleString()}`}
                                />
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${Math.max(month.h2, 4)}%` }}
                                    transition={{ delay: month.index * 0.05 + 0.5, duration: 0.8 }}
                                    className="w-4 bg-tertiary rounded-t-lg"
                                    title={`${month.bookings} bookings`}
                                />
                            </div>
                            <span className="text-[10px] font-black text-outline uppercase tracking-widest">{month.month}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
