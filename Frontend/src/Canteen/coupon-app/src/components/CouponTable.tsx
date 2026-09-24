import React from 'react';
import { Edit, Trash2, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Coupon } from '../../../utils/canteenStore';

interface CouponTableProps {
    coupons: Coupon[];
    onToggle: (id: string) => void;
    onDelete?: (id: string) => void;
    onDuplicate?: (coupon: Coupon) => void;
    onEdit?: (coupon: Coupon) => void;
}

export const CouponTable: React.FC<CouponTableProps> = ({ coupons, onToggle, onDelete, onDuplicate, onEdit }) => {
    return (
        <div className="w-full overflow-hidden rounded-2xl border border-gray-100 shadow-sm bg-white">
                {/* Desktop Table */}
                <table className="w-full text-left text-sm text-gray-500 hidden md:table">
                    <thead className="bg-gray-50 border-b border-gray-100 uppercase tracking-wider text-xs font-semibold text-gray-700">
                        <tr>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Code</th>
                            <th className="px-6 py-4">Offer Details</th>
                            <th className="px-6 py-4">Min Order</th>
                            <th className="px-6 py-4">Expiry</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        <AnimatePresence mode='popLayout'>
                            {coupons.map((coupon) => (
                                <motion.tr
                                    key={coupon.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    className="hover:bg-gray-50/50 transition-colors group"
                                >
                                    {/* Status Toggle */}
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => onToggle(coupon.id as string)}
                                            className={`
                                                relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#e23744] focus:ring-offset-2
                                                ${coupon.isActive ? 'bg-green-500' : 'bg-gray-200'}
                                            `}
                                            title={coupon.isActive ? 'Deactivate' : 'Activate'}
                                        >
                                            <span
                                                className={`
                                                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm
                                                    ${coupon.isActive ? 'translate-x-6' : 'translate-x-1'}
                                                `}
                                            />
                                        </button>
                                    </td>

                                    {/* Code Badge */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-lg border border-gray-200 tracking-wide">
                                                {coupon.couponCode}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Details */}
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-900 text-base">
                                                {coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}% OFF` :
                                                    coupon.discountType === 'BOGO' ? `B${coupon.bogoBuyQty || 1}G${coupon.bogoGetQty || 1}` :
                                                        `₹${coupon.discountValue} OFF`}
                                            </span>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span
                                                    className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full text-white"
                                                    style={{ background: coupon.color || '#6366f1' }}
                                                >
                                                    {coupon.couponType || 'GENERAL'}
                                                </span>
                                                <span className="text-gray-400 text-xs truncate max-w-[200px]" title={coupon.description}>
                                                    {coupon.description}
                                                </span>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Min Order */}
                                    <td className="px-6 py-4 font-medium text-gray-700">
                                        {coupon.minOrderValue ? `₹${coupon.minOrderValue}` : '—'}
                                    </td>

                                    {/* Expiry */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <div className={`w-2 h-2 rounded-full ${coupon.isActive ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                            {coupon.endTime ? new Date(coupon.endTime).toLocaleDateString() : 'No Expiry'}
                                        </div>
                                    </td>

                                    {/* Actions */}
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => onEdit?.(coupon)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={() => onDuplicate?.(coupon)}
                                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                title="Duplicate"
                                            >
                                                <Copy size={16} />
                                            </button>
                                            <button
                                                onClick={() => onDelete?.(coupon.id as string)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </AnimatePresence>
                    </tbody>
                </table>

                {/* Mobile Cards (Visible below md screens) */}
                <div className="md:hidden flex flex-col gap-3 p-3 bg-gray-50/50">
                    <AnimatePresence mode='popLayout'>
                        {coupons.map((coupon) => (
                            <motion.div
                                key={coupon.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => onToggle(coupon.id as string)}
                                            className={`
                                                relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none
                                                ${coupon.isActive ? 'bg-green-500' : 'bg-gray-200'}
                                            `}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${coupon.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                        <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2.5 py-1 rounded-md text-xs tracking-wide border border-gray-200">
                                            {coupon.couponCode}
                                        </span>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => onEdit?.(coupon)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md"><Edit size={14} /></button>
                                        <button onClick={() => onDuplicate?.(coupon)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md"><Copy size={14} /></button>
                                        <button onClick={() => onDelete?.(coupon.id as string)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-gray-900">
                                            {coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}% OFF` : coupon.discountType === 'BOGO' ? `B${coupon.bogoBuyQty || 1}G${coupon.bogoGetQty || 1}` : `₹${coupon.discountValue} OFF`}
                                        </span>
                                        <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full text-white" style={{ background: coupon.color || '#6366f1' }}>
                                            {coupon.couponType || 'GENERAL'}
                                        </span>
                                    </div>
                                    <p className="text-gray-500 text-xs truncate">{coupon.description}</p>
                                    <div className="flex justify-between items-center text-xs text-gray-500 pt-2 border-t border-gray-50 mt-2">
                                        <span>Min: {coupon.minOrderValue ? `₹${coupon.minOrderValue}` : 'None'}</span>
                                        <span className="flex items-center gap-1.5">
                                            <div className={`w-1.5 h-1.5 rounded-full ${coupon.isActive ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                            {coupon.endTime ? new Date(coupon.endTime).toLocaleDateString() : 'No Expiry'}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

            {/* Empty State Helper (Hidden if items exist) */}
            {coupons.length === 0 && (
                <div className="p-12 text-center text-gray-400">
                    No coupons found.
                </div>
            )}
        </div>
    );
};
