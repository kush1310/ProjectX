import React from 'react';
import type { Coupon } from '../../../utils/canteenStore';
import { CouponCard } from './CouponCard';
import { motion, AnimatePresence } from 'framer-motion';

interface CouponGridProps {
    coupons: Coupon[];
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    onDuplicate: (coupon: Coupon) => void;
    onEdit: (coupon: Coupon) => void;
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.1,
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            type: 'spring' as const,
            stiffness: 200,
            damping: 20,
        }
    }
};

export const CouponGrid: React.FC<CouponGridProps> = ({ coupons, onToggle, onDelete, onDuplicate, onEdit }) => {
    return (
        <motion.div
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <AnimatePresence mode='popLayout'>
                {coupons.map((coupon, index) => (
                    <motion.div key={coupon.id} variants={itemVariants}>
                        <CouponCard
                            coupon={coupon}
                            onToggle={onToggle}
                            onDelete={onDelete}
                            onDuplicate={onDuplicate}
                            onEdit={onEdit}
                            index={index}
                        />
                    </motion.div>
                ))}
            </AnimatePresence>
        </motion.div>
    );
};
