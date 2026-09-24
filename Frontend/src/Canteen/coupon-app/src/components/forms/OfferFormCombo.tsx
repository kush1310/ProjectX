/**
 * OfferFormCombo — Account-based, Rich Item Details
 * Combo offer: bundle items for a special discount.
 * Menu fetched from authenticated vendor's own canteen.
 */
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Plus, X, Loader2, Tag, ShoppingBag } from 'lucide-react';
import type { MenuItem } from '../../../../utils/canteenStore';
import { fetchMenu, fetchMyCanteen } from '../../../../utils/canteenStore';

interface OfferFormComboProps {
    onSubmit: (data: any) => void;
    onBack: () => void;
    initialData?: any;
}

interface ComboItem {
    menuItemId: number;
    itemName: string;
    itemPrice: number;
    category: string;
    requiredQty: number;
    isVeg?: boolean;
}

const inputCls = `w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-base text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500`;
const inputErrCls = `w-full px-4 py-3 bg-white border border-red-400 rounded-lg text-base text-gray-900 outline-none transition-colors focus:border-red-500 focus:ring-1 focus:ring-red-500`;
const selectCls = `w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-base text-gray-900 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500`;
const labelCls = `block text-sm font-semibold text-gray-600 mb-1.5`;

const VegDot = ({ isVeg }: { isVeg?: boolean }) => (
    <span className="inline-flex items-center justify-center w-4 h-4 rounded-sm border-2 border-green-600 flex-shrink-0">
        <span className="w-2 h-2 rounded-full bg-green-600" />
    </span>
);

