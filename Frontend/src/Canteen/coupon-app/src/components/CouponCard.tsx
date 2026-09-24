import { useState } from 'react';
import { Edit, Trash2, Copy } from 'lucide-react';
import type { Coupon } from '../../../utils/canteenStore';
import { motion } from 'framer-motion';

interface CouponCardProps {
    coupon: Coupon;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    onDuplicate: (coupon: Coupon) => void;
    onEdit: (coupon: Coupon) => void;
    index?: number;
}

const TYPE_CONFIG: Record<string, { label: string; gradient: string; bg: string; text: string }> = {
    'GENERAL': { label: 'General', gradient: 'from-indigo-500 to-blue-500', bg: 'bg-indigo-50', text: 'text-indigo-700' },
    'BOGO': { label: 'Buy One Get One', gradient: 'from-amber-500 to-orange-500', bg: 'bg-amber-50', text: 'text-amber-700' },
    'ITEM_SPECIFIC': { label: 'Item Specific', gradient: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50', text: 'text-emerald-700' },
    'COMBO': { label: 'Combo Deal', gradient: 'from-violet-500 to-purple-500', bg: 'bg-violet-50', text: 'text-violet-700' },
    'NEW_DISH': { label: 'New Dish', gradient: 'from-pink-500 to-rose-500', bg: 'bg-pink-50', text: 'text-pink-700' },
    'RUSH_HOUR': { label: 'Rush Hour', gradient: 'from-red-500 to-rose-500', bg: 'bg-red-50', text: 'text-red-700' },
};

const SCHEME_DESCRIPTIONS: Record<string, string> = {
    'GENERAL': 'Standard discount applicable on all orders',
    'BOGO': 'Buy selected items and get items absolutely free',
    'ITEM_SPECIFIC': 'Special discount on selected menu items',
    'COMBO': 'Save more when you order selected items together',
    'NEW_DISH': 'Introductory offer on our newest additions',
    'RUSH_HOUR': 'Limited-time deal available during peak hours',
};

export const CouponCard: React.FC<CouponCardProps> = ({ coupon, onToggle, onDelete, onDuplicate, onEdit, index = 0 }) => {
    const [isHovered, setIsHovered] = useState(false);
    const isExpired = coupon.endTime && new Date(coupon.endTime) < new Date();
    const typeInfo = TYPE_CONFIG[coupon.couponType] || TYPE_CONFIG['GENERAL'];

    const discountLabel = coupon.discountType === 'PERCENTAGE'
        ? `${coupon.discountValue}%`
        : coupon.discountType === 'BOGO'
            ? `B${coupon.bogoBuyQty}G${coupon.bogoGetQty}`
            : `₹${coupon.discountValue}`;

    const discountSuffix = coupon.discountType === 'PERCENTAGE'
        ? 'OFF'
        : coupon.discountType === 'BOGO'
            ? 'FREE'
            : 'OFF';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            whileTap={{ scale: 0.98 }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            className={`
                relative bg-white rounded-2xl border border-gray-100
                hover:shadow-2xl hover:shadow-rose-500/10 transition-all duration-300 flex flex-col overflow-hidden
                ${!coupon.isActive ? 'opacity-60' : ''}
            `}
        >
            {/* Shimmer overlay on hover */}
            {isHovered && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-10 pointer-events-none"
                    style={{
                        background: 'linear-gradient(110deg, transparent 25%, rgba(255,255,255,0.3) 50%, transparent 75%)',
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 1.5s infinite',
                    }}
                />
            )}

            {/* Top gradient accent bar */}
            <div className={`h-1.5 bg-gradient-to-r ${typeInfo.gradient}`} />

            {/* Top Section: Status + Type + Toggle */}
            <div className="px-5 pt-4 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {/* Type Badge */}
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${typeInfo.bg} ${typeInfo.text}`}>
                        {typeInfo.label}
                    </span>

                    {/* Status Indicator */}
                    {isExpired ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-600 uppercase">
                            Expired
                        </span>
                    ) : coupon.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 uppercase">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                            Active
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500 uppercase">
                            Inactive
                        </span>
                    )}
                </div>

                {/* Toggle Switch */}
                <button
                    onClick={(e) => { e.stopPropagation(); onToggle(coupon.id as string); }}
                    className={`
                        relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 shadow-inner
                        ${coupon.isActive ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gray-300'}
                    `}
                >
                    <motion.span
                        animate={{ x: coupon.isActive ? 22 : 3 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="inline-block h-4 w-4 rounded-full bg-white shadow-md"
                    />
                </button>
            </div>

            {/* Divider */}
            <div className="mx-5 border-t border-gray-50" />

            {/* Main Content */}
            <div className="px-5 py-5 flex-1">
                {/* Title + Description */}
                <h3
                    className="text-lg font-extrabold text-gray-900 leading-snug mb-1.5 line-clamp-1"
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                    {coupon.title || 'Untitled Coupon'}
                </h3>
                <p className="text-sm text-gray-400 line-clamp-2 mb-2 min-h-[40px] leading-relaxed">
                    {coupon.description || 'No description provided'}
                </p>
                {/* Scheme Description */}
                <p className="text-xs italic text-gray-500/80 mb-5 leading-relaxed border-l-2 border-gray-200 pl-3 py-0.5">
                    {SCHEME_DESCRIPTIONS[coupon.couponType] || SCHEME_DESCRIPTIONS['GENERAL']}
                </p>

                {/* Discount + Code Row */}
                <div className="flex items-center gap-3 mb-5">
                    {/* Discount Badge - Enlarged */}
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className={`flex items-center gap-2 bg-gradient-to-r ${typeInfo.gradient} text-white px-4 py-2.5 rounded-xl shadow-lg`}
                    >
                        <span className="text-xl font-black tracking-tight">{discountLabel}</span>
                        <span className="text-[10px] font-bold text-white/70 uppercase ml-0.5">{discountSuffix}</span>
                    </motion.div>

                    {/* Coupon Code */}
                    <div className="flex-1 flex items-center gap-1.5 bg-gray-50 border border-gray-100 px-3 py-2.5 rounded-xl">
                        <span className="font-mono text-sm font-bold text-gray-800 tracking-wider truncate">
                            {coupon.couponCode}
                        </span>
                    </div>
                </div>

                {/* Info Grid — Text Only */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                    <div>
                        <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Expires</div>
                        <div className="text-xs font-bold text-gray-700">
                            {coupon.endTime
                                ? new Date(coupon.endTime).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                                : 'No Expiry'}
                        </div>
                    </div>
                    <div>
                        <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Usage</div>
                        <div className="text-xs font-bold text-gray-700">
                            {coupon.usageLimitTotal
                                ? `${coupon.currentUsageCount || 0} / ${coupon.usageLimitTotal}`
                                : 'Unlimited'}
                        </div>
                    </div>
                    {coupon.minOrderValue && coupon.minOrderValue > 0 && (
                        <div>
                            <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Min Order</div>
                            <div className="text-xs font-bold text-gray-700">₹{coupon.minOrderValue}</div>
                        </div>
                    )}
                    {coupon.maxDiscountCap && coupon.maxDiscountCap > 0 && (
                        <div>
                            <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Max Discount</div>
                            <div className="text-xs font-bold text-gray-700">₹{coupon.maxDiscountCap}</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Action Bar - Enhanced */}
            <div className="px-5 py-3 border-t border-gray-50 flex items-center gap-1 bg-gray-50/50">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onEdit(coupon)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                >
                    <Edit size={14} />
                    Edit
                </motion.button>
                <div className="w-px h-5 bg-gray-200" />
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onDuplicate(coupon)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-gray-500 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-colors"
                >
                    <Copy size={14} />
                    Duplicate
                </motion.button>
                <div className="w-px h-5 bg-gray-200" />
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onDelete(coupon.id as string)}
                    className="inline-flex items-center justify-center p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                    <Trash2 size={14} />
                </motion.button>
            </div>
        </motion.div>
    );
};
