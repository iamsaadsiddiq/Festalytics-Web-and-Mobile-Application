"use client";
import React from 'react';
import { motion } from 'framer-motion';

export const SatisfactionPanel = ({
    averageRating = 0,
    reviewCount = 0,
    latestReviews = [],
    isLoading = false,
}) => {
    const displayRating = averageRating > 0 ? averageRating.toFixed(1) : "—";
    const fullStars = averageRating > 0 ? Math.floor(averageRating) : 0;
    const halfStar = averageRating > 0 && averageRating % 1 >= 0.25 && averageRating % 1 < 0.75;

    return (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 bg-white p-10 rounded-[2.5rem] border border-outline-variant shadow-xl flex flex-col items-center">
                <h4 className="font-black text-xl text-on-surface self-start mb-8 tracking-tight">Customer Satisfaction</h4>
                <div className="text-7xl font-black text-primary mb-3 tracking-tighter">{isLoading ? "—" : displayRating}</div>
                <div className="flex mb-8 scale-150">
                    {Array.from({ length: 5 }, (_, i) => (
                        <span
                            key={i}
                            className={`material-symbols-outlined text-primary ${i < fullStars || (i === fullStars && halfStar) ? 'fill-1' : ''}`}
                        >
                            {i < fullStars ? 'star' : i === fullStars && halfStar ? 'star_half' : 'star_outline'}
                        </span>
                    ))}
                </div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                    {reviewCount > 0 ? `${reviewCount} reviews in your venue profile` : "Add reviews in My Services"}
                </p>
            </div>

            <div className="lg:col-span-2 bg-white p-10 rounded-[2.5rem] border border-outline-variant shadow-xl">
                <div className="flex justify-between items-center mb-8">
                    <h4 className="font-black text-xl text-on-surface tracking-tight">Latest Reviews</h4>
                </div>
                {isLoading ? (
                    <p className="text-sm text-on-surface-variant font-bold">Loading reviews…</p>
                ) : latestReviews.length === 0 ? (
                    <p className="text-sm text-on-surface-variant font-bold py-8 text-center">
                        No customer reviews stored for your venue yet.
                    </p>
                ) : (
                    <div className="space-y-5">
                        {latestReviews.map((review, idx) => (
                            <motion.div
                                key={idx}
                                whileHover={{ x: 6 }}
                                className="p-6 rounded-3xl bg-surface-container-low border border-outline-variant"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-secondary-fixed flex items-center justify-center text-secondary font-black text-sm">
                                            {review.initials}
                                        </div>
                                        <div>
                                            <div className="text-sm font-black text-on-surface">{review.name}</div>
                                            <div className="text-[10px] text-outline font-black uppercase tracking-[0.1em] mt-1">{review.service}</div>
                                        </div>
                                    </div>
                                    <div className="flex text-primary gap-0.5">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <span key={i} className={`material-symbols-outlined text-sm ${i < review.rating ? 'fill-1' : ''}`}>
                                                {i < review.rating ? 'star' : 'star_outline'}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                {review.comment && (
                                    <p className="text-xs text-on-surface-variant font-medium leading-relaxed">&ldquo;{review.comment}&rdquo;</p>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export const ServicePerformanceTable = ({ rows = [], isLoading = false }) => (
    <div className="bg-white rounded-[2.5rem] border border-outline-variant shadow-xl overflow-hidden">
        <div className="p-8 border-b border-outline-variant flex justify-between items-center bg-surface-container-low/50">
            <h4 className="font-black text-xl text-on-surface tracking-tight">Service Performance</h4>
            <span className="text-[10px] font-black text-outline uppercase tracking-widest">By event / menu type</span>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-surface-container-low/50 text-[10px] font-black text-outline uppercase tracking-[0.2em]">
                    <tr>
                        <th className="px-8 py-5">Service</th>
                        <th className="px-8 py-5">Bookings</th>
                        <th className="px-8 py-5 text-right">Revenue</th>
                        <th className="px-8 py-5 text-center">Avg Rating</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                    {isLoading ? (
                        <tr>
                            <td colSpan={4} className="px-8 py-10 text-center text-sm font-bold text-on-surface-variant">Loading…</td>
                        </tr>
                    ) : rows.length === 0 ? (
                        <tr>
                            <td colSpan={4} className="px-8 py-10 text-center text-sm font-bold text-on-surface-variant">
                                No service performance data yet
                            </td>
                        </tr>
                    ) : (
                        rows.map((row, idx) => (
                            <tr key={idx} className="hover:bg-surface-container-low transition-colors">
                                <td className="px-8 py-5 font-black text-on-surface text-sm">{row.name}</td>
                                <td className="px-8 py-5 font-bold text-on-surface-variant text-sm">{row.bookings}</td>
                                <td className="px-8 py-5 font-black text-primary text-sm text-right">{row.revenue}</td>
                                <td className="px-8 py-5 text-center font-black text-sm text-primary">{row.rating}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    </div>
);

export const PaymentActivityTable = ({
    weeklyPerformance = [],
    recentPayments = [],
    isLoading = false,
}) => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-[2.5rem] border border-outline-variant shadow-xl overflow-hidden">
            <div className="p-8 border-b border-outline-variant bg-surface-container-low/50">
                <h4 className="font-black text-lg text-on-surface tracking-tight">Last 7 Days</h4>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-surface-container-low/50 text-[10px] font-black text-outline uppercase tracking-[0.2em]">
                        <tr>
                            <th className="px-8 py-5">Day</th>
                            <th className="px-8 py-5">Bookings</th>
                            <th className="px-8 py-5 text-right">Revenue</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/30">
                        {isLoading ? (
                            <tr><td colSpan={3} className="px-8 py-8 text-center text-sm font-bold text-on-surface-variant">Loading…</td></tr>
                        ) : (
                            weeklyPerformance.map((row, idx) => (
                                <tr key={idx} className={row.active ? 'bg-primary-fixed/20' : ''}>
                                    <td className="px-8 py-4 font-black text-sm text-on-surface">{row.day}</td>
                                    <td className="px-8 py-4 font-bold text-sm text-on-surface-variant">{row.bookings}</td>
                                    <td className="px-8 py-4 font-black text-sm text-right text-on-surface-variant">{row.revenue}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-outline-variant shadow-xl overflow-hidden">
            <div className="p-8 border-b border-outline-variant bg-surface-container-low/50">
                <h4 className="font-black text-lg text-on-surface tracking-tight">Recent Advance Payments</h4>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-surface-container-low/50 text-[10px] font-black text-outline uppercase tracking-[0.2em]">
                        <tr>
                            <th className="px-8 py-5">Event Date</th>
                            <th className="px-8 py-5">Booking ID</th>
                            <th className="px-8 py-5">Amount</th>
                            <th className="px-8 py-5 text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/30">
                        {isLoading ? (
                            <tr><td colSpan={4} className="px-8 py-8 text-center text-sm font-bold text-on-surface-variant">Loading…</td></tr>
                        ) : recentPayments.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-8 py-10 text-center text-sm font-bold text-on-surface-variant">
                                    No advance payments recorded yet
                                </td>
                            </tr>
                        ) : (
                            recentPayments.map((row, idx) => (
                                <tr key={idx} className="hover:bg-surface-container-low transition-colors">
                                    <td className="px-8 py-4 text-xs font-black text-outline uppercase tracking-widest">{row.date}</td>
                                    <td className="px-8 py-4 font-black text-primary text-sm tracking-widest">{row.id}</td>
                                    <td className="px-8 py-4 font-black text-on-surface text-sm">{row.amount}</td>
                                    <td className="px-8 py-4 text-right">
                                        <span className={`px-4 py-1.5 text-[10px] font-black rounded-full uppercase tracking-widest ${
                                            row.status === 'Paid'
                                                ? 'bg-tertiary-fixed text-tertiary'
                                                : 'bg-secondary-fixed text-secondary'
                                        }`}>
                                            {row.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
);
