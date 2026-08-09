import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Ticket, Clock, Percent, DollarSign, AlertCircle, ArrowLeft } from 'lucide-react';
import { Coupon, getActiveCoupons } from '../utils/canteenStore';
import { toast } from '../../utils/toast';
import { useCouponWebSocket } from '../../hooks/useCouponWebSocket';

interface CouponListModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (code: string) => void;
    canteenId?: number;
    orderTotal?: number;
    cartItemIds?: number[];
}

export default function CouponListModal({ isOpen, onClose, onSelect, canteenId, orderTotal, cartItemIds }: CouponListModalProps) {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCoupons = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getActiveCoupons(canteenId);
            setCoupons(data);
        } catch (error) {
            toast.error("Failed to load coupons");
        } finally {
            setLoading(false);
        }
    }, [canteenId]);

    useEffect(() => {
        if (isOpen) {
            fetchCoupons();
        }
    }, [isOpen, fetchCoupons]);

    // Real-time WebSocket sync — auto-refresh when vendor creates/updates/deletes coupons
    useCouponWebSocket({
        canteenId,
        onCreated: () => { if (isOpen) fetchCoupons(); },
        onUpdated: () => { if (isOpen) fetchCoupons(); },
        onDeleted: () => { if (isOpen) fetchCoupons(); },
        onToggled: () => { if (isOpen) fetchCoupons(); },
        onArchived: () => { if (isOpen) fetchCoupons(); },
        onRestored: () => { if (isOpen) fetchCoupons(); },
    });

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pointer-events-none"
                    >
                        <div className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] sm:max-h-[80vh] overflow-hidden shadow-2xl pointer-events-auto flex flex-col">
                            {/* Header */}
                            <div className="p-3.5 sm:p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-red-50 to-white">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={onClose}
                                        className="p-1.5 hover:bg-red-100/70 rounded-full transition-colors text-gray-600 mr-0.5"
                                        title="Back"
                                    >
                                        <ArrowLeft size={18} />
                                    </button>
                                    <div className="p-2 bg-red-100 rounded-lg text-[#e23744]">
                                        <Ticket size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-sm sm:text-base">Available Coupons</h3>
                                        <p className="text-[11px] sm:text-xs text-gray-500">Select a coupon to apply</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                                >
                                    <X size={18} className="sm:hidden" />
                                    <X size={20} className="hidden sm:block" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-gray-50">
                                {loading ? (
                                    <div className="space-y-3">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="h-24 bg-white rounded-xl shadow-sm animate-pulse" />
                                        ))}
                                    </div>
                                ) : coupons.length === 0 ? (
                                    <div className="text-center py-12 text-gray-400">
                                        <Ticket size={48} className="mx-auto mb-3 opacity-20" />
                                        <p className="text-sm">No coupons available at the moment</p>
                                    </div>
                                ) : (
                                    coupons.map((coupon) => {
                                        const meetsMinOrder = !coupon.minOrderValue || !orderTotal || orderTotal >= coupon.minOrderValue;
                                        const meetsItemReq = coupon.couponType !== 'ITEM_SPECIFIC' || !cartItemIds || !coupon.applicableItems?.length ||
                                            coupon.applicableItems.some((item: any) => cartItemIds.includes(item.menuItemId));
                                        const isEligible = meetsMinOrder && meetsItemReq;

                                        return (
                                        <div
                                            key={coupon.id}
                                            className={`group bg-white rounded-xl p-0 shadow-sm border transition-all relative overflow-hidden flex ${
                                                isEligible
                                                    ? 'border-gray-200 hover:border-red-200 cursor-pointer'
                                                    : 'border-gray-100 opacity-50 cursor-not-allowed'
                                            }`}
                                            onClick={() => isEligible && onSelect(coupon.couponCode)}
                                        >
                                            {/* Left Side (Ticket Stub Look) */}
                                            <div className="bg-red-50 p-2.5 sm:p-4 flex flex-col items-center justify-center border-r border-dashed border-red-200 min-w-[70px] sm:min-w-[80px]">
                                                <div className="text-[#e23744] font-bold text-base sm:text-xl">
                                                    {coupon.discountType === 'PERCENTAGE' ? (
                                                        <span className="flex items-center">
                                                            {coupon.discountValue}<Percent size={12} className="sm:hidden" /><Percent size={14} className="hidden sm:inline" />
                                                        </span>
                                                    ) : (
                                                        <span>₹{coupon.discountValue}</span>
                                                    )}
                                                </div>
                                                <span className="text-[9px] sm:text-[10px] font-medium text-red-500 uppercase mt-0.5 sm:mt-1">OFF</span>
                                            </div>

                                            {/* Right Side (Content) */}
                                            <div className="p-3 sm:p-4 flex-1 min-w-0">
                                                <div className="flex justify-between items-start gap-2 mb-1.5 sm:mb-2">
                                                    <div className="min-w-0 flex-1">
                                                        <h4 className="font-bold text-gray-800 text-base sm:text-lg leading-tight truncate">
                                                            {coupon.couponCode}
                                                        </h4>
                                                        <span className="inline-block text-[9px] sm:text-[10px] font-semibold px-2 py-0.5 rounded-full text-white bg-slate-700 mt-1"
                                                            style={coupon.color ? { background: coupon.color } : {}}>
                                                            {coupon.couponType.replace('_', ' ')}
                                                        </span>
                                                    </div>

                                                    <button className="text-[11px] sm:text-xs font-semibold bg-red-50 text-[#e23744] px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg group-hover:bg-[#e23744] group-hover:text-white transition-colors flex-shrink-0">
                                                        APPLY
                                                    </button>
                                                </div>

                                                <p className="text-gray-600 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2">{coupon.description}</p>

                                                {/* Applicable Items for Item Specific Coupons */}
                                                {coupon.couponType === 'ITEM_SPECIFIC' && coupon.applicableItems && coupon.applicableItems.length > 0 && (
                                                    <div className="mb-2 sm:mb-3">
                                                        <p className="text-[10px] sm:text-xs text-gray-400 mb-1">Applicable on:</p>
                                                        <div className="flex flex-wrap gap-1">
                                                            {coupon.applicableItems.map(item => (
                                                                <span key={item.menuItemId} className="text-[9px] sm:text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md border border-slate-200">
                                                                    {item.itemName}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-gray-400 pt-2 border-t border-gray-100">
                                                    {coupon.minOrderValue && (
                                                        <span className={`flex items-center gap-1 ${!meetsMinOrder ? 'text-red-400 font-semibold' : ''}`}>
                                                            <DollarSign size={12} />
                                                            Min: ₹{coupon.minOrderValue}
                                                        </span>
                                                    )}
                                                    {coupon.endTime && (
                                                        <span className="flex items-center gap-1">
                                                            <Clock size={12} />
                                                            Exp: {new Date(coupon.endTime).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                    {!meetsMinOrder && (
                                                        <span className="flex items-center gap-1 text-red-500 font-semibold">
                                                            <AlertCircle size={12} /> Min order not met
                                                        </span>
                                                    )}
                                                    {!meetsItemReq && (
                                                        <span className="flex items-center gap-1 text-amber-500 font-semibold">
                                                            <AlertCircle size={12} /> Items not in cart
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
