import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit, Trash2, Copy, ChevronDown, ChevronUp, Archive } from 'lucide-react';
import type { Coupon } from '../../../utils/canteenStore';

interface OfferTrackingCardProps {
    coupon: Coupon;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    onArchive: (id: string) => void;
    onDuplicate: (coupon: Coupon) => void;
    onEdit: (coupon: Coupon) => void;
}

export const OfferTrackingCard: React.FC<OfferTrackingCardProps> = ({
    coupon, onToggle, onDelete, onArchive, onDuplicate, onEdit
}) => {
    const [expanded, setExpanded] = useState(false);

    const discountLabel = coupon.discountType === 'PERCENTAGE'
        ? `${coupon.discountValue}% off`
        : coupon.discountType === 'BOGO'
            ? `Buy ${coupon.bogoBuyQty || 1} Get ${coupon.bogoGetQty || 1} Free`
            : `flat ₹${coupon.discountValue} off`;

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        const day = d.getDate();
        const suffix = day === 1 || day === 21 || day === 31 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th';
        return `${day}${suffix} ${d.toLocaleString('en-IN', { month: 'short' })} ${d.getFullYear()}`;
    };

    const statusBadge = coupon.isActive
        ? <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest border border-green-200 text-green-600 rounded-lg bg-green-50">Active</span>
        : <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest border border-gray-200 text-gray-400 rounded-lg bg-gray-50">Inactive</span>;

    const stoppedAt = coupon.endTime
        ? `${new Date(coupon.endTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}, ${new Date(coupon.endTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
        : '—';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300"
        >
            {/* Header */}
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
                <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="text-sm sm:text-base font-bold text-gray-900 leading-tight" style={{ fontFamily: "'Inter', sans-serif" }}>
                        {coupon.title || discountLabel}
                    </h3>
                    {statusBadge}
                </div>
                <p className="text-[11px] sm:text-xs text-gray-500 leading-normal">
                    Start: <span className="text-gray-700 font-bold">{formatDate(coupon.startTime)}</span>
                    {' '}&bull; End: <span className="text-gray-700 font-bold">{formatDate(coupon.endTime)}</span>
                </p>
            </div>

            {/* Stats Row */}
            <div className="px-4 sm:px-6 pb-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 border border-gray-100 rounded-xl overflow-hidden shadow-sm bg-white">
                    <div className="p-3 sm:p-4 border-r border-b sm:border-b-0 border-gray-100 bg-gray-50/30">
                        <div className="text-lg sm:text-xl font-black text-gray-900" style={{ fontFamily: "'Outfit', sans-serif" }}>₹{coupon.currentUsageCount ? (coupon.currentUsageCount * (coupon.discountValue || 0)).toLocaleString() : '0'}</div>
                        <div className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Gross sales</div>
                    </div>
                    <div className="p-3 sm:p-4 border-b sm:border-b-0 sm:border-r border-gray-100">
                        <div className="text-lg sm:text-xl font-black text-gray-900" style={{ fontFamily: "'Outfit', sans-serif" }}>{coupon.currentUsageCount || 0}</div>
                        <div className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Orders</div>
                    </div>
                    <div className="p-3 sm:p-4 border-r border-gray-100 bg-gray-50/30">
                        <div className="text-lg sm:text-xl font-black text-[#e23744]" style={{ fontFamily: "'Outfit', sans-serif" }}>₹{coupon.currentUsageCount ? ((coupon.currentUsageCount || 0) * (coupon.discountValue || 0)).toLocaleString() : '0'}</div>
                        <div className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Discount</div>
                    </div>
                    <div className="p-3 sm:p-4">
                        <div className="text-lg sm:text-xl font-black text-gray-900" style={{ fontFamily: "'Outfit', sans-serif" }}>
                            {coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue || 0}%` : (coupon.discountType === 'BOGO' ? 'BOGO' : 'FLAT')}
                        </div>
                        <div className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Type</div>
                    </div>
                </div>
            </div>

            {/* Expand/Collapse Toggle */}
            <button
                className="w-full px-4 sm:px-6 py-2.5 flex items-center justify-center text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-widest cursor-pointer hover:bg-gray-50 transition-colors border-t border-gray-50"
                onClick={() => setExpanded(!expanded)}
            >
                {expanded ? <ChevronUp size={14} className="mr-1.5" /> : <ChevronDown size={14} className="mr-1.5" />}
                <span>{expanded ? 'Less details' : 'More details'}</span>
            </button>

            {/* Expanded Details */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden bg-gray-50/50"
                    >
                        <div className="px-4 sm:px-6 py-4 sm:py-6 border-t border-gray-100 space-y-4 text-xs">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                <div className="space-y-3">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Stopped at</span>
                                        <span className="font-bold text-gray-800">{stoppedAt}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Coupon Type</span>
                                        <span className="font-bold text-gray-800">
                                            {coupon.couponType === 'ITEM_SPECIFIC'
                                                ? `Specific items (${coupon.applicableItemIds?.length || 0} items)`
                                                : coupon.newCustomerOnly
                                                    ? 'New customers only'
                                                    : 'All users on all menu items'}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Coupon Code</span>
                                        <span className="font-mono font-black text-[#e23744] bg-white border border-red-100 px-2 py-1 rounded text-xs w-fit">{coupon.couponCode}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Requirements</span>
                                        <span className="font-bold text-gray-800">
                                            {coupon.minOrderValue && coupon.minOrderValue > 0 ? `Min order ₹${coupon.minOrderValue}` : 'No min order'}
                                            {coupon.maxDiscountCap ? `, Max discount ₹${coupon.maxDiscountCap}` : ''}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-wrap items-center gap-2 pt-4 sm:pt-6 border-t border-gray-100">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onEdit(coupon); }}
                                    className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-blue-600 bg-white border border-blue-100 hover:bg-blue-50 rounded-xl shadow-sm transition-all"
                                >
                                    <Edit size={14} /> Edit
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDuplicate(coupon); }}
                                    className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-indigo-600 bg-white border border-indigo-100 hover:bg-indigo-50 rounded-xl shadow-sm transition-all"
                                >
                                    <Copy size={14} /> Copy
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onToggle(coupon.id as string); }}
                                    className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 text-[10px] sm:text-[11px] font-black uppercase tracking-widest border rounded-xl shadow-sm transition-all ${coupon.isActive
                                        ? 'text-orange-600 bg-white border-orange-100 hover:bg-orange-50'
                                        : 'text-green-600 bg-white border-green-100 hover:bg-green-50'
                                        }`}
                                >
                                    {coupon.isActive ? 'Disable' : 'Enable'}
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onArchive(coupon.id as string); }}
                                    className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 rounded-xl shadow-sm transition-all"
                                >
                                    <Archive size={14} /> Archive
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDelete(coupon.id as string); }}
                                    className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-red-600 bg-white border border-red-100 hover:bg-red-50 rounded-xl shadow-sm transition-all sm:ml-auto"
                                >
                                    <Trash2 size={14} /> Delete
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
