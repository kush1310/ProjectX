import React from 'react';
import { motion } from 'framer-motion';

// Mock data generator for the graph
const generateGraphData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map(day => ({
        day,
        value: Math.floor(Math.random() * 50) + 10 // Random value between 10 and 60
    }));
};

export const AnalyticsGraph: React.FC = () => {
    const data = generateGraphData();
    const maxValue = Math.max(...data.map(d => d.value));

    return (
        <div style={{
            background: 'white',
            borderRadius: '24px',
            padding: '24px',
            border: '1px solid #f3f4f6',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            gridColumn: '1 / -1', // Span full width in grid
            marginTop: '16px'
        }}>
            <div style={{ marginBottom: '24px' }}>
                <h3 style={{
                    margin: 0,
                    color: '#111827',
                    fontSize: '1.1rem',
                    fontWeight: 700
                }}>
                    Weekly Redemptions
                </h3>
                <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '0.85rem' }}>
                    Coupon usage statistics for the last 7 days
                </p>
            </div>

            <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                height: '200px',
                gap: '12px',
                paddingTop: '20px'
            }}>
                {data.map((item, index) => (
                    <div key={item.day} style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px',
                        height: '100%'
                    }}>
                        {/* Bar Container */}
                        <div style={{
                            width: '100%',
                            flex: 1,
                            display: 'flex',
                            alignItems: 'flex-end',
                            justifyContent: 'center',
                            borderRadius: '12px',
                            background: '#f9fafb',
                            overflow: 'hidden',
                            position: 'relative'
                        }}>
                            {/* Dashed Grid Lines (Visual only) */}
                            <div style={{ position: 'absolute', top: '25%', left: 0, right: 0, borderTop: '1px dashed rgba(0,0,0,0.05)' }} />
                            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, borderTop: '1px dashed rgba(0,0,0,0.05)' }} />
                            <div style={{ position: 'absolute', top: '75%', left: 0, right: 0, borderTop: '1px dashed rgba(0,0,0,0.05)' }} />

                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${(item.value / maxValue) * 100}%` }}
                                transition={{ duration: 0.8, delay: index * 0.1, type: 'spring' }}
                                style={{
                                    width: '100%',
                                    maxWidth: '40px',
                                    borderRadius: '8px 8px 0 0',
                                    background: 'linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)', // Blue/Indigo for graph
                                    opacity: 0.85,
                                    boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)'
                                }}
                                whileHover={{ opacity: 1, scaleX: 1.1, translateY: -2 }}
                            />
                        </div>
                        {/* Label */}
                        <span style={{
                            fontSize: '0.75rem',
                            color: '#6b7280',
                            fontWeight: 600
                        }}>
                            {item.day}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};
