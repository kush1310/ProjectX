import React from 'react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
    title: string;
    description: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '60px 20px',
                textAlign: 'center',
                background: 'white',
                borderRadius: '24px',
                border: '1px dashed #e5e7eb',
                margin: '0 20px'
            }}
        >
            <div style={{
                width: '64px',
                height: '64px',
                background: '#f3f4f6',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
            }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
            </div>
            <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#111827',
                marginBottom: '8px'
            }}>
                {title}
            </h3>
            <p style={{
                color: '#6b7280',
                maxWidth: '300px',
                lineHeight: 1.5
            }}>
                {description}
            </p>
        </motion.div>
    );
};
