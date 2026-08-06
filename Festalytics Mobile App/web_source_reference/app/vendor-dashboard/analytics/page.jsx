"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { useVendorAnalyticsData } from '@/hooks/useVendorAnalyticsData';
import AnalyticsKPIs from '@/components/vendor/analytics/AnalyticsKPIs';
import { 
    RevenueTrendChart, 
    BookingStatusChart, 
    PopularServicesChart, 
    MonthlyPerformanceChart 
} from '@/components/vendor/analytics/AnalyticsCharts';
import { 
    SatisfactionPanel, 
    ServicePerformanceTable, 
    PaymentActivityTable 
} from '@/components/vendor/analytics/AnalyticsTables';

const AnalyticsPage = () => {
    const { analytics, isLoading, venueId, error } = useVendorAnalyticsData();

    return (
        <div className="flex flex-col gap-10 pb-12">
            <header className="flex flex-wrap justify-between items-center gap-6 px-4">
                <div>
                    <h2 className="text-4xl font-black text-on-surface tracking-tighter mb-2">Analytics</h2>
                    <p className="text-secondary font-bold uppercase text-[10px] tracking-[0.2em]">
                        Live data for {venueId || "your venue"}
                    </p>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-surface-container-high rounded-full px-5 py-2.5 gap-3 text-on-surface-variant font-black text-[10px] uppercase tracking-widest border border-outline-variant shadow-sm">
                        <span className="material-symbols-outlined text-sm">calendar_month</span>
                        <span>Last 6 months</span>
                    </div>
                </div>
            </header>

            {error && (
                <p className="mx-4 px-4 py-3 rounded-2xl bg-error-container text-on-error-container text-sm font-bold">
                    {error}
                </p>
            )}

            <AnalyticsKPIs analytics={analytics} isLoading={isLoading} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <RevenueTrendChart revenueTrend={analytics.revenueTrend} isLoading={isLoading} />
                <BookingStatusChart
                    statusBreakdown={analytics.statusBreakdown}
                    statusTotal={analytics.statusTotal}
                    isLoading={isLoading}
                />
                <PopularServicesChart services={analytics.servicePopularity} isLoading={isLoading} />
                <MonthlyPerformanceChart months={analytics.monthlyPerformance} isLoading={isLoading} />
            </div>

            <SatisfactionPanel
                averageRating={analytics.averageRating}
                reviewCount={analytics.reviewCount}
                latestReviews={analytics.latestReviews}
                isLoading={isLoading}
            />

            <ServicePerformanceTable rows={analytics.servicePerformance} isLoading={isLoading} />
            <PaymentActivityTable
                weeklyPerformance={analytics.weeklyPerformance}
                recentPayments={analytics.recentPayments}
                isLoading={isLoading}
            />
        </div>
    );
};

export default AnalyticsPage;
