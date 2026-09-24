/**
 * OfferFormNewDish â€” Corporate Professional Design
 * Clean form for NEW_DISH coupon type with standard select.
 */
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Percent, DollarSign } from 'lucide-react';
import type { MenuItem } from '../../../../utils/canteenStore';
import { fetchMenu } from '../../../../utils/canteenStore';

interface OfferFormNewDishProps {
    onSubmit: (data: any) => void;
    onBack: () => void;
    initialData?: any;
}

const inputCls = `w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-base text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500`;
const inputErrCls = `w-full px-4 py-3 bg-white border border-red-400 rounded-lg text-base text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-500`;
const selectCls = `w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-base text-gray-900 outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500`;
const labelCls = `block text-sm font-semibold text-gray-600 mb-1.5`;

export const OfferFormNewDish: React.FC<OfferFormNewDishProps> = ({ onSubmit, onBack, initialData }) => {
    const canteenId = initialData?.canteenId || 1;

    const [form, setForm] = useState({
        couponCode: initialData?.couponCode || '',
        title: initialData?.title || '',
        description: initialData?.description || '',
        discountType: initialData?.discountType || 'PERCENTAGE',
        discountValue: initialData?.discountValue || '',
        maxDiscountCap: initialData?.maxDiscountCap || '',
        minOrderValue: initialData?.minOrderValue || '0',
        usageLimitTotal: initialData?.usageLimitTotal || '',
        usageLimitPerUser: initialData?.usageLimitPerUser || '1',
        startTime: initialData?.startTime || '',
        endTime: initialData?.endTime || '',
    });

    const [selectedItemId, setSelectedItemId] = useState<number | null>(initialData?.applicableItemIds?.[0] || null);
    const [isNewCustomerOnly, setIsNewCustomerOnly] = useState(false);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        const loadMenu = async () => { const data = await fetchMenu(canteenId); setMenuItems(data); };
        loadMenu();
    }, [canteenId]);

    const validate = (): boolean => {
        const errs: Record<string, string> = {};
        if (!form.couponCode.trim()) errs.couponCode = 'Coupon code is required';
        if (!form.title.trim()) errs.title = 'Title is required';
        if (!form.discountValue || parseFloat(form.discountValue) <= 0) errs.discountValue = 'Discount is required';
        if (!selectedItemId) errs.selectedItem = 'Select an item to promote';
        if (!form.startTime) errs.startTime = 'Start date is required';
        if (!form.endTime) errs.endTime = 'End date is required';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;
        onSubmit({
            ...form, couponType: 'NEW_DISH',
            applicableItemIds: selectedItemId ? [selectedItemId] : [],
            discountValue: parseFloat(form.discountValue),
            maxDiscountCap: form.maxDiscountCap ? parseFloat(form.maxDiscountCap) : null,
            minOrderValue: parseFloat(form.minOrderValue),
            usageLimitTotal: form.usageLimitTotal ? parseInt(form.usageLimitTotal) : null,
            usageLimitPerUser: parseInt(form.usageLimitPerUser),
            canteenId, isNewCustomerOnly: isNewCustomerOnly,
        });
    };

    const update = (key: string, val: any) => {
        setForm(p => ({ ...p, [key]: val }));
        if (errors[key]) setErrors(p => { const n = { ...p }; delete n[key]; return n; });
    };


    return (
        <div className="max-w-3xl mx-auto px-3 sm:px-6 pb-20">
            {/* Header */}
            <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                <button onClick={onBack} className="p-2 sm:p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-500 flex-shrink-0">
                    <ArrowLeft size={20} className="sm:hidden" />
                    <ArrowLeft size={22} className="hidden sm:block" />
                </button>
                <div className="flex-1 min-w-0">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">Create New Dish Promo</h2>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">Promote a new or underperforming menu item</p>
                </div>
                <span className="px-2.5 py-1 sm:px-3 sm:py-1.5 bg-amber-50 text-amber-700 text-[10px] sm:text-xs font-bold rounded-md border border-amber-200 uppercase tracking-wide flex-shrink-0">New Dish</span>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                {/* Basic Information */}
                <div className="px-4 sm:px-8 py-4 sm:py-5 border-b border-gray-100">
                    <h3 className="text-sm sm:text-base font-bold text-gray-800">Basic Information</h3>
                </div>
                <div className="px-4 sm:px-8 py-5 sm:py-6 space-y-4 sm:space-y-5 border-b border-gray-100">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                        <div>
                            <label className={labelCls}>Coupon Code <span className="text-red-500">*</span></label>
                            <input value={form.couponCode} onChange={e => update('couponCode', e.target.value.toUpperCase())}
                                placeholder="e.g. NEWDISH30" className={errors.couponCode ? inputErrCls : inputCls} />
                            {errors.couponCode && <p className="text-sm text-red-500 mt-1.5">{errors.couponCode}</p>}
                        </div>
                        <div>
                            <label className={labelCls}>Offer Title <span className="text-red-500">*</span></label>
                            <input value={form.title} onChange={e => update('title', e.target.value)}
                                placeholder="e.g. Try Our New Pasta" className={errors.title ? inputErrCls : inputCls} />
                            {errors.title && <p className="text-sm text-red-500 mt-1.5">{errors.title}</p>}
                        </div>
                    </div>
                    <div>
                        <label className={labelCls}>Description</label>
                        <textarea value={form.description} onChange={e => update('description', e.target.value)}
                            rows={2} placeholder="Describe the new dish promotion..."
                            className={`${inputCls} resize-none`} />
                    </div>
                </div>

                {/* Item Selection */}
                <div className="px-4 sm:px-8 py-4 sm:py-5 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm sm:text-base font-bold text-gray-800">Select Dish to Promote</h3>
                    </div>
                </div>
                <div className="px-4 sm:px-8 py-5 sm:py-6 border-b border-gray-100">
                    <div>
                        <label className={labelCls}>Select Item <span className="text-red-500">*</span></label>
                        <select value={selectedItemId || ''} onChange={e => { setSelectedItemId(parseInt(e.target.value)); if (errors.selectedItem) setErrors(p => { const n = { ...p }; delete n.selectedItem; return n; }); }}
                            className={errors.selectedItem ? inputErrCls : selectCls}>
                            <option value="">Select dish...</option>
                            {menuItems.map(item => (
                                <option key={item.id} value={item.id}>{item.name} — ₹{item.price}</option>
                            ))}
                        </select>
                        {errors.selectedItem && <p className="text-sm text-red-500 mt-1.5">{errors.selectedItem}</p>}
                    </div>

                    {/* New customer toggle */}
                    <label className="flex items-center gap-3 mt-4 sm:mt-5 cursor-pointer">
                        <input type="checkbox" checked={isNewCustomerOnly} onChange={e => setIsNewCustomerOnly(e.target.checked)}
                            className="w-4 h-4 sm:w-5 sm:h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                        <span className="text-sm sm:text-base text-gray-700 font-bold">New customers only</span>
                    </label>
                </div>

                {/* Discount Configuration */}
                <div className="px-4 sm:px-8 py-4 sm:py-5 border-b border-gray-100">
                    <h3 className="text-sm sm:text-base font-bold text-gray-800">Discount Configuration</h3>
                </div>
                <div className="px-4 sm:px-8 py-5 sm:py-6 space-y-4 sm:space-y-5 border-b border-gray-100">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                        <div>
                            <label className={labelCls}>Type</label>
                            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                                <button onClick={() => update('discountType', 'PERCENTAGE')}
                                    className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-1.5 transition-colors ${form.discountType === 'PERCENTAGE' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                                    <Percent size={16} /> %
                                </button>
                                <button onClick={() => update('discountType', 'FLAT')}
                                    className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-1.5 border-l border-gray-200 transition-colors ${form.discountType === 'FLAT' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                                    <DollarSign size={16} /> ₹
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className={labelCls}>Value <span className="text-red-500">*</span></label>
                            <input type="number" value={form.discountValue} onChange={e => update('discountValue', e.target.value)}
                                placeholder="0" className={errors.discountValue ? inputErrCls : inputCls} />
                            {errors.discountValue && <p className="text-sm text-red-500 mt-1.5">{errors.discountValue}</p>}
                        </div>
                        <div>
                            <label className={labelCls}>Max Cap (₹)</label>
                            <input type="number" value={form.maxDiscountCap} onChange={e => update('maxDiscountCap', e.target.value)}
                                placeholder="No cap" className={inputCls} />
                        </div>
                    </div>
                </div>

                {/* Constraints & Duration */}
                <div className="px-4 sm:px-8 py-4 sm:py-5 border-b border-gray-100">
                    <h3 className="text-sm sm:text-base font-bold text-gray-800">Constraints & Duration</h3>
                </div>
                <div className="px-4 sm:px-8 py-5 sm:py-6 space-y-4 sm:space-y-5 border-b border-gray-100">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                        <div>
                            <label className={labelCls}>Min Order (₹)</label>
                            <input type="number" value={form.minOrderValue} onChange={e => update('minOrderValue', e.target.value)}
                                placeholder="0" className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Total Limit</label>
                            <input type="number" value={form.usageLimitTotal} onChange={e => update('usageLimitTotal', e.target.value)}
                                placeholder="Unlimited" className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Per User</label>
                            <input type="number" value={form.usageLimitPerUser} onChange={e => update('usageLimitPerUser', e.target.value)}
                                placeholder="1" className={inputCls} />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                        <div>
                            <label className={labelCls}>Start Date <span className="text-red-500">*</span></label>
                            <input type="datetime-local" value={form.startTime} onChange={e => update('startTime', e.target.value)}
                                className={errors.startTime ? inputErrCls : inputCls} style={{ outline: 'none' }} />
                            {errors.startTime && <p className="text-sm text-red-500 mt-1.5">{errors.startTime}</p>}
                        </div>
                        <div>
                            <label className={labelCls}>End Date <span className="text-red-500">*</span></label>
                            <input type="datetime-local" value={form.endTime} onChange={e => update('endTime', e.target.value)}
                                className={errors.endTime ? inputErrCls : inputCls} style={{ outline: 'none' }} />
                            {errors.endTime && <p className="text-sm text-red-500 mt-1.5">{errors.endTime}</p>}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="px-4 sm:px-8 py-4 sm:py-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4">
                    <button onClick={onBack}
                        className="px-6 py-3 text-sm sm:text-base font-bold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-center">
                        Cancel
                    </button>
                    <button onClick={handleSubmit}
                        className="px-8 py-3 text-sm sm:text-base font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-sm">
                        <Save size={20} /> Create Offer
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OfferFormNewDish;
