"use client";
import React from 'react';
import { motion } from 'framer-motion';

const AnalyticsKPIs = ({ analytics, isLoading = false }) => {
    const {
        totalRevenue = 0,
        totalBookings = 0,
        conversionRate = 0,
        averageRating = 0,
        reviewCount = 0,
    } = analytics || {};

    const kpis = [
        {
            label: 'Total Revenue',
            value: isLoading ? '—' : totalRevenue > 0 ? `Rs. ${totalRevenue.toLocaleString()}` : 'Rs. 0',
            trend: totalRevenue > 0 ? 'Live' : null,
            icon: 'payments',
            color: 'primary',
            bg: 'primary-fixed',
            shadow: 'candy-shadow-pink',
            sub: 'Confirmed quotations & bookings',
        },
        {
            label: 'Total Requests',
            value: isLoading ? '—' : String(totalBookings),
            trend: totalBookings > 0 ? 'Live' : null,
            icon: 'calendar_today',
            color: 'secondary',
            bg: 'secondary-container',
            sub: analytics?.confirmedCount != null
                ? `${analytics.confirmedCount} confirmed · ${analytics.pendingCount || 0} pending`
                : 'Quotations & walk-in bookings',
        },
        {
            label: 'Conversion Rate',
            value: isLoading ? '—' : totalBookings > 0 ? `${conversionRate}%` : '—',
            trend: null,
            icon: 'filter_alt',
            color: 'tertiary',
            bg: 'tertiary-fixed',
            sub: 'Confirmed vs all requests',
        },
        {
            label: 'Average Rating',
            value: isLoading ? '—' : averageRating > 0 ? `${averageRating.toFixed(1)}/5` : '—',
            trend: averageRating > 0 ? averageRating.toFixed(1) : null,
            icon: 'star',
            color: 'primary',
            bg: 'surface-container-high',
            isRating: true,
            sub: reviewCount > 0 ? `From ${reviewCount} reviews` : 'No reviews yet',
        },
    ];

    return (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {kpis.map((kpi, idx) => (
                <motion.div
                    key={kpi.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ scale: 1.03 }}
                    className={`bg-white p-6 rounded-3xl border border-outline-variant shadow-lg hover:shadow-xl transition-all duration-300 ${kpi.shadow || ''}`}
                >
                    <div className="flex justify-between items-start mb-6">
                        <div className={`p-3 bg-${kpi.bg} rounded-2xl text-${kpi.color}`}>
                            <span className={`material-symbols-outlined text-2xl ${kpi.isRating ? 'fill-1' : ''}`}>
                                {kpi.icon}
                            </span>
                        </div>
                        {kpi.trend && (
                            <div className="flex items-center gap-1 font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-wider bg-primary-fixed text-primary">
                                {kpi.trend}
                            </div>
                        )}
                    </div>
                    <h3 className="text-on-surface-variant text-[10px] font-black uppercase tracking-[0.15em]">{kpi.label}</h3>
                    <p className="text-4xl font-black text-on-surface mt-2 tracking-tight">{kpi.value}</p>
                    <p className="text-[10px] font-bold text-on-surface-variant/60 mt-3 uppercase tracking-widest">
                        {kpi.sub}
                    </p>
                </motion.div>
            ))}
        </section>
    );
};

export default AnalyticsKPIs;
