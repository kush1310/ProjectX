import React from 'react';
import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';

const QUOTES = [
    "Great discounts drive great loyalty.",
    "Every deal is a new opportunity.",
    "Delight your customers, grow your brand.",
    "Success is in the details.",
    "Make today's offer irresistible."
];

export const BrandCard: React.FC = () => {
    const randomQuote = React.useMemo(() => QUOTES[Math.floor(Math.random() * QUOTES.length)], []);
    const date = new Date();
    const hour = date.getHours();

    let greeting = "Good Morning";
    if (hour >= 12 && hour < 17) greeting = "Good Afternoon";
    else if (hour >= 17) greeting = "Good Evening";

    const dateString = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            style={{
                background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
                borderRadius: '24px',
                padding: '32px',
                color: 'white',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden',
                minHeight: '300px',
                boxShadow: '0 20px 25px -5px rgba(16, 185, 129, 0.3), 0 10px 10px -5px rgba(16, 185, 129, 0.2)',
                marginTop: '16px' // Align with graph top margin
            }}
        >
            {/* Background Decorations */}
            <motion.div
                animate={{
                    rotate: 360,
                    scale: [1, 1.1, 1]
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear"
                }}
                style={{
                    position: 'absolute',
                    top: '-50px',
                    right: '-50px',
                    width: '200px',
                    height: '200px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.1)',
                    pointerEvents: 'none'
                }}
            />
            <div style={{
                position: 'absolute',
                bottom: '-30px',
                left: '-30px',
                width: '150px',
                height: '150px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.05)',
                pointerEvents: 'none'
            }} />

            <div>
                <h2 style={{ fontSize: '2rem', fontWeight: 700, margin: '0 0 8px', letterSpacing: '-1px' }}>
                    {greeting},<br />Partner!
                </h2>
                <p style={{ fontSize: '1rem', opacity: 0.9, fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '6px', height: '6px', background: '#fff', borderRadius: '50%' }}></span>
                    {dateString}
                </p>
            </div>


            <div style={{ position: 'relative', zIndex: 1, marginTop: 'auto', paddingTop: '32px' }}>
                <Quote size={24} style={{ opacity: 0.4, marginBottom: '8px' }} />
                <p style={{
                    fontSize: '1.1rem',
                    fontWeight: 500,
                    lineHeight: 1.4,
                    fontFamily: 'serif',
                    fontStyle: 'italic',
                    opacity: 0.9
                }}>
                    "{randomQuote}"
                </p>
            </div>
        </motion.div >
    );
};
