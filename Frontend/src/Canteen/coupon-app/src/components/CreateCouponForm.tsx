import React, { useState, useEffect, useMemo } from 'react';
import type { Coupon, CouponType, DiscountType, MenuItem } from '../../../utils/canteenStore';
import { getMenuItems, fetchCanteens } from '../../../utils/canteenStore';

// ===== COUPON TYPE METADATA =====
const COUPON_TYPES: { value: CouponType; label: string; color: string; description: string }[] = [
    { value: 'GENERAL', label: 'General', color: '#6366f1', description: 'Standard percentage or flat discount' },
    { value: 'BOGO', label: 'Buy One Get One', color: '#f59e0b', description: 'Buy X items, get Y free' },
    { value: 'ITEM_SPECIFIC', label: 'Item Specific', color: '#10b981', description: 'Discount on specific menu items' },
    { value: 'COMBO', label: 'Combo Deal', color: '#8b5cf6', description: 'Discount when combo items are ordered together' },
    { value: 'NEW_DISH', label: 'New Dish Promo', color: '#ec4899', description: 'Promote newly added dishes' },
    { value: 'RUSH_HOUR', label: 'Rush Hour', color: '#ef4444', description: 'Time-limited deals during peak hours' },
];

const DISCOUNT_TYPES: { value: DiscountType; label: string }[] = [
    { value: 'PERCENTAGE', label: '% Percentage' },
    { value: 'FLAT', label: '₹ Flat Amount' },
    { value: 'BOGO', label: 'BOGO (Free Item)' },
];



interface CreateCouponFormProps {
    onSubmit: (coupon: Partial<Coupon>) => void;
    onCancel: () => void;
    initialData?: Partial<Coupon>;
    canteenId?: number;
}

