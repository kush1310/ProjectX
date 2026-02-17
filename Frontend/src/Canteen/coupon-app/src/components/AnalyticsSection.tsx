import React, { useMemo } from 'react';
import { StatsCard } from './StatsCard';
import { AnalyticsGraph } from './AnalyticsGraph';
import { BrandCard } from './BrandCard';
import { Tag, Clock, Percent } from 'lucide-react';
import type { Coupon } from '@/Canteen/utils/canteenStore';

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

        const expiringSoon = coupons.filter(c => {
            if (!c.validUntil) return false;
            const expiryDate = new Date(c.validUntil);
            return c.isActive && expiryDate > now && expiryDate <= nextWeek;
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
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '20px',
            marginBottom: '32px'
        }}>
            <StatsCard
                title="Active Deals"
                value={stats.active}
                icon={Tag}
                color="#10b981"
                trend="Live now"
                variant="success"
            />
            <StatsCard
                title="Expiring Soon"
                value={stats.expiringSoon}
                icon={Clock}
                color="#f59e0b"
                trend="Next 7 days"
                variant="warning"
            />
            <StatsCard
                title="Avg. Discount"
                value={`${stats.avgDiscount}%`}
                icon={Percent}
                color="#3b82f6"
                trend="Across active deals"
                variant="info"
            />


            {/* Bottom Row: Graph + Brand Card */}
            <div style={{
                gridColumn: '1 / -1',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', // Auto-fit for responsiveness
                gap: '20px',
                alignItems: 'start'
            }}>
                <div style={{ flex: '2 1 600px' }}> {/* Graph takes more space if flex, here acting as grid item */}
                    <AnalyticsGraph />
                </div>
                <div style={{ flex: '1 1 300px' }}>
                    <BrandCard />
                </div>
            </div>
        </div>
    );
};
