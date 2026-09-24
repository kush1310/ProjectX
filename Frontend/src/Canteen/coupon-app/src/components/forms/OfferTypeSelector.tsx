/**
 * OfferTypeSelector â€” Corporate Professional Design
 * Clean, sharp grid for choosing coupon type.
 */
import React from 'react';
import { Tag, Gift, MousePointer2, Sparkles, Clock3, ArrowLeft, ChefHat } from 'lucide-react';
import type { CouponType } from '../../../../utils/canteenStore';

interface OfferTypeSelectorProps {
    onSelect: (type: CouponType) => void;
    onBack: () => void;
}

const TYPES: {
    value: CouponType;
    label: string;
    description: string;
    icon: any;
    status: string;
    accent: string;
    accentBg: string;
    accentBorder: string;
}[] = [
    {
        value: 'GENERAL', label: 'General Discount',
        description: 'Standard percentage or flat discount on entire order.',
        icon: Tag, status: 'Most Popular',
        accent: 'text-orange-600', accentBg: 'bg-orange-50', accentBorder: 'border-l-orange-500',
    },
    {
        value: 'BOGO', label: 'Buy One Get One',
        description: 'Customer buys X items and gets Y items free.',
        icon: Gift, status: 'High ROI',
        accent: 'text-violet-600', accentBg: 'bg-violet-50', accentBorder: 'border-l-violet-500',
    },
    {
        value: 'ITEM_SPECIFIC', label: 'Item Specific',
        description: 'Discount on specific menu items only.',
        icon: MousePointer2, status: 'Targeted',
        accent: 'text-emerald-600', accentBg: 'bg-emerald-50', accentBorder: 'border-l-emerald-500',
    },
    {
        value: 'COMBO', label: 'Combo Deal',
        description: 'Discounts when items are ordered together.',
        icon: ChefHat, status: 'AOV Booster',
        accent: 'text-rose-600', accentBg: 'bg-rose-50', accentBorder: 'border-l-rose-500',
    },
    {
        value: 'NEW_DISH', label: 'New Dish Promo',
        description: 'Promote newly added dishes with introductory pricing.',
        icon: Sparkles, status: 'New Arrival',
        accent: 'text-amber-600', accentBg: 'bg-amber-50', accentBorder: 'border-l-amber-500',
    },
    {
        value: 'RUSH_HOUR', label: 'Rush Hour',
        description: 'Time-limited deals during specific hours.',
        icon: Clock3, status: 'Time-Limited',
        accent: 'text-pink-600', accentBg: 'bg-pink-50', accentBorder: 'border-l-pink-500',
    },
];

export const OfferTypeSelector: React.FC<OfferTypeSelectorProps> = ({ onSelect, onBack }) => {
    return (
        <div className="max-w-5xl mx-auto pb-16 px-4 sm:px-6">
            {/* Header */}
            <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-10">
                <button onClick={onBack} className="p-2.5 sm:p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-500 flex-shrink-0">
                    <ArrowLeft size={20} className="sm:hidden" />
                    <ArrowLeft size={24} className="hidden sm:block" />
                </button>
                <div>
                    <h2 className="text-xl sm:text-3xl font-bold text-gray-900 leading-tight">Select Offer Type</h2>
                    <p className="text-xs sm:text-base text-gray-500 mt-0.5">Choose the right strategy for your campaign</p>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                        <button
                            key={type.value}
                            onClick={() => onSelect(type.value)}
                            className={`text-left p-4 sm:p-6 lg:p-8 bg-white border border-gray-200 border-l-4 ${type.accentBorder} rounded-xl shadow-sm hover:shadow-lg hover:border-gray-300 transition-all duration-200 flex items-start gap-4 sm:gap-6 group`}
                        >
                            <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl ${type.accentBg} flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-1`}>
                                <Icon size={20} className={`${type.accent} sm:hidden`} />
                                <Icon size={28} className={`${type.accent} hidden sm:block`} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center justify-between gap-1 mb-1.5 sm:mb-2">
                                    <h3 className="font-bold text-gray-900 text-base sm:text-lg">{type.label}</h3>
                                    <span className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider ${type.accent} ${type.accentBg} px-2 py-0.5 sm:px-3 sm:py-1 rounded border ${type.accentBorder.replace('border-l-', 'border-')}`}>
                                        {type.status}
                                    </span>
                                </div>
                                <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">{type.description}</p>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default OfferTypeSelector;
