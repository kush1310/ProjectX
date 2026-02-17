import React, { useState, useEffect } from 'react';
import { X, Gift, Layers, Percent } from 'lucide-react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useScrollLock } from '../../../../hooks/useScrollLock';
import { fetchCategories, fetchMenu, fetchCanteens } from '../../../utils/canteenStore';
import type { Coupon } from '../../../utils/canteenStore';

interface CreateCouponFormProps {
    onClose: () => void;
    onSubmit: (coupon: Coupon) => void;
    initialData?: Coupon | null;
}



export function CreateCouponForm({ onClose, onSubmit, initialData }: CreateCouponFormProps) {
    const { lockScroll, unlockScroll } = useScrollLock();

    useEffect(() => {
        lockScroll();
        return () => unlockScroll();
    }, [lockScroll, unlockScroll]);

    const [activeTab, setActiveTab] = useState<'DISCOUNT' | 'BOGO'>(initialData?.type || 'DISCOUNT');
    const [fetchedCategories, setFetchedCategories] = useState<{id: string | number, name: string}[]>([]);
    const [fetchedItems, setFetchedItems] = useState<{id: number, name: string}[]>([]);
    
    // Fetch Data for Dropdowns
    useEffect(() => {
        const loadMetadata = async () => {
            try {
                const canteens = await fetchCanteens();
                if (canteens.length > 0) {
                    const canteenId = canteens[0].id;
                    const [cats, items] = await Promise.all([
                        fetchCategories(canteenId),
                        fetchMenu(canteenId)
                    ]);
                    setFetchedCategories(cats);
                    setFetchedItems(items.map((i:any) => ({ id: i.id, name: i.name })));
                }
            } catch (err) {
                console.error("Failed to load metadata for coupon form", err);
            }
        };
        loadMetadata();
    }, []);
    
    const [formData, setFormData] = useState({
        code: initialData?.code || '',
        title: initialData?.title || '',
        color: initialData?.color || '#ef4444', // Zomato Red-ish default
        description: initialData?.description || '',
        
        // Advanced Scope
        scope: initialData?.scope || 'GLOBAL',
        targetIds: initialData?.targetIds || '',
        
        // Discount Fields
        discountValue: initialData?.discountValue?.toString() || '',
        discountType: initialData?.discountType || 'PERCENTAGE',
        maxDiscountAmount: initialData?.maxDiscountAmount?.toString() || '',
        minOrderValue: initialData?.minOrderValue?.toString() || '',
        
        // BOGO Fields
        bogoBuyQty: initialData?.bogoBuyQty?.toString() || '1',
        bogoGetQty: initialData?.bogoGetQty?.toString() || '1',

        // Limits
        usageLimit: initialData?.usageLimit?.toString() || '',
        validFrom: initialData?.validFrom ? new Date(initialData.validFrom).toISOString().split('T')[0] : '',
        validUntil: initialData?.validUntil ? new Date(initialData.validUntil).toISOString().split('T')[0] : '', 
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isShaking, setIsShaking] = useState(false);

    // Validation Logic
    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.code.trim()) newErrors.code = "Required";
        if (!formData.title.trim()) newErrors.title = "Required";

        if (activeTab === 'DISCOUNT') {
             if (!formData.discountValue) newErrors.discountValue = "Required";
        }

        if (activeTab === 'BOGO') {
            if (!formData.bogoBuyQty) newErrors.bogoBuyQty = "Required";
            if (!formData.bogoGetQty) newErrors.bogoGetQty = "Required";
        }

        if (formData.scope === 'CATEGORY' && !formData.targetIds) newErrors.targetIds = "Select a category";
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) {
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 500);
        } else {
            const newCoupon: Coupon = {
                id: initialData?.id, 
                code: formData.code,
                title: formData.title,
                description: formData.description,
                color: formData.color,
                isActive: initialData ? initialData.isActive : true,
                isCustom: true,
                
                // Advanced Schema
                type: activeTab,
                scope: formData.scope as any,
                targetIds: formData.targetIds,
                
                // conditionally add fields based on type
                ...(activeTab === 'DISCOUNT' ? {
                    discountType: formData.discountType as 'PERCENTAGE' | 'FLAT',
                    discountValue: Number(formData.discountValue),
                    maxDiscountAmount: formData.maxDiscountAmount ? Number(formData.maxDiscountAmount) : undefined,
                } : {
                    discountType: 'FLAT', // Fallback
                    discountValue: 0,
                    bogoBuyQty: Number(formData.bogoBuyQty),
                    bogoGetQty: Number(formData.bogoGetQty)
                }),

                minOrderValue: formData.minOrderValue ? Number(formData.minOrderValue) : undefined,
                validFrom: formData.validFrom ? new Date(formData.validFrom).toISOString() : undefined,
                validUntil: formData.validUntil ? new Date(formData.validUntil).toISOString() : undefined,
                usageLimit: formData.usageLimit ? Number(formData.usageLimit) : undefined,
            };
            onSubmit(newCoupon);
            onClose();
        }
    };

    const handleGenerateCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setFormData(prev => ({ ...prev, code: result }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div 
                className={`bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col ${isShaking ? 'animate-shake' : ''}`}
                style={{ animation: isShaking ? 'shake 0.5s' : undefined }}
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            {initialData ? 'Edit Promotion' : 'Create Promotion'}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">Configure your campaign rules and targets.</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex p-2 gap-2 bg-gray-50 border-b border-gray-100">
                    <button
                        type="button"
                        onClick={() => setActiveTab('DISCOUNT')}
                        className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                            activeTab === 'DISCOUNT' 
                            ? 'bg-white text-blue-600 shadow-sm border border-gray-200' 
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                        <Percent size={18} />
                        Discount Offer
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('BOGO')}
                        className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                            activeTab === 'BOGO' 
                            ? 'bg-white text-rose-600 shadow-sm border border-gray-200' 
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                        <Gift size={18} />
                        Buy X Get Y
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        
                        {/* Scope Section (Dynamic) */}
                        <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                <Layers size={12} /> Targeting Scope
                            </label>
                            <div className="flex gap-3 flex-col sm:flex-row">
                                <select
                                    value={formData.scope}
                                    onChange={e => setFormData({...formData, scope: e.target.value as any, targetIds: ''})}
                                    className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                >
                                    <option value="GLOBAL">Global (All Items)</option>
                                    <option value="CATEGORY">Specific Category</option>
                                    <option value="ITEM">Specific Item</option>
                                </select>

                                {formData.scope === 'CATEGORY' && (
                                    <select
                                        value={formData.targetIds}
                                        onChange={e => setFormData({...formData, targetIds: e.target.value})}
                                        className="flex-1 px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        <option value="">Select Category...</option>
                                        {fetchedCategories.map(cat => (
                                            <option key={cat.id} value={cat.name}>{cat.name}</option> 
                                        ))}
                                    </select>
                                )}
                                
                                {formData.scope === 'ITEM' && (
                                    <select
                                        value={formData.targetIds}
                                        onChange={e => setFormData({...formData, targetIds: e.target.value})}
                                        className="flex-1 px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        <option value="">Select Item...</option>
                                        {fetchedItems.map(item => (
                                            <option key={item.id} value={item.id}>{item.name}</option> 
                                        ))}
                                    </select>
                                )}
                            </div>
                            {errors.targetIds && <p className="text-xs text-red-500">{errors.targetIds}</p>}
                        </div>

                        {/* Basic Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-gray-700">Campaign Code</label>
                                <div className="relative">
                                    <input 
                                        value={formData.code}
                                        onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                                        placeholder="SUMMER20"
                                        className="w-full pl-3 pr-20 py-2.5 rounded-lg border border-gray-300 text-sm font-mono tracking-wide focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none uppercase"
                                    />
                                    <button 
                                        type="button" 
                                        onClick={handleGenerateCode}
                                        className="absolute right-1 top-1 bottom-1 px-3 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                                    >
                                        AUTOGEN
                                    </button>
                                </div>
                                {errors.code && <p className="text-xs text-red-500">{errors.code}</p>}
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-gray-700">Display Title</label>
                                <input 
                                    value={formData.title}
                                    onChange={e => setFormData({...formData, title: e.target.value})}
                                    placeholder="Flash Sale"
                                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                />
                                {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
                            </div>
                        </div>

                        {/* Logic Section based on Tab */}
                        {activeTab === 'DISCOUNT' ? (
                            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-gray-700">Discount Value</label>
                                    <div className="flex">
                                        <input 
                                            type="number"
                                            value={formData.discountValue}
                                            onChange={e => setFormData({...formData, discountValue: e.target.value})}
                                            className="w-full px-3 py-2.5 rounded-l-lg border border-gray-300 border-r-0 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="20"
                                        />
                                        <select
                                            value={formData.discountType}
                                            onChange={e => setFormData({...formData, discountType: e.target.value as any})}
                                            className="px-3 bg-gray-50 border border-gray-300 rounded-r-lg text-sm font-semibold text-gray-600 outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="PERCENTAGE">%</option>
                                            <option value="FLAT">₹</option>
                                        </select>
                                    </div>
                                    {errors.discountValue && <p className="text-xs text-red-500">{errors.discountValue}</p>}
                                </div>
                                {formData.discountType === 'PERCENTAGE' && (
                                    <div className="space-y-1">
                                        <label className="text-sm font-semibold text-gray-700">Max Discount (₹)</label>
                                        <input 
                                            type="number"
                                            value={formData.maxDiscountAmount}
                                            onChange={e => setFormData({...formData, maxDiscountAmount: e.target.value})}
                                            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="No Limit"
                                        />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl grid grid-cols-2 gap-8 items-center animate-in fade-in slide-in-from-top-2">
                                <div className="text-center space-y-2">
                                    <label className="text-xs font-bold text-orange-600 uppercase">Buy Quantity</label>
                                    <div className="flex items-center justify-center gap-3">
                                        <span className="text-2xl font-bold text-gray-800">{formData.bogoBuyQty}</span>
                                        <div className="flex flex-col gap-1">
                                            <button type="button" onClick={() => setFormData(p => ({...p, bogoBuyQty: String(Number(p.bogoBuyQty)+1)}))} className="w-5 h-5 bg-white rounded shadow text-xs hover:bg-gray-50">+</button>
                                            <button type="button" onClick={() => setFormData(p => ({...p, bogoBuyQty: String(Math.max(1, Number(p.bogoBuyQty)-1))}))} className="w-5 h-5 bg-white rounded shadow text-xs hover:bg-gray-50">-</button>
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-500">Items to buy</span>
                                </div>
                                <div className="text-center space-y-2 relative">
                                    <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 text-orange-300 font-bold text-xl">→</div>
                                    <label className="text-xs font-bold text-orange-600 uppercase">Get Quantity</label>
                                    <div className="flex items-center justify-center gap-3">
                                        <span className="text-2xl font-bold text-gray-800">{formData.bogoGetQty}</span>
                                        <div className="flex flex-col gap-1">
                                            <button type="button" onClick={() => setFormData(p => ({...p, bogoGetQty: String(Number(p.bogoGetQty)+1)}))} className="w-5 h-5 bg-white rounded shadow text-xs hover:bg-gray-50">+</button>
                                            <button type="button" onClick={() => setFormData(p => ({...p, bogoGetQty: String(Math.max(1, Number(p.bogoGetQty)-1))}))} className="w-5 h-5 bg-white rounded shadow text-xs hover:bg-gray-50">-</button>
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-500">Free items</span>
                                </div>
                            </div>
                        )}

                        {/* Common Limits */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-gray-700">Min Order (₹)</label>
                                <input 
                                    type="number"
                                    value={formData.minOrderValue}
                                    onChange={e => setFormData({...formData, minOrderValue: e.target.value})}
                                    placeholder="0"
                                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-gray-700">Usage Limit</label>
                                <input 
                                    type="number"
                                    value={formData.usageLimit}
                                    onChange={e => setFormData({...formData, usageLimit: e.target.value})}
                                    placeholder="∞"
                                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                             <div className="space-y-1">
                                <label className="text-sm font-semibold text-gray-700">Color</label>
                                <div className="flex items-center gap-2 h-[42px] px-2 border border-gray-300 rounded-lg bg-white">
                                    <input 
                                        type="color"
                                        value={formData.color}
                                        onChange={e => setFormData({...formData, color: e.target.value})}
                                        className="w-8 h-8 rounded cursor-pointer border-none p-0"
                                    />
                                    <span className="text-xs text-gray-500 font-mono">{formData.color}</span>
                                </div>
                            </div>
                        </div>

                         <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-1">
                                <label className="text-sm font-semibold text-gray-700">Valid From</label>
                                <DatePicker
                                    selected={formData.validFrom ? new Date(formData.validFrom) : null}
                                    onChange={(date: Date | null) => setFormData({ ...formData, validFrom: date ? date.toISOString().split('T')[0] : '' })}
                                    dateFormat="dd-MMM-yyyy"
                                    placeholderText="Start Date"
                                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                             <div className="space-y-1">
                                <label className="text-sm font-semibold text-gray-700">Valid Until</label>
                                <DatePicker
                                    selected={formData.validUntil ? new Date(formData.validUntil) : null}
                                    onChange={(date: Date | null) => setFormData({ ...formData, validUntil: date ? date.toISOString().split('T')[0] : '' })}
                                    dateFormat="dd-MMM-yyyy"
                                    placeholderText="End Date"
                                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                         </div>
                        
                         <div className="space-y-1">
                            <label className="text-sm font-semibold text-gray-700">Description</label>
                            <textarea 
                                value={formData.description}
                                onChange={e => setFormData({...formData, description: e.target.value})}
                                placeholder="Describe the deal terms..."
                                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none h-20 resize-none"
                            />
                        </div>

                    </form>
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3">
                    <button 
                        onClick={onClose}
                        className="flex-1 py-3 px-4 rounded-xl text-sm font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSubmit}
                        className="flex-2 w-2/3 py-3 px-4 rounded-xl text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        style={{ background: activeTab === 'DISCOUNT' ? '#2563eb' : '#e11d48' }}
                    >
                        {initialData ? 'Save Changes' : 'Launch Campaign'}
                    </button>
                </div>
            </div>
        </div>
    );
};
