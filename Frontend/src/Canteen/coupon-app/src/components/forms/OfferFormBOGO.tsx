/**
 * OfferFormBOGO – Corporate Professional Design
 * BOGO form with account-based menu isolation and rich item details.
 * Items are fetched from the authenticated vendor's own canteen.
 */
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Plus, Minus, Loader2, ShoppingBag } from 'lucide-react';
import type { MenuItem } from '../../../../utils/canteenStore';
import { fetchMenu, fetchMyCanteen } from '../../../../utils/canteenStore';

interface OfferFormBOGOProps {
    onSubmit: (data: any) => void;
    onBack: () => void;
    initialData?: any;
}

const inputCls = `w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-base text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500`;
const inputErrCls = `w-full px-4 py-3 bg-white border border-red-400 rounded-lg text-base text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-500`;
const selectCls = `w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-base text-gray-900 outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500`;
const labelCls = `block text-sm font-semibold text-gray-600 mb-1.5`;

/** Veg dot indicator */
const VegDot = ({ isVeg }: { isVeg?: boolean }) => (
    <span
        className="inline-block w-3 h-3 rounded-sm border-2 border-green-600 flex-shrink-0"
        title="Vegetarian"
    >
        <span className="block w-1.5 h-1.5 rounded-full bg-green-600 m-auto mt-0.5" />
    </span>
);

/** Rich item card for selected item display */
const SelectedItemBadge = ({ item, label }: { item: MenuItem; label: string }) => (
    <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
        <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wide mb-1">{label}</p>
        <div className="flex items-center gap-2">
            <VegDot isVeg={item.isVegetarian ?? item.dietary?.vegetarian} />
            <span className="text-sm font-bold text-gray-900 flex-1 truncate">{item.name}</span>
            <span className="text-sm font-bold text-indigo-700 ml-auto">₹{item.price}</span>
        </div>
        <p className="text-xs text-gray-400 mt-0.5 ml-5">{item.category}{item.subCategory ? ` · ${item.subCategory}` : ''}</p>
    </div>
);

