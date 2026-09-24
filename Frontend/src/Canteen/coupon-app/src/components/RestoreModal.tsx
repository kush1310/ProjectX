/**
 * RestoreModal — Modal for restoring expired/archived coupons with new dates.
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RotateCcw, Calendar } from 'lucide-react';
import type { Coupon } from '../../../utils/canteenStore';

interface RestoreModalProps {
    isOpen: boolean;
    coupon: Coupon | null;
    onRestore: (id: string, startTime: string, endTime: string) => void;
    onClose: () => void;
}

export const RestoreModal: React.FC<RestoreModalProps> = ({ isOpen, coupon, onRestore, onClose }) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [error, setError] = useState('');

    const handleRestore = () => {
        if (!startDate || !endDate) {
            setError('Both dates are required');
            return;
        }
        if (new Date(endDate) <= new Date(startDate)) {
            setError('End date must be after start date');
            return;
        }
        if (!coupon?.id) return;
        onRestore(coupon.id, startDate, endDate);
        setStartDate('');
        setEndDate('');
        setError('');
    };

    return (
        <AnimatePresence>
            {isOpen && coupon && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 10 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-[#e23744] to-rose-600 p-5 text-white">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                        <RotateCcw size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg" style={{ fontFamily: "'Outfit', sans-serif" }}>Restore Coupon</h3>
                                        <p className="text-xs text-red-100">Set new validity dates</p>
                                    </div>
                                </div>
                                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-5 space-y-4">
                            {/* Coupon Info */}
                            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                <p className="text-xs text-gray-500 mb-1">Coupon</p>
                                <p className="font-bold text-gray-900">{coupon.couponCode}</p>
                                <p className="text-sm text-gray-600">{coupon.title}</p>
                                {coupon.endTime && (
                                    <p className="text-xs text-red-500 mt-1">
                                        Originally expired: {new Date(coupon.endTime).toLocaleDateString()}
                                    </p>
                                )}
                            </div>

                            {/* Date Inputs */}
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                        <Calendar size={14} className="inline mr-1" />
                                        New Start Date & Time
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={startDate}
                                        onChange={(e) => { setStartDate(e.target.value); setError(''); }}
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-[#e23744] focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                        <Calendar size={14} className="inline mr-1" />
                                        New End Date & Time
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={endDate}
                                        onChange={(e) => { setEndDate(e.target.value); setError(''); }}
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-[#e23744] focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            {/* Error */}
                            {error && (
                                <motion.p
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg"
                                >
                                    {error}
                                </motion.p>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="px-5 pb-5 flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleRestore}
                                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#e23744] to-rose-600 text-white rounded-lg text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                            >
                                <RotateCcw size={16} />
                                Restore
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default RestoreModal;
