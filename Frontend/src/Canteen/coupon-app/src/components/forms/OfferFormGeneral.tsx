/**
 * OfferFormGeneral â€” Corporate Professional Design
 * Clean, sharp, minimal form for GENERAL coupon type.
 */
import React, { useState } from 'react';
import { ArrowLeft, Save, Percent, DollarSign } from 'lucide-react';

interface OfferFormGeneralProps {
    onSubmit: (data: any) => void;
    onBack: () => void;
    initialData?: any;
}

const inputCls = `w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-base text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500`;
const inputErrCls = `w-full px-4 py-3 bg-white border border-red-400 rounded-lg text-base text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-500`;
const labelCls = `block text-sm font-semibold text-gray-600 mb-1.5`;

export const OfferFormGeneral: React.FC<OfferFormGeneralProps> = ({ onSubmit, onBack, initialData }) => {
    const [form, setForm] = useState({
        couponCode: initialData?.couponCode || '',
        title: initialData?.title || '',
        description: initialData?.description || '',
        discountType: initialData?.discountType || 'PERCENTAGE',
        discountValue: initialData?.discountValue || '',
        maxDiscountCap: initialData?.maxDiscountCap || '',
        minOrderValue: initialData?.minOrderValue || '',
        usageLimitTotal: initialData?.usageLimitTotal || '',
        usageLimitPerUser: initialData?.usageLimitPerUser || '',
        startTime: initialData?.startTime || '',
        endTime: initialData?.endTime || '',
        canteenId: initialData?.canteenId || '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = (): boolean => {
        const errs: Record<string, string> = {};
        if (!form.couponCode.trim()) errs.couponCode = 'Coupon code is required';
        else if (!/^[A-Z0-9_]+$/.test(form.couponCode)) errs.couponCode = 'Uppercase alphanumeric only';
        if (!form.title.trim()) errs.title = 'Title is required';
        if (!form.discountValue || parseFloat(form.discountValue) <= 0) errs.discountValue = 'Must be a positive number';
        if (form.discountType === 'PERCENTAGE' && parseFloat(form.discountValue) > 100) errs.discountValue = 'Max 100%';
        if (!form.startTime) errs.startTime = 'Start date is required';
        if (!form.endTime) errs.endTime = 'End date is required';
        if (form.startTime && form.endTime && new Date(form.endTime) <= new Date(form.startTime)) errs.endTime = 'Must be after start date';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;
        onSubmit({
            ...form,
            couponType: 'GENERAL',
            discountValue: parseFloat(form.discountValue),
            maxDiscountCap: form.maxDiscountCap ? parseFloat(form.maxDiscountCap) : null,
            minOrderValue: form.minOrderValue ? parseFloat(form.minOrderValue) : null,
            usageLimitTotal: form.usageLimitTotal ? parseInt(form.usageLimitTotal) : null,
            usageLimitPerUser: form.usageLimitPerUser ? parseInt(form.usageLimitPerUser) : null,
            canteenId: form.canteenId ? parseInt(form.canteenId) : null,
        });
    };

    const update = (key: string, val: string) => {
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
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">Create General Offer</h2>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">Standard discount applied to entire order</p>
                </div>
                <span className="px-2.5 py-1 sm:px-3 sm:py-1.5 bg-orange-50 text-orange-700 text-[10px] sm:text-xs font-bold rounded-md border border-orange-200 uppercase tracking-wide flex-shrink-0">General</span>
            </div>

            {/* Form Card */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                {/* Section: Basic Information */}
                <div className="px-4 sm:px-8 py-4 sm:py-5 border-b border-gray-100">
                    <h3 className="text-sm sm:text-base font-bold text-gray-800">Basic Information</h3>
                </div>
                <div className="px-4 sm:px-8 py-5 sm:py-6 space-y-4 sm:space-y-5 border-b border-gray-100">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className={labelCls}>Coupon Code <span className="text-red-500">*</span></label>
                            <input value={form.couponCode} onChange={e => update('couponCode', e.target.value.toUpperCase())}
                                placeholder="e.g. FLAT20" className={errors.couponCode ? inputErrCls : inputCls} />
                            {errors.couponCode && <p className="text-xs text-red-500 mt-1">{errors.couponCode}</p>}
                        </div>
                        <div>
                            <label className={labelCls}>Offer Title <span className="text-red-500">*</span></label>
                            <input value={form.title} onChange={e => update('title', e.target.value)}
                                placeholder="e.g. Flat 20% Off" className={errors.title ? inputErrCls : inputCls} />
                            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
                        </div>
                    </div>
                    <div>
                        <label className={labelCls}>Description</label>
                        <textarea value={form.description} onChange={e => update('description', e.target.value)}
                            rows={2} placeholder="Describe the offer for your customers..."
                            className={`${inputCls} resize-none`} />
                    </div>
                </div>

                {/* Section: Discount Configuration */}
                <div className="px-4 sm:px-8 py-4 sm:py-5 border-b border-gray-100">
                    <h3 className="text-sm sm:text-base font-bold text-gray-800">Discount Configuration</h3>
                </div>
                <div className="px-4 sm:px-8 py-5 sm:py-6 space-y-4 sm:space-y-5 border-b border-gray-100">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                        <div>
                            <label className={labelCls}>Discount Type</label>
                            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                                <button onClick={() => update('discountType', 'PERCENTAGE')}
                                    className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-1.5 transition-colors ${form.discountType === 'PERCENTAGE' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                                    <Percent size={16} /> Percentage
                                </button>
                                <button onClick={() => update('discountType', 'FLAT')}
                                    className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-1.5 transition-colors border-l-2 border-gray-200 ${form.discountType === 'FLAT' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                                    <DollarSign size={16} /> Flat (₹)
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className={labelCls}>Discount Value <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <input type="number" value={form.discountValue} onChange={e => update('discountValue', e.target.value)}
                                    placeholder="0" className={errors.discountValue ? inputErrCls : inputCls} />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
                                    {form.discountType === 'PERCENTAGE' ? '%' : '₹'}
                                </span>
                            </div>
                            {errors.discountValue && <p className="text-xs text-red-500 mt-1">{errors.discountValue}</p>}
                        </div>
                        <div>
                            <label className={labelCls}>Max Discount Cap (₹)</label>
                            <input type="number" value={form.maxDiscountCap} onChange={e => update('maxDiscountCap', e.target.value)}
                                placeholder="No cap" className={inputCls} />
                        </div>
                    </div>
                </div>

                {/* Section: Constraints */}
                <div className="px-4 sm:px-8 py-4 sm:py-5 border-b border-gray-100">
                    <h3 className="text-sm sm:text-base font-bold text-gray-800">Constraints & Limits</h3>
                </div>
                <div className="px-4 sm:px-8 py-5 sm:py-6 space-y-4 sm:space-y-5 border-b border-gray-100">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                        <div>
                            <label className={labelCls}>Min Order Value (₹)</label>
                            <input type="number" value={form.minOrderValue} onChange={e => update('minOrderValue', e.target.value)}
                                placeholder="No minimum" className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Total Usage Limit</label>
                            <input type="number" value={form.usageLimitTotal} onChange={e => update('usageLimitTotal', e.target.value)}
                                placeholder="Unlimited" className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Per User Limit</label>
                            <input type="number" value={form.usageLimitPerUser} onChange={e => update('usageLimitPerUser', e.target.value)}
                                placeholder="Unlimited" className={inputCls} />
                        </div>
                    </div>
                </div>

                {/* Section: Campaign Duration */}
                <div className="px-4 sm:px-8 py-4 sm:py-5 border-b border-gray-100">
                    <h3 className="text-sm sm:text-base font-bold text-gray-800">Campaign Duration</h3>
                </div>
                <div className="px-4 sm:px-8 py-5 sm:py-6 space-y-4 sm:space-y-5 border-b border-gray-100">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                        <div>
                            <label className={labelCls}>Start Date & Time <span className="text-red-500">*</span></label>
                            <input type="datetime-local" value={form.startTime} onChange={e => update('startTime', e.target.value)}
                                className={errors.startTime ? inputErrCls : inputCls} />
                            {errors.startTime && <p className="text-sm text-red-500 mt-1.5">{errors.startTime}</p>}
                        </div>
                        <div>
                            <label className={labelCls}>End Date & Time <span className="text-red-500">*</span></label>
                            <input type="datetime-local" value={form.endTime} onChange={e => update('endTime', e.target.value)}
                                className={errors.endTime ? inputErrCls : inputCls} />
                            {errors.endTime && <p className="text-sm text-red-500 mt-1.5">{errors.endTime}</p>}
                        </div>
                    </div>
                </div>

                {/* Summary Bar */}
                <div className="px-4 sm:px-8 py-4 sm:py-5 bg-gray-50 border-b border-gray-100">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm text-gray-600">
                        <span><span className="font-bold text-gray-800">Code:</span> {form.couponCode || '—'}</span>
                        <span><span className="font-bold text-gray-800">Discount:</span> {form.discountValue ? (form.discountType === 'PERCENTAGE' ? `${form.discountValue}%` : `₹${form.discountValue}`) : '—'}</span>
                        {form.minOrderValue && <span><span className="font-bold text-gray-800">Min Order:</span> ₹{form.minOrderValue}</span>}
                        {form.maxDiscountCap && <span><span className="font-bold text-gray-800">Max Cap:</span> ₹{form.maxDiscountCap}</span>}
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

export default OfferFormGeneral;
