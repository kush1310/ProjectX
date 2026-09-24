import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, UserPlus, Repeat, Clock3, ArrowRight, Sparkles } from 'lucide-react';
import type { Coupon } from '../../../utils/canteenStore';

type SegmentType = 'new' | 'loyal' | 'lapsed';
type DiscountMode = 'PERCENTAGE' | 'FLAT';

interface CustomerTargetingViewProps {
    coupons: Coupon[];
    onCreateForSegment: (preset: Partial<Coupon>) => void;
}

const SEGMENTS: {
    key: SegmentType;
    label: string;
    subtitle: string;
    icon: React.ComponentType<any>;
}[] = [
        { key: 'new', label: 'New Customers', subtitle: 'First order conversion', icon: UserPlus },
        { key: 'loyal', label: 'Loyal Customers', subtitle: 'Increase repeat frequency', icon: Repeat },
        { key: 'lapsed', label: 'Lapsed Customers', subtitle: 'Win-back campaigns', icon: Clock3 },
    ];

function getSegmentTitle(segment: SegmentType): string {
    if (segment === 'new') return 'New Customer Boost';
    if (segment === 'loyal') return 'Loyalty Reward';
    return 'Win-back Offer';
}

export const CustomerTargetingView: React.FC<CustomerTargetingViewProps> = ({ coupons, onCreateForSegment }) => {
    const [segment, setSegment] = useState<SegmentType>('new');
    const [discountMode, setDiscountMode] = useState<DiscountMode>('PERCENTAGE');
    const [discountValue, setDiscountValue] = useState<number>(20);
    const [minOrderValue, setMinOrderValue] = useState<number>(199);
    const [usageLimitPerUser, setUsageLimitPerUser] = useState<number>(1);

    const activeCoupons = useMemo(
        () => coupons.filter((coupon) => !coupon.isArchived && coupon.isActive).length,
        [coupons],
    );

    const estimatedAudience = useMemo(() => {
        const base = Math.max(140, activeCoupons * 120);
        if (segment === 'new') return base + 110;
        if (segment === 'loyal') return Math.round(base * 0.75);
        return Math.round(base * 0.5);
    }, [activeCoupons, segment]);

    const estimatedRedemption = useMemo(() => {
        if (segment === 'new') return '12-18%';
        if (segment === 'loyal') return '18-24%';
        return '8-13%';
    }, [segment]);

    const handleCreate = () => {
        const segmentLabel = getSegmentTitle(segment);
        const discountLabel =
            discountMode === 'PERCENTAGE' ? `${discountValue}% OFF` : `Flat Rs.${discountValue} OFF`;

        onCreateForSegment({
            title: `${segmentLabel} - ${discountLabel}`,
            description: `Auto-generated campaign for ${segmentLabel.toLowerCase()}.`,
            couponType: 'GENERAL',
            discountType: discountMode,
            discountValue,
            minOrderValue,
            usageLimitPerUser,
            newCustomerOnly: segment === 'new',
            isActive: true,
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
                        Customer Campaign Builder
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Build segment-based campaigns and open a pre-filled coupon form in one click.
                    </p>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-200 text-xs text-gray-600">
                    <Users size={14} />
                    Estimated Reach: <span className="font-semibold text-gray-900">{estimatedAudience}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {SEGMENTS.map((item) => (
                    <motion.button
                        key={item.key}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSegment(item.key)}
                        className={`text-left rounded-xl border p-4 transition-all ${segment === item.key
                                ? 'border-[#e23744] bg-red-50 shadow-sm'
                                : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                    >
                        <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-[#e23744] mb-3">
                            <item.icon size={18} />
                        </div>
                        <div className="font-semibold text-gray-900 text-sm">{item.label}</div>
                        <div className="text-xs text-gray-500 mt-1">{item.subtitle}</div>
                    </motion.button>
                ))}
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-5 md:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <label className="block">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Discount Type</span>
                        <div className="mt-2 inline-flex rounded-lg overflow-hidden border border-gray-200">
                            <button
                                type="button"
                                onClick={() => setDiscountMode('PERCENTAGE')}
                                className={`px-4 py-2 text-sm font-semibold ${discountMode === 'PERCENTAGE' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600'
                                    }`}
                            >
                                Percentage
                            </button>
                            <button
                                type="button"
                                onClick={() => setDiscountMode('FLAT')}
                                className={`px-4 py-2 text-sm font-semibold border-l border-gray-200 ${discountMode === 'FLAT' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600'
                                    }`}
                            >
                                Flat
                            </button>
                        </div>
                    </label>

                    <label className="block">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Discount Value</span>
                        <input
                            type="number"
                            min={1}
                            value={discountValue}
                            onChange={(event) => setDiscountValue(Math.max(1, Number(event.target.value) || 1))}
                            className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#e23744] focus:ring-2 focus:ring-red-500/20"
                        />
                    </label>

                    <label className="block">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Min Order Value (Rs.)</span>
                        <input
                            type="number"
                            min={0}
                            value={minOrderValue}
                            onChange={(event) => setMinOrderValue(Math.max(0, Number(event.target.value) || 0))}
                            className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#e23744] focus:ring-2 focus:ring-red-500/20"
                        />
                    </label>

                    <label className="block">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Usage Per User</span>
                        <input
                            type="number"
                            min={1}
                            value={usageLimitPerUser}
                            onChange={(event) => setUsageLimitPerUser(Math.max(1, Number(event.target.value) || 1))}
                            className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#e23744] focus:ring-2 focus:ring-red-500/20"
                        />
                    </label>
                </div>

                <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50 p-4 flex flex-wrap items-center gap-4 justify-between">
                    <div>
                        <div className="text-xs uppercase tracking-wide font-semibold text-gray-500">Expected Performance</div>
                        <div className="text-sm text-gray-900 mt-1">
                            Redemption range: <span className="font-semibold">{estimatedRedemption}</span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleCreate}
                        className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#e23744] to-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:shadow-md transition-shadow"
                    >
                        <Sparkles size={15} />
                        Open Pre-filled Form
                        <ArrowRight size={15} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CustomerTargetingView;