export const OfferFormBOGO: React.FC<OfferFormBOGOProps> = ({ onSubmit, onBack, initialData }) => {
    const [resolvedCanteenId, setResolvedCanteenId] = useState<number>(initialData?.canteenId || 0);
    const [canteenName, setCanteenName] = useState<string>('');
    const [loadingCanteen, setLoadingCanteen] = useState(true);

    const [form, setForm] = useState({
        couponCode: initialData?.couponCode || '',
        title: initialData?.title || '',
        description: initialData?.description || '',
        bogoBuyQty: initialData?.bogoBuyQty || 1,
        bogoGetQty: initialData?.bogoGetQty || 1,
        isSameItem: initialData?.applicableItemIds?.length === 1 && initialData?.bogoFreeItemId === initialData?.applicableItemIds[0],
        buyItemId: initialData?.applicableItemIds?.[0] || null,
        freeItemId: initialData?.bogoFreeItemId || null,
        minOrderValue: initialData?.minOrderValue || '0',
        usageLimitTotal: initialData?.usageLimitTotal || '',
        usageLimitPerUser: initialData?.usageLimitPerUser || '1',
        startTime: initialData?.startTime || '',
        endTime: initialData?.endTime || '',
    });

    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [menuLoading, setMenuLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Step 1: Resolve vendor's canteen from JWT
    useEffect(() => {
        const resolveCanteen = async () => {
            setLoadingCanteen(true);
            if (initialData?.canteenId) {
                setResolvedCanteenId(initialData.canteenId);
                setLoadingCanteen(false);
                return;
            }
            const canteen = await fetchMyCanteen();
            if (canteen) {
                setResolvedCanteenId(canteen.id);
                setCanteenName(canteen.name);
            }
            setLoadingCanteen(false);
        };
        resolveCanteen();
    }, []);

    // Step 2: Load menu once canteenId is resolved
    useEffect(() => {
        if (!resolvedCanteenId) return;
        setMenuLoading(true);
        fetchMenu(resolvedCanteenId).then(data => {
            setMenuItems(data);
            setMenuLoading(false);
        });
    }, [resolvedCanteenId]);

    const getItemById = (id: number | string | null): MenuItem | undefined =>
        menuItems.find(i => i.id === Number(id));

    const validate = (): boolean => {
        const errs: Record<string, string> = {};
        if (!form.couponCode.trim()) errs.couponCode = 'Coupon code is required';
        if (!form.title.trim()) errs.title = 'Title is required';
        if (!form.startTime) errs.startTime = 'Start date is required';
        if (!form.endTime) errs.endTime = 'End date is required';
        if (form.startTime && form.endTime && new Date(form.endTime) <= new Date(form.startTime)) errs.endTime = 'Must be after start';
        if (!form.isSameItem && !form.buyItemId) errs.buyItemId = 'Select an item';
        if (!form.isSameItem && !form.freeItemId) errs.freeItemId = 'Select a free item';
        if (form.isSameItem && !form.buyItemId) errs.buyItemId = 'Select an item';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;
        onSubmit({
            ...form,
            couponType: 'BOGO',
            discountType: 'BOGO',
            applicableItemIds: form.buyItemId ? [parseInt(form.buyItemId)] : [],
            bogoFreeItemId: form.isSameItem ? form.buyItemId : form.freeItemId,
            minOrderValue: parseFloat(form.minOrderValue),
            usageLimitTotal: form.usageLimitTotal ? parseInt(form.usageLimitTotal) : null,
            usageLimitPerUser: parseInt(form.usageLimitPerUser),
            canteenId: resolvedCanteenId,
        });
    };

    const update = (key: string, val: any) => {
        setForm(p => ({ ...p, [key]: val }));
        if (errors[key]) setErrors(p => { const n = { ...p }; delete n[key]; return n; });
    };

    const selectedBuyItem = getItemById(form.buyItemId);
    const selectedFreeItem = getItemById(form.freeItemId);

    if (loadingCanteen) {
        return (
            <div className="max-w-3xl mx-auto px-6 pb-20 flex items-center justify-center py-20">
                <div className="text-center">
                    <Loader2 size={32} className="animate-spin text-indigo-600 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">Loading your restaurant menu...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto px-3 sm:px-6 pb-20">
            {/* Header */}
            <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                <button onClick={onBack} className="p-2 sm:p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-500 flex-shrink-0">
                    <ArrowLeft size={20} className="sm:hidden" />
                    <ArrowLeft size={22} className="hidden sm:block" />
                </button>
                <div className="flex-1 min-w-0">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">Create BOGO Offer</h2>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">
                        Buy X, Get Y Free
                        {canteenName && <span className="ml-2 text-indigo-600 font-medium">· {canteenName}</span>}
                    </p>
                </div>
                <span className="px-2.5 py-1 sm:px-3 sm:py-1.5 bg-violet-50 text-violet-700 text-[10px] sm:text-xs font-bold rounded-md border border-violet-200 uppercase tracking-wide flex-shrink-0">BOGO</span>
            </div>

            {/* Form Card */}
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
                                placeholder="e.g. BOGO50" className={errors.couponCode ? inputErrCls : inputCls} />
                            {errors.couponCode && <p className="text-sm text-red-500 mt-1.5">{errors.couponCode}</p>}
                        </div>
                        <div>
                            <label className={labelCls}>Offer Title <span className="text-red-500">*</span></label>
                            <input value={form.title} onChange={e => update('title', e.target.value)}
                                placeholder="e.g. Buy 1 Get 1 Free" className={errors.title ? inputErrCls : inputCls} />
                            {errors.title && <p className="text-sm text-red-500 mt-1.5">{errors.title}</p>}
                        </div>
                    </div>
                    <div>
                        <label className={labelCls}>Description</label>
                        <textarea value={form.description} onChange={e => update('description', e.target.value)}
                            rows={2} placeholder="Describe the BOGO offer..."
                            className={`${inputCls} resize-none`} />
                    </div>
                </div>

                {/* BOGO Configuration */}
                <div className="px-4 sm:px-8 py-4 sm:py-5 border-b border-gray-100">
                    <h3 className="text-sm sm:text-base font-bold text-gray-800">BOGO Configuration</h3>
                </div>
                <div className="px-4 sm:px-8 py-5 sm:py-6 space-y-5 sm:space-y-6 border-b border-gray-100">
                    {/* Quantity controls */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                        <div>
                            <label className={labelCls}>Buy Quantity</label>
                            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                                <button onClick={() => update('bogoBuyQty', Math.max(1, form.bogoBuyQty - 1))}
                                    className="px-4 py-3 bg-gray-50 hover:bg-gray-100 border-r border-gray-300 text-gray-600 transition-colors">
                                    <Minus size={16} />
                                </button>
                                <span className="flex-1 text-center text-base font-bold text-gray-900 py-3">{form.bogoBuyQty}</span>
                                <button onClick={() => update('bogoBuyQty', form.bogoBuyQty + 1)}
                                    className="px-4 py-3 bg-gray-50 hover:bg-gray-100 border-l border-gray-300 text-gray-600 transition-colors">
                                    <Plus size={16} />
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className={labelCls}>Get Free Quantity</label>
                            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                                <button onClick={() => update('bogoGetQty', Math.max(1, form.bogoGetQty - 1))}
                                    className="px-4 py-3 bg-gray-50 hover:bg-gray-100 border-r border-gray-300 text-gray-600 transition-colors">
                                    <Minus size={16} />
                                </button>
                                <span className="flex-1 text-center text-base font-bold text-gray-900 py-3">{form.bogoGetQty}</span>
                                <button onClick={() => update('bogoGetQty', form.bogoGetQty + 1)}
                                    className="px-4 py-3 bg-gray-50 hover:bg-gray-100 border-l border-gray-300 text-gray-600 transition-colors">
                                    <Plus size={16} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Same/Different item toggle */}
                    <div>
                        <label className={labelCls}>Free Item Type</label>
                        <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                            <button onClick={() => update('isSameItem', true)}
                                className={`flex-1 py-3 text-sm font-bold transition-colors ${form.isSameItem ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                                Same Item
                            </button>
                            <button onClick={() => update('isSameItem', false)}
                                className={`flex-1 py-3 text-sm font-bold border-l border-gray-300 transition-colors ${!form.isSameItem ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                                Different Item
                            </button>
                        </div>
                    </div>

                    {/* Item selectors — Rich dropdowns */}
                    {menuLoading ? (
                        <div className="flex items-center gap-2 py-4 text-sm text-gray-400">
                            <Loader2 size={16} className="animate-spin" />
                            Loading menu items...
                        </div>
                    ) : (
                        <>
                            {/* Menu stats */}
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                <ShoppingBag size={13} />
                                <span>{menuItems.length} items available from your restaurant</span>
                            </div>

                            <div className={`grid gap-5 ${form.isSameItem ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
                                <div>
                                    <label className={labelCls}>Buy Item <span className="text-red-500">*</span></label>
                                    <select value={form.buyItemId || ''} onChange={e => update('buyItemId', e.target.value)}
                                        className={errors.buyItemId ? inputErrCls : selectCls}>
                                        <option value="">Select item...</option>
                                        {menuItems.map(item => (
                                            <option key={item.id} value={item.id}>
                                                {'[V] ' + item.name + ' — ₹' + item.price + ' · ' + item.category}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.buyItemId && <p className="text-sm text-red-500 mt-1.5">{errors.buyItemId}</p>}
                                    {/* Rich preview of selected buy item */}
                                    {selectedBuyItem && (
                                        <div className="mt-2">
                                            <SelectedItemBadge item={selectedBuyItem} label="Buy Item" />
                                        </div>
                                    )}
                                </div>
                                {!form.isSameItem && (
                                    <div>
                                        <label className={labelCls}>Free Item <span className="text-red-500">*</span></label>
                                        <select value={form.freeItemId || ''} onChange={e => update('freeItemId', e.target.value)}
                                            className={errors.freeItemId ? inputErrCls : selectCls}>
                                            <option value="">Select free item...</option>
                                            {menuItems.map(item => (
                                                <option key={item.id} value={item.id}>
                                                    {'[V] ' + item.name + ' — ₹' + item.price + ' · ' + item.category}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.freeItemId && <p className="text-sm text-red-500 mt-1.5">{errors.freeItemId}</p>}
                                        {/* Rich preview of selected free item */}
                                        {selectedFreeItem && (
                                            <div className="mt-2">
                                                <SelectedItemBadge item={selectedFreeItem} label="Free Item" />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Constraints */}
                <div className="px-4 sm:px-8 py-4 sm:py-5 border-b border-gray-100">
                    <h3 className="text-sm sm:text-base font-bold text-gray-800">Constraints &amp; Duration</h3>
                </div>
                <div className="px-4 sm:px-8 py-5 sm:py-6 space-y-4 sm:space-y-5 border-b border-gray-100">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                        <div>
                            <label className={labelCls}>Min Order Value (₹)</label>
                            <input type="number" value={form.minOrderValue} onChange={e => update('minOrderValue', e.target.value)}
                                placeholder="0" className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Total Usage Limit</label>
                            <input type="number" value={form.usageLimitTotal} onChange={e => update('usageLimitTotal', e.target.value)}
                                placeholder="Unlimited" className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Per User Limit</label>
                            <input type="number" value={form.usageLimitPerUser} onChange={e => update('usageLimitPerUser', e.target.value)}
                                placeholder="1" className={inputCls} />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                        <div>
                            <label className={labelCls}>Start Date &amp; Time <span className="text-red-500">*</span></label>
                            <input type="datetime-local" value={form.startTime} onChange={e => update('startTime', e.target.value)}
                                className={errors.startTime ? inputErrCls : inputCls} />
                            {errors.startTime && <p className="text-sm text-red-500 mt-1.5">{errors.startTime}</p>}
                        </div>
                        <div>
                            <label className={labelCls}>End Date &amp; Time <span className="text-red-500">*</span></label>
                            <input type="datetime-local" value={form.endTime} onChange={e => update('endTime', e.target.value)}
                                className={errors.endTime ? inputErrCls : inputCls} />
                            {errors.endTime && <p className="text-sm text-red-500 mt-1.5">{errors.endTime}</p>}
                        </div>
                    </div>
                </div>

                {/* Summary */}
                <div className="px-4 sm:px-8 py-4 sm:py-5 bg-gray-50 border-b border-gray-100">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm text-gray-600">
                        <span><span className="font-bold text-gray-800">Code:</span> {form.couponCode || '—'}</span>
                        <span><span className="font-bold text-gray-800">Buy:</span> {form.bogoBuyQty}</span>
                        <span><span className="font-bold text-gray-800">Get Free:</span> {form.bogoGetQty}</span>
                        <span><span className="font-bold text-gray-800">Type:</span> {form.isSameItem ? 'Same Item' : 'Different Item'}</span>
                        {selectedBuyItem && <span><span className="font-bold text-gray-800">Item:</span> {selectedBuyItem.name} (₹{selectedBuyItem.price})</span>}
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

export default OfferFormBOGO;
