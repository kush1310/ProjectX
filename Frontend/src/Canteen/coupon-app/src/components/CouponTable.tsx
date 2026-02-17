import React from 'react';
import { Edit, Trash2, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Coupon } from '@/Canteen/utils/canteenStore';

interface CouponTableProps {
    coupons: Coupon[];
    onToggle: (id: string) => void;
    onDelete?: (id: string) => void;
    onDuplicate?: (coupon: Coupon) => void;
    onEdit?: (coupon: Coupon) => void;
}

export const CouponTable: React.FC<CouponTableProps> = ({ coupons, onToggle, onDelete, onDuplicate, onEdit }) => {
    const tableStyle = {
        width: '100%',
        borderCollapse: 'collapse' as const,
        color: 'var(--text-primary)',
        /* Crystal Glass Base */
        background: 'var(--bg-card)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        overflow: 'hidden',
        /* Tactile Depth */
        // border: 'var(--glass-border)',
        border: 'none',
        boxShadow: 'none' // Removing to be sure no red glow/line comes from here
    };

    const thStyle = {
        padding: '24px',
        textAlign: 'left' as const,
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: 'var(--table-header-bg)',
        fontWeight: 700,
        fontSize: '0.75rem',
        color: 'var(--text-secondary)',
        textTransform: 'uppercase' as const,
        letterSpacing: '1.2px'
    };

    const tdStyle = {
        padding: '24px',
        borderBottom: '1px solid rgba(255,255,255,0.05)', // Subtle separator
        fontSize: '0.95rem',
        verticalAlign: 'middle' as const
    };

    return (
        <div style={{ padding: '0 20px', marginBottom: '40px' }}>
            <div className="green-glow-container" style={{
                padding: '3px',
                borderRadius: '28px',
                background: 'linear-gradient(45deg, #10b981, #34d399, #059669)',
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.4), 0 0 40px rgba(16, 185, 129, 0.2)'
            }}>
                <div className="table-content" style={{
                    overflowX: 'auto',
                    borderRadius: '25px',
                    background: 'whitesmoke',
                    maxWidth: '100%', // Ensure it doesn't overflow parent
                }}>
                    <table style={{
                        ...tableStyle,
                        minWidth: '800px' // Force min width to trigger scroll on small screens
                    }}>
                        <thead>
                            <tr>
                                <th style={{ ...thStyle, width: '80px' }}>Status</th>
                                <th style={thStyle}>Code</th>
                                <th style={thStyle}>Offer Details</th>
                                <th style={thStyle}>Min Order</th>
                                <th style={thStyle}>Expiry</th>
                                <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence mode='popLayout'>
                                {coupons.map((coupon) => (
                                    <motion.tr
                                        key={coupon.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: -50 }}
                                        transition={{ duration: 0.2 }}
                                        style={{ transition: 'background 0.2s', borderBottom: '1px solid rgba(0,0,0,0.03)' }}
                                    >
                                        {/* Status Toggle */}
                                        <td style={tdStyle}>
                                            <button
                                                onClick={() => onToggle(coupon.id as string)}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    padding: 0
                                                }}
                                                title={coupon.isActive ? 'Deactivate' : 'Activate'}
                                            >
                                                <div style={{
                                                    width: '44px',
                                                    height: '24px',
                                                    background: coupon.isActive ? '#10b981' : '#e5e7eb',
                                                    borderRadius: '999px',
                                                    position: 'relative',
                                                    transition: 'background 0.3s ease',
                                                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'
                                                }}>
                                                    <div style={{
                                                        width: '20px',
                                                        height: '20px',
                                                        background: 'white',
                                                        borderRadius: '50%',
                                                        position: 'absolute',
                                                        top: '2px',
                                                        left: coupon.isActive ? '22px' : '2px',
                                                        transition: 'left 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                                    }} />
                                                </div>
                                            </button>
                                        </td>

                                        {/* Code Badge */}
                                        <td style={tdStyle}>
                                            <span style={{
                                                fontFamily: 'var(--font-main)',
                                                fontWeight: 700,
                                                letterSpacing: '0.5px',
                                                background: 'rgba(10, 10, 10, 0.11)',
                                                padding: '8px 16px',
                                                borderRadius: '8px',
                                                color: 'var(--text-primary)',
                                                display: 'inline-block',
                                                border: '1px solid rgba(255,255,255,0.1)'
                                            }}>
                                                {coupon.code}
                                            </span>
                                        </td>

                                        {/* Details */}
                                        <td style={tdStyle}>
                                            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#111010ff', marginBottom: '4px' }}>
                                                {coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`}
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: '#6b7280', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {coupon.description}
                                            </div>
                                        </td>

                                        {/* Min Order */}
                                        <td style={{ ...tdStyle, fontWeight: 600 }}>
                                            {coupon.minOrderValue ? `₹${coupon.minOrderValue}` : '—'}
                                        </td>

                                        {/* Expiry */}
                                        <td style={tdStyle}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500, color: '#6b7280' }}>
                                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-green)' }}></div>
                                                {coupon.validUntil ? new Date(coupon.validUntil).toLocaleDateString() : 'No Expiry'}
                                            </div>
                                        </td>

                                        {/* Actions */}
                                        <td style={{ ...tdStyle, textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                <button
                                                    onClick={() => onEdit?.(coupon)}
                                                    style={{
                                                        padding: '8px',
                                                        background: 'rgba(144, 238, 144, 0.1)',
                                                        border: '1px solid #90EE90',
                                                        borderRadius: '8px',
                                                        color: '#16a34a',
                                                        cursor: 'pointer',
                                                        boxShadow: '0 0 10px rgba(144, 238, 144, 0.2)'
                                                    }}>
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => onDuplicate?.(coupon)}
                                                    style={{
                                                        padding: '8px',
                                                        background: 'rgba(59, 130, 246, 0.1)',
                                                        border: '1px solid #3b82f6',
                                                        borderRadius: '8px',
                                                        color: '#2563eb',
                                                        cursor: 'pointer',
                                                        boxShadow: '0 0 10px rgba(59, 130, 246, 0.2)'
                                                    }}
                                                    title="Duplicate"
                                                >
                                                    <Copy size={16} />
                                                </button>
                                                <button
                                                    style={{
                                                        padding: '8px',
                                                        background: 'transparent',
                                                        border: 'none',
                                                        borderRadius: '8px',
                                                        color: '#ef4444',
                                                        cursor: 'pointer'
                                                    }}
                                                    onClick={() => onDelete?.(coupon.id as string)}
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
                </div>
            </div>
        </div>
    );
};
