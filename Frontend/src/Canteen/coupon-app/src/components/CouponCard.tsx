import React, { useState } from 'react';
import { Copy, Check, Gift, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Coupon } from '../types';
import styles from './CouponCard.module.css';

interface CouponCardProps {
    coupon: Coupon;
    onApply?: (coupon: Coupon) => void;
    onToggle?: (id: string) => void;
    variant?: 'view' | 'manage';
}

export const CouponCard: React.FC<CouponCardProps> = ({
    coupon,
    onApply,
    onToggle,
    variant = 'view'
}) => {
    const isManage = variant === 'manage';
    const isActive = coupon.isActive;
    const [copied, setCopied] = useState(false);
    const [isWrapped, setIsWrapped] = useState(variant === 'view'); // Start wrapped in view mode

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(coupon.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleApply = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onApply) {
            onApply(coupon); // Triggers global confetti
        }
    };

    const handleUnwrap = () => {
        setIsWrapped(false);
    };

    if (isWrapped && !isManage) {
        return (
            <motion.div
                layout
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.05, rotate: [0, -2, 2, 0] }}
                onClick={handleUnwrap}
                style={{
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    borderRadius: '24px',
                    height: '300px', // Match card height approx
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 20px 40px rgba(16, 185, 129, 0.3)',
                    color: 'white',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                <div style={{
                    position: 'absolute', width: '100%', height: '100%',
                    backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.2) 2px, transparent 2px)',
                    backgroundSize: '20px 20px',
                    opacity: 0.3
                }} />

                <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                >
                    <Gift size={64} strokeWidth={1.5} />
                </motion.div>

                <div style={{
                    marginTop: '20px',
                    fontWeight: 800,
                    fontSize: '1.5rem',
                    letterSpacing: '1px',
                    textAlign: 'center'
                }}>
                    TAP TO UNWRAP
                </div>
                <div style={{ marginTop: '8px', opacity: 0.8, fontSize: '0.9rem' }}>
                    {coupon.brandName} sent a gift!
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            className={styles.cardWrapper}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            style={{
                background: 'white',
                borderRadius: '24px',
                overflow: 'hidden',
                boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                border: '1px solid #f3f4f6',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                position: 'relative'
            }}
        >
            {/* Header Brand Strip */}
            <div style={{
                background: coupon.brandColor || '#10b981',
                padding: '16px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <span style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                    {coupon.brandName}
                </span>
                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '100px', color: 'white', fontSize: '0.75rem', fontWeight: 600 }}>
                    {coupon.expiry}
                </div>
            </div>

            {/* Body Content */}
            <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#111827', lineHeight: 1.2 }}>
                        {coupon.title}
                    </h3>
                    <span style={{
                        background: '#ecfdf5',
                        color: '#059669',
                        padding: '6px 12px',
                        borderRadius: '12px',
                        fontWeight: 800,
                        fontSize: '1rem',
                        whiteSpace: 'nowrap'
                    }}>
                        {coupon.discount}
                    </span>
                </div>

                <p style={{
                    color: '#6b7280',
                    fontSize: '0.95rem',
                    lineHeight: 1.6,
                    margin: '0 0 24px 0',
                    display: '-webkit-box',
                    WebkitLineClamp: 5, // Supports 5 lines cleanly
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    flex: 1
                }}>
                    {coupon.description}
                </p>

                {/* Dashed Line */}
                <div style={{
                    borderTop: '2px dashed #e5e7eb',
                    margin: '0 -24px 20px',
                    position: 'relative'
                }}>
                    <div style={{
                        position: 'absolute', left: '-10px', top: '-10px', width: '20px', height: '20px', background: 'whitesmoke', borderRadius: '50%'
                    }} />
                    <div style={{
                        position: 'absolute', right: '-10px', top: '-10px', width: '20px', height: '20px', background: 'whitesmoke', borderRadius: '50%'
                    }} />
                </div>

                {/* Footer Action */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{
                        background: '#f9fafb',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        padding: '10px 16px',
                        fontWeight: 700,
                        color: '#374151',
                        letterSpacing: '1px',
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontFamily: 'monospace',
                        fontSize: '1.1rem'
                    }}>
                        {coupon.code}
                        <button
                            onClick={handleCopy}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#10b981' : '#9ca3af', padding: 0 }}
                        >
                            {copied ? <Check size={18} /> : <Copy size={18} />}
                        </button>
                    </div>

                    {!isManage && (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleApply}
                            style={{
                                background: '#10b981',
                                border: 'none',
                                borderRadius: '12px',
                                width: '48px',
                                height: '48px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                            }}
                        >
                            <Sparkles size={20} fill="currentColor" />
                        </motion.button>
                    )}
                </div>

                {isManage && (
                    <button
                        onClick={() => onToggle?.(coupon.id)}
                        style={{
                            width: '100%',
                            marginTop: '16px',
                            padding: '10px',
                            borderRadius: '10px',
                            border: '1px solid',
                            borderColor: isActive ? '#fecaca' : '#bbf7d0',
                            background: isActive ? '#fef2f2' : '#f0fdf4',
                            color: isActive ? '#ef4444' : '#16a34a',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        {isActive ? 'Disable' : 'Enable'}
                    </button>
                )}
            </div>
        </motion.div>
    );
};
