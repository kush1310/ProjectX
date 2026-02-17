import React from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: string;
    color: string;
    variant?: 'success' | 'warning' | 'info';
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: Icon, trend, color, variant = 'info' }) => {
    return (
        <motion.div
            whileHover={{ y: -5, boxShadow: '0 15px 30px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            style={{
                background: 'white',
                borderRadius: '24px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                border: '1px solid rgba(0,0,0,0.05)',
                position: 'relative',
                overflow: 'hidden',
                cursor: 'default'
            }}
        >
            {/* Background Decorations based on Variant */}
            {variant === 'success' && (
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    style={{
                        position: 'absolute',
                        top: '-20px',
                        right: '-20px',
                        width: '120px',
                        height: '120px',
                        background: color,
                        opacity: 0.1,
                        borderRadius: '50%',
                        filter: 'blur(30px)',
                        pointerEvents: 'none'
                    }}
                />
            )}

            {variant === 'warning' && (
                <div style={{
                    position: 'absolute',
                    top: '-10px',
                    right: '-10px',
                    width: '100px',
                    height: '100px',
                    background: `conic-gradient(from 0deg, transparent, ${color})`,
                    opacity: 0.1,
                    borderRadius: '50%',
                    filter: 'blur(20px)',
                    pointerEvents: 'none'
                }} />
            )}

            {/* Standard Blob as fallback/layer */}
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '150%',
                height: '150%',
                background: `radial-gradient(circle, ${color}0D 0%, transparent 70%)`,
                pointerEvents: 'none',
                zIndex: 0
            }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h3 style={{
                        margin: 0,
                        color: '#6b7280',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>
                        {title}
                    </h3>
                    <div style={{
                        marginTop: '8px',
                        fontSize: '2rem',
                        fontWeight: 800,
                        color: '#111827',
                        lineHeight: 1
                    }}>
                        {value}
                    </div>
                </div>
                <div style={{
                    padding: '12px',
                    borderRadius: '16px',
                    background: `${color}15`, // 15% opacity hex
                    color: color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <Icon size={24} strokeWidth={2.5} />
                </div>
            </div>
            {trend && (
                <div style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 600 }}>
                    {trend}
                </div>
            )}
        </motion.div>
    );
};