const CreateCouponForm = ({
    onSubmit,
    onCancel,
    initialData,
    canteenId: canteenIdProp
}: CreateCouponFormProps) => {
    // ===== FORM STATE =====
    const [couponCode, setCouponCode] = useState(initialData?.couponCode || '');
    const [title, setTitle] = useState(initialData?.title || '');
    const [description, setDescription] = useState(initialData?.description || '');

    const [couponType, setCouponType] = useState<CouponType>(initialData?.couponType || 'GENERAL');
    const [discountType, setDiscountType] = useState<DiscountType>(initialData?.discountType || 'PERCENTAGE');
    const [discountValue, setDiscountValue] = useState<number>(initialData?.discountValue || 0);
    const [maxDiscountCap, setMaxDiscountCap] = useState<number | ''>(initialData?.maxDiscountCap || '');
    const [minOrderValue, setMinOrderValue] = useState<number | ''>(initialData?.minOrderValue || '');
    const [usageLimitTotal, setUsageLimitTotal] = useState<number | ''>(initialData?.usageLimitTotal || '');
    const [usageLimitPerUser, setUsageLimitPerUser] = useState<number | ''>(initialData?.usageLimitPerUser || '');
    const [startTime, setStartTime] = useState(initialData?.startTime || '');
    const [endTime, setEndTime] = useState(initialData?.endTime || '');

    // Rush Hour fields
    const [rushHourFlag, setRushHourFlag] = useState(initialData?.rushHourFlag || false);
    const [rushHourStart, setRushHourStart] = useState(initialData?.rushHourStart || '');
    const [rushHourEnd, setRushHourEnd] = useState(initialData?.rushHourEnd || '');

    // BOGO fields
    const [bogoBuyQty, setBogoBuyQty] = useState<number>(initialData?.bogoBuyQty || 1);
    const [bogoGetQty, setBogoGetQty] = useState<number>(initialData?.bogoGetQty || 1);
    const [bogoFreeItemId, setBogoFreeItemId] = useState<number | ''>(initialData?.bogoFreeItemId || '');

    // Item / Combo
    const [applicableItemIds, setApplicableItemIds] = useState<number[]>(initialData?.applicableItemIds || []);

    // New customer / dish
    const [newCustomerOnly, setNewCustomerOnly] = useState(initialData?.newCustomerOnly || false);
    const [newDishFlag, setNewDishFlag] = useState(initialData?.newDishFlag || false);

    // Combo items JSON
    const [comboItems] = useState(initialData?.comboItems || '');

    // Menu items for selection
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [resolvedCanteenId, setResolvedCanteenId] = useState<number | undefined>(canteenIdProp);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Resolve canteenId: use prop if available, otherwise fetch from API
    useEffect(() => {
        if (canteenIdProp) {
            setResolvedCanteenId(canteenIdProp);
        } else {
            const resolveCanteen = async () => {
                try {
                    const canteens = await fetchCanteens();
                    if (canteens.length > 0) {
                        setResolvedCanteenId(canteens[0].id);
                    }
                } catch (e) {
                    console.error('Failed to resolve canteen', e);
                }
            };
            resolveCanteen();
        }
    }, [canteenIdProp]);

    // Load menu items once canteenId is resolved
    useEffect(() => {
        const loadMenu = async () => {
            if (resolvedCanteenId) {
                try {
                    const items = await getMenuItems(resolvedCanteenId);
                    setMenuItems(items);
                } catch (e) {
                    console.error('Failed to load menu items', e);
                }
            }
        };
        loadMenu();
    }, [resolvedCanteenId]);

    // Auto-set rush hour flag when type is RUSH_HOUR
    useEffect(() => {
        if (couponType === 'RUSH_HOUR') {
            setRushHourFlag(true);
        }
        if (couponType === 'NEW_DISH') {
            setNewDishFlag(true);
        }
        if (couponType === 'BOGO') {
            setDiscountType('BOGO');
        }
    }, [couponType]);

    // ===== VALIDATION =====
    const validate = (): boolean => {
        const errs: Record<string, string> = {};

        if (!couponCode.trim()) errs.couponCode = 'Coupon code is required';
        else if (!/^[A-Z0-9_]+$/.test(couponCode)) errs.couponCode = 'Must be uppercase alphanumeric (A-Z, 0-9, _)';
        else if (couponCode.length < 3 || couponCode.length > 30) errs.couponCode = 'Must be 3-30 characters';

        if (!title.trim()) errs.title = 'Title is required';
        if (discountValue <= 0) errs.discountValue = 'Discount value must be positive';
        if (discountType === 'PERCENTAGE' && discountValue > 100) errs.discountValue = 'Percentage cannot exceed 100';

        if (startTime && endTime && new Date(startTime) >= new Date(endTime)) {
            errs.endTime = 'End time must be after start time';
        }

        if (couponType === 'RUSH_HOUR') {
            if (!rushHourStart) errs.rushHourStart = 'Rush hour start time required';
            if (!rushHourEnd) errs.rushHourEnd = 'Rush hour end time required';
        }

        if (couponType === 'BOGO') {
            if (bogoBuyQty < 1) errs.bogoBuyQty = 'Buy quantity must be at least 1';
            if (bogoGetQty < 1) errs.bogoGetQty = 'Get quantity must be at least 1';
        }

        if (couponType === 'ITEM_SPECIFIC' && applicableItemIds.length === 0) {
            errs.applicableItemIds = 'Select at least one menu item';
        }

        if (couponType === 'COMBO' && applicableItemIds.length < 2) {
            errs.applicableItemIds = 'Select at least two items for a combo';
        }

        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    // ===== SUBMIT =====
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsSubmitting(true);
        try {
            const payload: Partial<Coupon> = {
                couponCode: couponCode.toUpperCase(),
                title,
                description,

                couponType,
                discountType,
                discountValue,
                maxDiscountCap: maxDiscountCap !== '' ? Number(maxDiscountCap) : undefined,
                minOrderValue: minOrderValue !== '' ? Number(minOrderValue) : undefined,
                usageLimitTotal: usageLimitTotal !== '' ? Number(usageLimitTotal) : undefined,
                usageLimitPerUser: usageLimitPerUser !== '' ? Number(usageLimitPerUser) : undefined,
                startTime: startTime || undefined,
                endTime: endTime || undefined,
                rushHourFlag,
                rushHourStart: rushHourStart || undefined,
                rushHourEnd: rushHourEnd || undefined,
                bogoBuyQty: couponType === 'BOGO' ? bogoBuyQty : undefined,
                bogoGetQty: couponType === 'BOGO' ? bogoGetQty : undefined,
                bogoFreeItemId: couponType === 'BOGO' && bogoFreeItemId !== '' ? Number(bogoFreeItemId) : undefined,
                comboItems: couponType === 'COMBO' ? comboItems : undefined,
                newCustomerOnly,
                newDishFlag,
                applicableItemIds: applicableItemIds.length > 0 ? applicableItemIds : undefined,
                canteenId: resolvedCanteenId,
            };
            await onSubmit(payload);
        } finally {
            setIsSubmitting(false);
        }
    };

    // ===== PREVIEW PANEL =====
    const livePreview = useMemo(() => {
        const typeInfo = COUPON_TYPES.find(t => t.value === couponType);
        const discountLabel = discountType === 'PERCENTAGE'
            ? `${discountValue}% OFF`
            : discountType === 'FLAT'
                ? `₹${discountValue} OFF`
                : `Buy ${bogoBuyQty} Get ${bogoGetQty} Free`;

        return {
            typeInfo,
            discountLabel,
            code: couponCode || 'CODE',
            title: title || 'Your Coupon Title',
        };
    }, [couponCode, title, couponType, discountType, discountValue, bogoBuyQty, bogoGetQty]);

    // ===== ITEM SELECTION =====
    const toggleItemSelection = (itemId: number) => {
        setApplicableItemIds(prev =>
            prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
        );
    };

    return (
        <div className="flex flex-wrap gap-6 p-3 sm:p-6 max-w-5xl mx-auto w-full">
            {/* ===== FORM ===== */}
            <form onSubmit={handleSubmit} className="flex-1 min-w-0 sm:min-w-[320px] md:min-w-[520px] bg-white rounded-2xl p-4 sm:p-8 border border-gray-100 shadow-sm">
                <h2
                    className="text-2xl font-bold text-gray-900 mb-1"
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                    {initialData ? 'Edit Coupon' : 'Create New Deal'}
                </h2>
                <p className="text-sm text-gray-400 mb-6">Fill in the details below to configure your coupon</p>

                {/* Coupon Type Selector */}
                <div className="mb-6 border-b border-gray-100 pb-6">
                    <label className="block text-gray-800 text-sm font-bold mb-3" style={{ fontFamily: "'Outfit', sans-serif" }}>Campaign Type <span className="text-red-500">*</span></label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {COUPON_TYPES.map(type => (
                            <button
                                key={type.value}
                                type="button"
                                onClick={() => setCouponType(type.value)}
                                className={`
                                    relative p-3 rounded-xl text-left border-2 transition-all duration-200
                                    ${couponType === type.value
                                        ? 'border-[#e23744] bg-red-50/50 ring-1 ring-[#e23744]/20'
                                        : 'border-gray-100 bg-gray-50/50 hover:border-gray-200 hover:bg-white'
                                    }
                                `}
                            >
                                <div className={`font-semibold text-sm ${couponType === type.value ? 'text-[#e23744]' : 'text-gray-900'}`}>
                                    {type.label}
                                </div>
                                <div className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                                    {type.description}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Row: Code + Title */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label className="block text-gray-700 text-sm font-semibold mb-2">Coupon Code <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <input
                                placeholder="SAVE20"
                                value={couponCode}
                                onChange={e => setCouponCode(e.target.value.toUpperCase())}
                                className={`w-full pl-4 pr-4 py-3 bg-white border-2 rounded-xl text-gray-900 font-mono tracking-wide focus:outline-none transition-all
                                    ${errors.couponCode
                                        ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                                        : 'border-gray-100 focus:border-[#e23744] focus:ring-4 focus:ring-red-500/10 hover:border-gray-300'
                                    }
                                `}
                            />
                        </div>
                        {errors.couponCode && <span className="text-red-500 text-xs mt-1.5 flex items-center gap-1">{errors.couponCode}</span>}
                    </div>
                    <div>
                        <label className="block text-gray-700 text-sm font-semibold mb-2">Title <span className="text-red-500">*</span></label>
                        <input
                            placeholder="20% Off Weekend Special"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className={`w-full px-4 py-3 bg-white border-2 rounded-xl text-gray-900 focus:outline-none transition-all
                                ${errors.title
                                    ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                                    : 'border-gray-100 focus:border-[#e23744] focus:ring-4 focus:ring-red-500/10 hover:border-gray-300'
                                }
                            `}
                        />
                        {errors.title && <span className="text-red-500 text-xs mt-1.5 flex items-center gap-1">{errors.title}</span>}
                    </div>
                </div>

                {/* Description */}
                <div className="mb-6 border-b border-gray-100 pb-6">
                    <label className="block text-gray-700 text-sm font-semibold mb-2">Description</label>
                    <textarea
                        className="w-full px-4 py-3 bg-white border-2 border-gray-100 rounded-xl text-gray-900 focus:outline-none focus:border-[#e23744] focus:ring-4 focus:ring-red-500/10 hover:border-gray-300 transition-all min-h-[80px] resize-y"
                        placeholder="Get amazing discounts on your favorite meals..."
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                    />
                </div>



                {/* Discount Type + Value */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                    <div>
                        <label className="block text-blue-900 text-sm font-bold mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>Discount Type <span className="text-red-500">*</span></label>
                        <select
                            value={discountType}
                            onChange={e => setDiscountType(e.target.value as DiscountType)}
                            className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 cursor-pointer"
                        >
                            {DISCOUNT_TYPES.map(dt => (
                                <option key={dt.value} value={dt.value}>{dt.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-blue-900 text-sm font-semibold mb-2">Discount Value <span className="text-red-500">*</span></label>

                        {/* Slider + Number Input Combo */}
                        <div className="space-y-4">
                            {/* Number input */}
                            <div className="relative">
                                <input
                                    type="number"
                                    min="0"
                                    max={discountType === 'PERCENTAGE' ? 100 : 5000}
                                    step={discountType === 'PERCENTAGE' ? 1 : 10}
                                    placeholder={discountType === 'PERCENTAGE' ? 'e.g. 20' : 'e.g. 50'}
                                    value={discountValue || ''}
                                    onChange={e => setDiscountValue(Number(e.target.value))}
                                    className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder-gray-400"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium pointer-events-none">
                                    {discountType === 'PERCENTAGE' ? '%' : '₹'}
                                </div>
                            </div>

                            {/* Interactive Discount Slider */}
                            {discountType !== 'BOGO' && (
                                <div className="px-1">
                                    {/* Value Bubble */}
                                    <div className="relative mb-2">
                                        <div
                                            className="absolute -top-1 transform -translate-x-1/2 bg-gradient-to-r from-[#e23744] to-[#f97316] text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-lg transition-all duration-200"
                                            style={{
                                                left: `${Math.min(Math.max((discountValue / (discountType === 'PERCENTAGE' ? 100 : 1000)) * 100, 5), 95)}%`
                                            }}
                                        >
                                            {discountValue}{discountType === 'PERCENTAGE' ? '%' : '₹'}
                                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#f97316] rotate-45" />
                                        </div>
                                    </div>

                                    {/* Slider Track */}
                                    <div className="relative pt-4">
                                        <div className="absolute top-[22px] left-0 right-0 h-2 rounded-full bg-gray-200 overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-[#e23744] to-[#f97316] rounded-full transition-all duration-200"
                                                style={{ width: `${(discountValue / (discountType === 'PERCENTAGE' ? 100 : 1000)) * 100}%` }}
                                            />
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max={discountType === 'PERCENTAGE' ? 100 : 1000}
                                            step={discountType === 'PERCENTAGE' ? 1 : 10}
                                            value={discountValue}
                                            onChange={e => setDiscountValue(Number(e.target.value))}
                                            className="discount-slider relative z-10 w-full cursor-pointer"
                                            style={{ background: 'transparent' }}
                                        />
                                    </div>

                                    {/* Min/Max Labels */}
                                    <div className="flex justify-between text-[10px] font-semibold text-gray-400 mt-1 px-0.5">
                                        <span>0{discountType === 'PERCENTAGE' ? '%' : '₹'}</span>
                                        <span>{discountType === 'PERCENTAGE' ? '25%' : '₹250'}</span>
                                        <span>{discountType === 'PERCENTAGE' ? '50%' : '₹500'}</span>
                                        <span>{discountType === 'PERCENTAGE' ? '75%' : '₹750'}</span>
                                        <span>{discountType === 'PERCENTAGE' ? '100%' : '₹1000'}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        {errors.discountValue && <span className="text-red-500 text-xs mt-1.5 flex items-center gap-1">{errors.discountValue}</span>}
                    </div>
                </div>

                {/* Row: Min Order + Max Discount Cap */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label className="block text-gray-700 text-sm font-semibold mb-2">Min Order Value (₹)</label>
                        <input className="w-full px-4 py-3 bg-white border-2 border-gray-100 rounded-xl text-gray-900 focus:outline-none focus:border-[#e23744] focus:ring-4 focus:ring-red-500/10 hover:border-gray-300 transition-all" type="number" min="0" placeholder="100"
                            value={minOrderValue} onChange={e => setMinOrderValue(e.target.value ? Number(e.target.value) : '')} />
                    </div>
                    <div>
                        <label className="block text-gray-700 text-sm font-semibold mb-2">Max Discount Cap (₹)</label>
                        <input className="w-full px-4 py-3 bg-white border-2 border-gray-100 rounded-xl text-gray-900 focus:outline-none focus:border-[#e23744] focus:ring-4 focus:ring-red-500/10 hover:border-gray-300 transition-all" type="number" min="0" placeholder="500"
                            value={maxDiscountCap} onChange={e => setMaxDiscountCap(e.target.value ? Number(e.target.value) : '')} />
                    </div>
                </div>

                {/* Row: Usage Limits */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 border-t border-gray-100 pt-6">
                    <div>
                        <label className="block text-gray-700 text-sm font-semibold mb-2">Total Usage Limit</label>
                        <input className="w-full px-4 py-3 bg-white border-2 border-gray-100 rounded-xl text-gray-900 focus:outline-none focus:border-[#e23744] focus:ring-4 focus:ring-red-500/10 hover:border-gray-300 transition-all" type="number" min="0" placeholder="Unlimited"
                            value={usageLimitTotal} onChange={e => setUsageLimitTotal(e.target.value ? Number(e.target.value) : '')} />
                    </div>
                    <div>
                        <label className="block text-gray-700 text-sm font-semibold mb-2">Per User Limit</label>
                        <input className="w-full px-4 py-3 bg-white border-2 border-gray-100 rounded-xl text-gray-900 focus:outline-none focus:border-[#e23744] focus:ring-4 focus:ring-red-500/10 hover:border-gray-300 transition-all" type="number" min="0" placeholder="Unlimited"
                            value={usageLimitPerUser} onChange={e => setUsageLimitPerUser(e.target.value ? Number(e.target.value) : '')} />
                    </div>
                </div>

                {/* Row: Start / End Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label className="block text-gray-700 text-sm font-semibold mb-2">Start Date & Time</label>
                        <input
                            className="w-full px-4 py-3 bg-white border-2 border-gray-100 rounded-xl text-gray-900 focus:outline-none focus:border-[#e23744] focus:ring-4 focus:ring-red-500/10 hover:border-gray-300 transition-all"
                            type="datetime-local"
                            value={startTime}
                            onChange={e => setStartTime(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 text-sm font-semibold mb-2">End Date & Time</label>
                        <input
                            className={`w-full px-4 py-3 bg-white border-2 rounded-xl text-gray-900 focus:outline-none transition-all
                                ${errors.endTime ? 'border-red-300' : 'border-gray-100 focus:border-[#e23744] hover:border-gray-300'}
                            `}
                            type="datetime-local"
                            value={endTime}
                            onChange={e => setEndTime(e.target.value)}
                        />
                        {errors.endTime && <span className="text-red-500 text-xs mt-1.5 flex items-center gap-1">{errors.endTime}</span>}
                    </div>
                </div>

                {/* ===== CONDITIONAL SECTIONS ===== */}

                {/* BOGO Section */}
                {couponType === 'BOGO' && (
                    <div className="bg-amber-50 rounded-xl p-6 mb-6 border border-amber-100">
                        <h3 className="text-amber-800 font-bold mb-4 flex items-center gap-2">
                            <span style={{ fontSize: '13px', fontWeight: 900, color: '#b45309' }}>B</span> BOGO Configuration
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-amber-900 text-xs font-bold mb-1">Buy Qty</label>
                                <input className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-sm" type="number" min="1" value={bogoBuyQty}
                                    onChange={e => setBogoBuyQty(Number(e.target.value))} />
                                {errors.bogoBuyQty && <span className="text-red-500 text-xs">{errors.bogoBuyQty}</span>}
                            </div>
                            <div>
                                <label className="block text-amber-900 text-xs font-bold mb-1">Get Free Qty</label>
                                <input className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-sm" type="number" min="1" value={bogoGetQty}
                                    onChange={e => setBogoGetQty(Number(e.target.value))} />
                                {errors.bogoGetQty && <span className="text-red-500 text-xs">{errors.bogoGetQty}</span>}
                            </div>
                            <div>
                                <label className="block text-amber-900 text-xs font-bold mb-1">Free Item</label>
                                <select className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-sm" value={bogoFreeItemId}
                                    onChange={e => setBogoFreeItemId(e.target.value ? Number(e.target.value) : '')}>
                                    <option value="">Same item</option>
                                    {menuItems.map(item => (
                                        <option key={item.id} value={item.id}>{item.name} — ₹{item.price}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Rush Hour Section */}
                {couponType === 'RUSH_HOUR' && (
                    <div className="bg-red-50 rounded-xl p-6 mb-6 border border-red-100">
                        <h3 className="text-red-800 font-bold mb-4 flex items-center gap-2">
                            <span style={{ fontSize: '13px', fontWeight: 900, color: '#b91c1c' }}>RH</span> Rush Hour Window
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-red-900 text-xs font-bold mb-1">Start Time</label>
                                <input className="w-full px-3 py-2 bg-white border border-red-200 rounded-lg text-sm" type="time" value={rushHourStart}
                                    onChange={e => setRushHourStart(e.target.value)} />
                                {errors.rushHourStart && <span className="text-red-500 text-xs">{errors.rushHourStart}</span>}
                            </div>
                            <div>
                                <label className="block text-red-900 text-xs font-bold mb-1">End Time</label>
                                <input className="w-full px-3 py-2 bg-white border border-red-200 rounded-lg text-sm" type="time" value={rushHourEnd}
                                    onChange={e => setRushHourEnd(e.target.value)} />
                                {errors.rushHourEnd && <span className="text-red-500 text-xs">{errors.rushHourEnd}</span>}
                            </div>
                        </div>
                    </div>
                )}

                {/* Item Specific / Combo Section */}
                {(couponType === 'ITEM_SPECIFIC' || couponType === 'COMBO') && (
                    <div className="bg-gray-50 rounded-xl p-6 mb-6 border border-gray-200">
                        <h3 className="text-gray-800 font-bold mb-4 flex items-center gap-2">
                            {couponType === 'ITEM_SPECIFIC' ? 'Applicable Items' : 'Combo Items'}
                        </h3>
                        {errors.applicableItemIds && <span className="text-red-500 text-sm mb-2 block">{errors.applicableItemIds}</span>}
                        <div className="max-h-48 overflow-y-auto grid gap-2 pr-2 custom-scrollbar">
                            {menuItems.length === 0 ? (
                                <p className="text-gray-400 text-sm">No menu items loaded. Make sure you're associated with a canteen.</p>
                            ) : (
                                menuItems.map(item => (
                                    <label
                                        key={item.id}
                                        className={`
                                            flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-all
                                            ${applicableItemIds.includes(item.id)
                                                ? 'bg-white border-[#e23744] shadow-sm'
                                                : 'bg-white border-transparent hover:border-gray-200'
                                            }
                                        `}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={applicableItemIds.includes(item.id)}
                                            onChange={() => toggleItemSelection(item.id)}
                                            className="w-4 h-4 text-[#e23744] border-gray-300 rounded focus:ring-red-500"
                                        />
                                        <span className="text-gray-700 text-sm font-medium">{item.name}</span>
                                        <span className="text-gray-400 text-xs ml-auto">₹{item.price}</span>
                                    </label>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* New Customer / New Dish Toggles */}
                <div className="flex gap-6 mb-8 flex-wrap">
                    <label className="flex items-center gap-2 text-gray-700 cursor-pointer text-sm font-medium">
                        <input type="checkbox" checked={newCustomerOnly} onChange={e => setNewCustomerOnly(e.target.checked)}
                            className="w-4 h-4 text-[#e23744] border-gray-300 rounded focus:ring-red-500" />
                        New Customers Only
                    </label>
                    <label className="flex items-center gap-2 text-gray-700 cursor-pointer text-sm font-medium">
                        <input type="checkbox" checked={newDishFlag} onChange={e => setNewDishFlag(e.target.checked)}
                            className="w-4 h-4 text-[#e23744] border-gray-300 rounded focus:ring-red-500" />
                        New Dish Promotion
                    </label>
                </div>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-6 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors text-center"
                    >
                        Cancel
                    </button>
                    <button type="submit" disabled={isSubmitting}
                        className={`
                            flex-1 px-6 py-3 rounded-xl text-white font-bold shadow-lg transition-all text-center
                            ${isSubmitting
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-[#e23744] to-rose-600 hover:from-[#d62f3f] hover:to-rose-700 shadow-rose-200'
                            }
                        `}
                    >
                        {isSubmitting ? 'Creating...' : initialData ? 'Update Coupon' : 'Create Coupon'}
                    </button>
                </div>
            </form>

            {/* ===== LIVE PREVIEW ===== */}
            <div className="flex-none w-[320px] sticky top-6 self-start hidden lg:block">
                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-4">Live Preview</h3>
                <div
                    className="relative bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm transition-all duration-300"
                >
                    <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">
                                {livePreview.typeInfo?.label || 'Coupon'}
                            </span>
                            <span className="text-xs font-mono font-bold text-gray-700 bg-white border border-gray-200 rounded-md px-2 py-1">
                                {livePreview.code}
                            </span>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-5">
                        <div className="w-12 h-12 rounded-xl border border-gray-200 bg-white mb-4 flex items-center justify-center font-bold text-xs" style={{ color: livePreview.typeInfo?.color, borderColor: livePreview.typeInfo?.color + '40', background: livePreview.typeInfo?.color + '10' }}>
                            {livePreview.typeInfo?.label?.slice(0, 2).toUpperCase() || 'GN'}
                        </div>

                        <h3 className="text-gray-900 font-bold text-lg leading-tight mb-1">{livePreview.title}</h3>
                        <div className="text-gray-500 text-sm mb-4 line-clamp-2">{description || 'No description provided.'}</div>

                        <div className="mb-5">
                            <div className="text-[11px] text-gray-500 font-semibold uppercase tracking-widest mb-1">Discount</div>
                            <div className="text-2xl font-black tracking-tight text-gray-900">
                                {livePreview.discountLabel}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs border border-gray-200 bg-gray-50 rounded-xl p-3">
                            <div>
                                <span className="block text-gray-500 mb-1">Expires</span>
                                <span className="font-semibold text-gray-800">
                                    {endTime ? new Date(endTime).toLocaleDateString() : 'Never'}
                                </span>
                            </div>
                            <div>
                                <span className="block text-gray-500 mb-1">Limit</span>
                                <span className="font-semibold text-gray-800">
                                    {usageLimitTotal ? `${usageLimitTotal} uses` : 'Unlimited'}
                                </span>
                            </div>
                        </div>

                        <div className="mt-4 text-[11px] text-gray-500">
                            Use this coupon code at checkout.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateCouponForm;
