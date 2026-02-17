import React from 'react';
import type { Coupon } from '../types';
import { CouponCard } from './CouponCard';
import styles from './CouponList.module.css';

interface CouponListProps {
    coupons: Coupon[];
    onApply: (coupon: Coupon) => void;
}

export const CouponList: React.FC<CouponListProps> = ({ coupons, onApply }) => {
    return (
        <div className={styles.grid}>
            {coupons.map((coupon) => (
                <CouponCard key={coupon.id} coupon={coupon} onApply={onApply} />
            ))}
        </div>
    );
};
