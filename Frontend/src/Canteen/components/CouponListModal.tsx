import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Ticket, Clock, Percent, DollarSign } from 'lucide-react';
import { Coupon, getActiveCoupons } from '../utils/canteenStore';
import { toast } from '../../utils/toast';

interface CouponListModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (code: string) => void;
    canteenId?: number;
}

export default function CouponListModal({ isOpen, onClose, onSelect, canteenId }: CouponListModalProps) {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            fetchCoupons();
        }
    }, [isOpen]);

    const fetchCoupons = async () => {
        setLoading(true);
        try {
            const data = await getActiveCoupons(canteenId);
            setCoupons(data);
        } catch (error) {
            toast.error("Failed to load coupons");
        } finally {
            setLoading(false);
        }
    };

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
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden shadow-2xl pointer-events-auto flex flex-col">
                            {/* Header */}
                            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-red-50 to-white">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-red-100 rounded-lg text-[#e23744]">
                                        <Ticket size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800">Available Coupons</h3>
                                        <p className="text-xs text-gray-500">Select a coupon to apply</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                                {loading ? (
                                    <div className="space-y-3">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="h-24 bg-white rounded-xl shadow-sm animate-pulse" />
                                        ))}
                                    </div>
                                ) : coupons.length === 0 ? (
                                    <div className="text-center py-12 text-gray-400">
                                        <Ticket size={48} className="mx-auto mb-3 opacity-20" />
                                        <p>No coupons available at the moment</p>
                                    </div>
                                ) : (
                                    coupons.map((coupon) => (
                                        <div
                                            key={coupon.id}
                                            className="group bg-white rounded-xl p-0 shadow-sm border border-gray-200 hover:border-red-200 transition-all cursor-pointer relative overflow-hidden flex"
                                            onClick={() => onSelect(coupon.couponCode)}
                                        >
                                            {/* Left Side (Ticket Stub Look) */}
                                            <div className="bg-red-50 p-4 flex flex-col items-center justify-center border-r border-dashed border-red-200 min-w-[80px]">
                                                <div className="text-[#e23744] font-bold text-xl">
                                                    {coupon.discountType === 'PERCENTAGE' ? (
                                                        <span className="flex items-center">
                                                            {coupon.discountValue}<Percent size={14} />
                                                        </span>
                                                    ) : (
                                                        <span>₹{coupon.discountValue}</span>
                                                    )}
                                                </div>
                                                <span className="text-[10px] font-medium text-red-500 uppercase mt-1">OFF</span>
                                            </div>

                                            {/* Right Side (Content) */}
                                            <div className="p-4 flex-1">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h4 className="font-bold text-gray-800 text-lg leading-tight">
                                                            {coupon.couponCode}
                                                        </h4>
                                                        <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full text-white bg-slate-700 mt-1"
                                                            style={coupon.color ? { background: coupon.color } : {}}>
                                                            {coupon.couponType.replace('_', ' ')}
                                                        </span>
                                                    </div>

                                                    <button className="text-xs font-semibold bg-red-50 text-[#e23744] px-3 py-1.5 rounded-lg group-hover:bg-[#e23744] group-hover:text-white transition-colors">
                                                        APPLY
                                                    </button>
                                                </div>

                                                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{coupon.description}</p>

                                                {/* Applicable Items for Item Specific Coupons */}
                                                {coupon.couponType === 'ITEM_SPECIFIC' && coupon.applicableItems && coupon.applicableItems.length > 0 && (
                                                    <div className="mb-3">
                                                        <p className="text-xs text-gray-400 mb-1">Applicable on:</p>
                                                        <div className="flex flex-wrap gap-1">
                                                            {coupon.applicableItems.map(item => (
                                                                <span key={item.menuItemId} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200">
                                                                    {item.itemName}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 pt-2 border-t border-gray-100">
                                                    {coupon.minOrderValue && (
                                                        <span className="flex items-center gap-1">
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
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