export const OfferFormCombo: React.FC<OfferFormComboProps> = ({ onSubmit, onBack, initialData }) => {
    const [resolvedCanteenId, setResolvedCanteenId] = useState<number>(initialData?.canteenId || 0);
    const [canteenName, setCanteenName] = useState<string>('');
    const [loadingCanteen, setLoadingCanteen] = useState(true);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [menuLoading, setMenuLoading] = useState(false);
    const [form, setForm] = useState({
        couponCode: initialData?.couponCode || '',
        title: initialData?.title || '',
        description: initialData?.description || '',
        discountType: (initialData?.discountType as 'PERCENTAGE' | 'FLAT') || 'PERCENTAGE',
        discountValue: initialData?.discountValue || '20',
        maxDiscountCap: initialData?.maxDiscountCap || '',
        minOrderValue: initialData?.minOrderValue || '0',
        usageLimitTotal: initialData?.usageLimitTotal || '',
        usageLimitPerUser: initialData?.usageLimitPerUser || '1',
        startTime: initialData?.startTime || '',
        endTime: initialData?.endTime || '',
    });
    const [comboItems, setComboItems] = useState<ComboItem[]>(
        initialData?.applicableItems?.map((ai: any) => ({
            menuItemId: ai.menuItemId, itemName: ai.itemName, itemPrice: ai.itemPrice,
            category: '', requiredQty: ai.requiredQty || 1, isVeg: undefined,
        })) || []
    );
    const [selectedItemId, setSelectedItemId] = useState<string>('');
    const [selectedQty, setSelectedQty] = useState<number>(1);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        const resolveCanteen = async () => {
            setLoadingCanteen(true);
            if (initialData?.canteenId) { setResolvedCanteenId(initialData.canteenId); setLoadingCanteen(false); return; }
            const canteen = await fetchMyCanteen();
            if (canteen) { setResolvedCanteenId(canteen.id); setCanteenName(canteen.name); }
            setLoadingCanteen(false);
        };
        resolveCanteen();
    }, []);

    useEffect(() => {
        if (!resolvedCanteenId) return;
        setMenuLoading(true);
        fetchMenu(resolvedCanteenId).then(data => { setMenuItems(data); setMenuLoading(false); });
    }, [resolvedCanteenId]);

    const update = (key: string, val: any) => {
        setForm(p => ({ ...p, [key]: val }));
        if (errors[key]) setErrors(p => { const n = { ...p }; delete n[key]; return n; });
    };

    const addComboItem = () => {
        if (!selectedItemId) return;
        const found = menuItems.find(i => i.id === parseInt(selectedItemId));
        if (!found || comboItems.some(ci => ci.menuItemId === found.id)) return;
        setComboItems(prev => [...prev, {
            menuItemId: found.id, itemName: found.name, itemPrice: found.price,
            category: found.category, requiredQty: selectedQty,
            isVeg: found.isVegetarian ?? found.dietary?.vegetarian,
        }]);
        setSelectedItemId(''); setSelectedQty(1);
        if (errors.comboItems) setErrors(p => { const n = { ...p }; delete n.comboItems; return n; });
    };

    const removeComboItem = (id: number) => setComboItems(prev => prev.filter(ci => ci.menuItemId !== id));
    const updateQty = (id: number, qty: number) =>
        setComboItems(prev => prev.map(ci => ci.menuItemId === id ? { ...ci, requiredQty: Math.max(1, qty) } : ci));

    const validate = () => {
        const errs: Record<string, string> = {};
        if (!form.couponCode.trim()) errs.couponCode = 'Coupon code required';
        if (!form.title.trim()) errs.title = 'Title required';
        if (!form.discountValue || parseFloat(form.discountValue) <= 0) errs.discountValue = 'Must be > 0';
        if (form.discountType === 'PERCENTAGE' && parseFloat(form.discountValue) > 100) errs.discountValue = 'Cannot exceed 100%';
        if (comboItems.length < 2) errs.comboItems = 'Add at least 2 items';
        if (!form.startTime) errs.startTime = 'Start date required';
        if (!form.endTime) errs.endTime = 'End date required';
        if (form.startTime && form.endTime && new Date(form.endTime) <= new Date(form.startTime)) errs.endTime = 'Must be after start';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;
        onSubmit({
            ...form, couponType: 'COMBO',
            discountValue: parseFloat(form.discountValue),
            maxDiscountCap: form.maxDiscountCap ? parseFloat(form.maxDiscountCap) : null,
            minOrderValue: parseFloat(form.minOrderValue),
            usageLimitTotal: form.usageLimitTotal ? parseInt(form.usageLimitTotal) : null,
            usageLimitPerUser: parseInt(form.usageLimitPerUser),
            applicableItems: comboItems.map(ci => ({ menuItemId: ci.menuItemId, itemName: ci.itemName, itemPrice: ci.itemPrice, requiredQty: ci.requiredQty })),
            applicableItemIds: comboItems.map(ci => ci.menuItemId),
            canteenId: resolvedCanteenId,
        });
    };

    const categories = Array.from(new Set(menuItems.map(i => i.category))).sort();

    if (loadingCanteen) {
        return (
            <div className="max-w-3xl mx-auto px-6 pb-20 flex items-center justify-center py-20">
                <div className="text-center">
                    <Loader2 size={32} className="animate-spin text-blue-600 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">Loading your restaurant menu...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto px-3 sm:px-6 pb-20">
            <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                <button onClick={onBack} className="p-2 sm:p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-500 flex-shrink-0">
                    <ArrowLeft size={20} className="sm:hidden" />
                    <ArrowLeft size={22} className="hidden sm:block" />
                </button>
                <div className="flex-1 min-w-0">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">Create Combo Offer</h2>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">Bundle items for a special discount{canteenName && <span className="ml-2 text-blue-600 font-medium">· {canteenName}</span>}</p>
                </div>
                <span className="px-2.5 py-1 sm:px-3 sm:py-1.5 bg-blue-50 text-blue-700 text-[10px] sm:text-xs font-bold rounded-md border border-blue-200 uppercase tracking-wide flex-shrink-0">COMBO</span>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                <div className="px-4 sm:px-8 py-4 sm:py-5 border-b border-gray-100"><h3 className="text-sm sm:text-base font-bold text-gray-800">Basic Information</h3></div>
                <div className="px-4 sm:px-8 py-5 sm:py-6 space-y-4 sm:space-y-5 border-b border-gray-100">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                        <div>
                            <label className={labelCls}>Coupon Code <span className="text-red-500">*</span></label>
                            <input value={form.couponCode} onChange={e => update('couponCode', e.target.value.toUpperCase())} placeholder="COMBO20" className={errors.couponCode ? inputErrCls : inputCls} />
                            {errors.couponCode && <p className="text-sm text-red-500 mt-1">{errors.couponCode}</p>}
                        </div>
                        <div>
                            <label className={labelCls}>Offer Title <span className="text-red-500">*</span></label>
                            <input value={form.title} onChange={e => update('title', e.target.value)} placeholder="Burger + Shake Combo" className={errors.title ? inputErrCls : inputCls} />
                            {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
                        </div>
                    </div>
                    <div>
                        <label className={labelCls}>Description</label>
                        <textarea value={form.description} onChange={e => update('description', e.target.value)} rows={2} placeholder="Describe the combo..." className={`${inputCls} resize-none`} />
                    </div>
                </div>

                <div className="px-4 sm:px-8 py-4 sm:py-5 border-b border-gray-100"><h3 className="text-sm sm:text-base font-bold text-gray-800">Discount</h3></div>
                <div className="px-4 sm:px-8 py-5 sm:py-6 space-y-4 sm:space-y-5 border-b border-gray-100">
                    <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                        {(['PERCENTAGE', 'FLAT'] as const).map((t, i) => (
                            <button key={t} onClick={() => update('discountType', t)}
                                className={`flex-1 py-3 text-sm font-bold transition-colors ${i > 0 ? 'border-l border-gray-300' : ''} ${form.discountType === t ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                                {t === 'PERCENTAGE' ? 'Percentage (%)' : 'Flat Amount (₹)'}
                            </button>
                        ))}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                        <div>
                            <label className={labelCls}>Discount Value {form.discountType === 'PERCENTAGE' ? '(%)' : '(₹)'} <span className="text-red-500">*</span></label>
                            <input type="number" value={form.discountValue} onChange={e => update('discountValue', e.target.value)} className={errors.discountValue ? inputErrCls : inputCls} />
                            {errors.discountValue && <p className="text-sm text-red-500 mt-1">{errors.discountValue}</p>}
                        </div>
                        {form.discountType === 'PERCENTAGE' && (
                            <div>
                                <label className={labelCls}>Max Discount Cap (₹)</label>
                                <input type="number" value={form.maxDiscountCap} onChange={e => update('maxDiscountCap', e.target.value)} placeholder="Unlimited" className={inputCls} />
                            </div>
                        )}
                    </div>
                </div>

                <div className="px-4 sm:px-8 py-4 sm:py-5 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm sm:text-base font-bold text-gray-800">Combo Items</h3>
                        {menuItems.length > 0 && <span className="text-xs text-gray-400 flex items-center gap-1"><ShoppingBag size={12} />{menuItems.length} items</span>}
                    </div>
                    {errors.comboItems && <p className="text-sm text-red-500 mt-1">{errors.comboItems}</p>}
                </div>
                <div className="px-4 sm:px-8 py-5 sm:py-6 space-y-4 border-b border-gray-100">
                    {menuLoading ? (
                        <div className="flex items-center gap-2 text-sm text-gray-400 py-2"><Loader2 size={14} className="animate-spin" />Loading menu...</div>
                    ) : (
                        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
                            <div className="flex-1">
                                <label className={labelCls}>Select Item</label>
                                <select value={selectedItemId} onChange={e => setSelectedItemId(e.target.value)} className={selectCls}>
                                    <option value="">Choose an item...</option>
                                    {categories.map(cat => {
                                        const catItems = menuItems.filter(i => i.category === cat && !comboItems.some(ci => ci.menuItemId === i.id));
                                        if (!catItems.length) return null;
                                        return (
                                            <optgroup key={cat} label={cat}>
                                                {catItems.map(item => (
                                                    <option key={item.id} value={item.id}>
                                                        [VEG] {item.name} - Rs.{item.price}
                                                    </option>
                                                ))}
                                            </optgroup>
                                        );
                                    })}
                                </select>
                            </div>
                            <div className="w-full sm:w-24">
                                <label className={labelCls}>Qty</label>
                                <input type="number" min={1} value={selectedQty} onChange={e => setSelectedQty(parseInt(e.target.value) || 1)} className={inputCls} />
                            </div>
                            <button onClick={addComboItem} disabled={!selectedItemId}
                                className="px-4 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5 flex-shrink-0">
                                <Plus size={16} /> Add
                            </button>
                        </div>
                    )}
                    {comboItems.length > 0 ? (
                        <div className="space-y-2">
                            {comboItems.map(ci => (
                                <div key={ci.menuItemId} className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <VegDot isVeg={ci.isVeg} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-900 truncate">{ci.itemName}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            {ci.category && <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-600 font-semibold bg-blue-100 px-1.5 py-0.5 rounded"><Tag size={9} />{ci.category}</span>}
                                            <span className="text-xs text-gray-500">₹{ci.itemPrice}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => updateQty(ci.menuItemId, ci.requiredQty - 1)} className="w-7 h-7 rounded-md border border-blue-300 text-blue-700 hover:bg-blue-100 font-bold flex items-center justify-center transition-colors">−</button>
                                        <span className="w-6 text-center text-sm font-bold">{ci.requiredQty}</span>
                                        <button onClick={() => updateQty(ci.menuItemId, ci.requiredQty + 1)} className="w-7 h-7 rounded-md border border-blue-300 text-blue-700 hover:bg-blue-100 font-bold flex items-center justify-center transition-colors">+</button>
                                    </div>
                                    <p className="text-sm font-bold text-blue-700 w-16 text-right">₹{(ci.itemPrice * ci.requiredQty).toFixed(0)}</p>
                                    <button onClick={() => removeComboItem(ci.menuItemId)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><X size={15} /></button>
                                </div>
                            ))}
                            <div className="flex justify-end pt-1 text-sm text-gray-500">
                                Combo base value: <span className="font-bold text-gray-900 ml-1">₹{comboItems.reduce((s, ci) => s + ci.itemPrice * ci.requiredQty, 0).toFixed(0)}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                            <p className="text-sm text-gray-400">Add at least 2 items to form a combo.</p>
                        </div>
                    )}
                </div>

                <div className="px-4 sm:px-8 py-4 sm:py-5 border-b border-gray-100"><h3 className="text-sm sm:text-base font-bold text-gray-800">Constraints &amp; Duration</h3></div>
                <div className="px-4 sm:px-8 py-5 sm:py-6 space-y-4 sm:space-y-5 border-b border-gray-100">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                        <div><label className={labelCls}>Min Order Value (₹)</label><input type="number" value={form.minOrderValue} onChange={e => update('minOrderValue', e.target.value)} placeholder="0" className={inputCls} /></div>
                        <div><label className={labelCls}>Total Usage Limit</label><input type="number" value={form.usageLimitTotal} onChange={e => update('usageLimitTotal', e.target.value)} placeholder="Unlimited" className={inputCls} /></div>
                        <div><label className={labelCls}>Per User Limit</label><input type="number" value={form.usageLimitPerUser} onChange={e => update('usageLimitPerUser', e.target.value)} placeholder="1" className={inputCls} /></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                        <div>
                            <label className={labelCls}>Start Date &amp; Time <span className="text-red-500">*</span></label>
                            <input type="datetime-local" value={form.startTime} onChange={e => update('startTime', e.target.value)} className={errors.startTime ? inputErrCls : inputCls} />
                            {errors.startTime && <p className="text-sm text-red-500 mt-1">{errors.startTime}</p>}
                        </div>
                        <div>
                            <label className={labelCls}>End Date &amp; Time <span className="text-red-500">*</span></label>
                            <input type="datetime-local" value={form.endTime} onChange={e => update('endTime', e.target.value)} className={errors.endTime ? inputErrCls : inputCls} />
                            {errors.endTime && <p className="text-sm text-red-500 mt-1">{errors.endTime}</p>}
                        </div>
                    </div>
                </div>

                <div className="px-4 sm:px-8 py-4 sm:py-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4">
                    <button onClick={onBack} className="px-6 py-3 text-sm sm:text-base font-bold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-center">Cancel</button>
                    <button onClick={handleSubmit} className="px-8 py-3 text-sm sm:text-base font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-sm">
                        <Save size={20} /> Create Combo
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OfferFormCombo;
