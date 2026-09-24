import React from 'react';
import { motion } from 'framer-motion';
import {
    ChevronRight, Flame, Users, Sparkles, MoreHorizontal,
    TrendingUp, ShoppingCart, Clock, Heart, CheckCircle, Tag,
} from 'lucide-react';
import type { Coupon, CouponType } from '../../../utils/canteenStore';

interface CreateOffersViewProps {
    onCreateCustom: () => void;
    onActivatePreset: (preset: Partial<Coupon>) => void;
    onSelectType: (type: CouponType) => void;
}

const PRESET_CARDS = [
    {
        label: '20% OFF', sub: 'up to ₹75', value: 20, type: 'PERCENTAGE' as const,
        icon: Flame, iconColor: 'red', badge: 'HOT', badgeClass: 'hot',
        tag: 'ALL CUSTOMERS', tagClass: 'green',
    },
    {
        label: 'Flat ₹100', sub: 'Min order ₹500', value: 100, type: 'FLAT' as const,
        icon: Users, iconColor: 'blue', badge: null, badgeClass: '',
        tag: 'NEW USERS ONLY', tagClass: 'red',
    },
    {
        label: 'Buy 1 Get 1', sub: 'Select items', value: 0, type: 'PERCENTAGE' as const,
        icon: Sparkles, iconColor: 'pink', badge: null, badgeClass: '',
        tag: 'WEEKEND VIBES', tagClass: 'pink',
    },
    {
        label: 'Custom', sub: 'Build your own', value: 0, type: 'PERCENTAGE' as const,
        icon: MoreHorizontal, iconColor: 'gray', badge: null, badgeClass: '',
        tag: 'CREATE NEW', tagClass: 'blue', isCustom: true,
    },
];

const VIBE_GOALS = [
    {
        icon: TrendingUp, title: 'Grow Customer Base', desc: 'Snag new eyes on your shop with killer discounts.',
        iconBg: 'red',
    },
    {
        icon: ShoppingCart, title: 'Boost Cart Value', desc: 'Get them to spend more with tiered offers.',
        iconBg: 'purple',
    },
    {
        icon: Clock, title: 'Crush Peak Hours', desc: 'Drive traffic when things get busy.',
        iconBg: 'blue',
    },
    {
        icon: Heart, title: 'Fan Favorites', desc: 'Reward your loyal community with exclusives.',
        iconBg: 'green',
    },
];

export const CreateOffersView: React.FC<CreateOffersViewProps> = ({ onCreateCustom, onActivatePreset, onSelectType }) => {
    return (
        <div>
            {/* Section Label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                <Flame size={14} style={{ color: '#ef4444' }} />
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#9ca3af' }}>
                    Recommended For You
                </span>
            </div>

            {/* Hero Banner */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="hero-banner"
            >
                <div>
                    <span className="hero-banner-badge">Top Pick</span>
                    <h2>
                        30% OFF<br />
                        <span className="hero-pink">up to ₹150</span>
                    </h2>
                    <p>Level up your sales game. This offer is crushing it for 80% of stores in your niche.</p>
                    <div style={{ display: 'flex', alignItems: 'center', marginTop: 20 }}>
                        <button
                            className="hero-activate-btn"
                            onClick={() => onActivatePreset({
                                title: '30% OFF up to ₹150',
                                couponCode: 'SAVE30',
                                discountType: 'PERCENTAGE',
                                discountValue: 30,
                                maxDiscountCap: 150,
                                isActive: true,
                                couponType: 'GENERAL',
                            })}
                        >
                            Activate Now
                        </button>
                        <span className="hero-verified">
                            <CheckCircle size={16} />
                            Verified effective
                        </span>
                    </div>
                </div>
            </motion.div>

            {/* Quick Preset Cards */}
            <div className="preset-cards-grid">
                {PRESET_CARDS.map((card, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.05 }}
                        className="preset-card"
                        onClick={() => {
                            if (card.isCustom) {
                                onCreateCustom();
                            } else if (card.label === 'Buy 1 Get 1') {
                                onSelectType('BOGO');
                            } else {
                                onActivatePreset({
                                    title: `${card.label} ${card.sub}`,
                                    discountType: card.type,
                                    discountValue: card.value,
                                    couponType: 'GENERAL',
                                    isActive: true,
                                    newCustomerOnly: card.tag === 'NEW USERS ONLY',
                                });
                            }
                        }}
                    >
                        <div className={`preset-card-icon ${card.iconColor}`}>
                            <card.icon size={20} />
                        </div>
                        {card.badge && <span className={`preset-card-badge ${card.badgeClass}`}>{card.badge}</span>}
                        <div className="preset-card-title">{card.label}</div>
                        <div className="preset-card-sub">{card.sub}</div>
                        <span className={`preset-card-tag ${card.tagClass}`}>{card.tag}</span>
                    </motion.div>
                ))}
            </div>

            {/* Pick Your Vibe */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                <Sparkles size={14} style={{ color: '#ec4899' }} />
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#9ca3af' }}>
                    Pick Your Vibe
                </span>
            </div>

            <div className="vibe-grid">
                {VIBE_GOALS.map((goal, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + i * 0.06 }}
                        className="vibe-card"
                        onClick={onCreateCustom}
                    >
                        <div className={`vibe-card-icon ${goal.iconBg}`}>
                            <goal.icon size={22} />
                        </div>
                        <div className="vibe-card-content">
                            <div className="vibe-card-title">{goal.title}</div>
                            <div className="vibe-card-desc">{goal.desc}</div>
                        </div>
                        <ChevronRight size={18} className="vibe-card-arrow" />
                    </motion.div>
                ))}
            </div>

            {/* Bottom Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-8 mt-8">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="stat-card-premium">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <Tag size={18} />
                        </div>
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Offers</div>
                    </div>
                    <div className="text-3xl font-black text-gray-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
                        12 <span className="text-sm font-bold text-green-500 ml-2">+4%</span>
                    </div>
                    <div className="mt-4 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 w-[65%] rounded-full"></div>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                    className="stat-card-premium">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                            <TrendingUp size={18} />
                        </div>
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Saved</div>
                    </div>
                    <div className="text-3xl font-black text-gray-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
                        ₹24.5k <span className="text-sm font-bold text-green-500 ml-2">+12%</span>
                    </div>
                    <div className="mt-4 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-500 w-[78%] rounded-full"></div>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                    className="stat-card-premium">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                            <Users size={18} />
                        </div>
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Customer Reach</div>
                    </div>
                    <div className="text-3xl font-black text-gray-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
                        1,890 <span className="text-sm font-bold text-gray-400 ml-2">stable</span>
                    </div>
                    <div className="mt-4 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 w-[45%] rounded-full"></div>
                    </div>
                </motion.div>
            </div>

            {/* Footer Text */}
            <div style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', paddingTop: 8, borderTop: '1px solid #f3f4f6', marginTop: 16 }}>
                &copy; 2026 Campaign &bull; Next-Gen Commerce Suite
            </div>
        </div>
    );
};
