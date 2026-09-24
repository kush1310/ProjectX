import React from 'react';
import type { Coupon } from '../../../utils/canteenStore';
import { CouponCard } from './CouponCard';

interface CouponListProps {
    coupons: Coupon[];
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    onDuplicate: (coupon: Coupon) => void;
    onEdit: (coupon: Coupon) => void;
}

export const CouponList: React.FC<CouponListProps> = ({ coupons, onToggle, onDelete, onDuplicate, onEdit }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {coupons.map((coupon, index) => (
                <CouponCard key={coupon.id} coupon={coupon} index={index}
                    onToggle={onToggle} onDelete={onDelete} onDuplicate={onDuplicate} onEdit={onEdit} />
            ))}
        </div>
    );
};
