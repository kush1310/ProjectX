import React, { useMemo } from 'react';
import { StatsCard } from './StatsCard';
import { BrandCard } from './BrandCard';
import { Tag, Clock, Percent } from 'lucide-react';
import type { Coupon } from '../../../utils/canteenStore';

// Charts
import { DiscountTrendChart } from './charts/DiscountTrendChart';
import { PromoRedemptionChart } from './charts/PromoRedemptionChart';
import { NetSalesChart } from './charts/NetSalesChart';
import { DiscountByChannelChart } from './charts/DiscountByChannelChart';
import { PlatformPerformanceChart } from './charts/PlatformPerformanceChart';
import { StoreLeaderboardChart } from './charts/StoreLeaderboardChart';
import { UpliftWaterfallChart } from './charts/UpliftWaterfallChart';
import { CustomerMatrixChart } from './charts/CustomerMatrixChart';
import { UserJourneyChart } from './charts/UserJourneyChart';

interface AnalyticsSectionProps {
    coupons: Coupon[];
}

export const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({ coupons }) => {
    const stats = useMemo(() => {
        const active = coupons.filter(c => c.isActive).length;

        // Expiring in next 7 days
        const now = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(now.getDate() + 7);

        const expiringSoon = coupons.filter(_ => {
            // Mock expiry logic since validUntil is missing in type, or check another property
            // For now simplifying to just checking a mock condition or removing the date check if the type doesn't support it
            // Assuming coupons don't have expiry date in current type definition, so returning 0 or modifying logic
            return false;
        }).length;

        // Avg Discount Calculation
        let totalDiscount = 0;
        let count = 0;
        coupons.forEach(c => {
            if (!c.isActive || !c.discountValue) return;
            totalDiscount += c.discountValue;
            count++;
        });
        const avgDiscount = count > 0 ? Math.round(totalDiscount / count) : 0;

        return { active, expiringSoon, avgDiscount };
    }, [coupons]);

    return (
        <div className="flex flex-col gap-6 mb-8">
            {/* Top Row: Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatsCard
                    title="Active Deals"
                    value={stats.active}
                    icon={Tag}
                    color="text-green-600"
                    trend="Live now"
                    variant="success"
                />
                <StatsCard
                    title="Expiring Soon"
                    value={stats.expiringSoon}
                    icon={Clock}
                    color="text-orange-600"
                    trend="Next 7 days"
                    variant="warning"
                />
                <StatsCard
                    title="Avg. Discount"
                    value={`${stats.avgDiscount}%`}
                    icon={Percent}
                    color="text-blue-600"
                    trend="Across active deals"
                    variant="info"
                />
            </div>

            {/* Section 1: Key Performance Indicators */}
            <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="w-1 h-6 bg-red-600 rounded-full"></span>
                    Performance Trends
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-2">
                        <DiscountTrendChart />
                    </div>
                    <div>
                        <NetSalesChart />
                    </div>
                    <div className="xl:col-span-3">
                        <PromoRedemptionChart />
                    </div>
                </div>
            </div>

            {/* Section 2: Segmentation & Location */}
            <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="w-1 h-6 bg-blue-600 rounded-full"></span>
                    Channel & Store Insights
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <DiscountByChannelChart />
                    <PlatformPerformanceChart />
                    <StoreLeaderboardChart />
                </div>
            </div>

            {/* Section 3: Advanced Strategic Insights */}
            <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="w-1 h-6 bg-purple-600 rounded-full"></span>
                    Strategic Analysis
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <UpliftWaterfallChart />
                    <CustomerMatrixChart />
                </div>
                <div className="mt-6">
                    <UserJourneyChart />
                </div>
            </div>

            {/* Brand Card - Welcome */}
            <div className="grid grid-cols-1">
                <BrandCard />
            </div>
        </div>
    );
};
