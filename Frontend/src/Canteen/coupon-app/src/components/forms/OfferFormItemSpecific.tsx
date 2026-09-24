/**
 * OfferFormItemSpecific — Account-based, Category-Grouped, Rich Item Details
 * Select specific menu items for a targeted discount.
 * Items fetched from authenticated vendor's own canteen, grouped by category.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Save, Loader2, Search, Tag, ChevronDown, ChevronUp, CheckSquare, Square } from 'lucide-react';
import type { MenuItem } from '../../../../utils/canteenStore';
import { fetchMenu, fetchMyCanteen } from '../../../../utils/canteenStore';

interface OfferFormItemSpecificProps {
    onSubmit: (data: any) => void;
    onBack: () => void;
    initialData?: any;
}

const inputCls = `w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-base text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500`;
const inputErrCls = `w-full px-4 py-3 bg-white border border-red-400 rounded-lg text-base text-gray-900 outline-none transition-colors focus:border-red-500 focus:ring-1 focus:ring-red-500`;
const labelCls = `block text-sm font-semibold text-gray-600 mb-1.5`;

const VegDot = ({ isVeg }: { isVeg?: boolean }) => (
    <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-sm border-2 border-green-600 flex-shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-green-600" />
    </span>
);

export const OfferFormItemSpecific: React.FC<OfferFormItemSpecificProps> = ({ onSubmit, onBack, initialData }) => {
    const [resolvedCanteenId, setResolvedCanteenId] = useState<number>(initialData?.canteenId || 0);
    const [canteenName, setCanteenName] = useState<string>('');
    const [loadingCanteen, setLoadingCanteen] = useState(true);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [menuLoading, setMenuLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set());
    const [selectedIds, setSelectedIds] = useState<Set<number>>(
        new Set(initialData?.applicableItemIds ?? [])
    );

    const [form, setForm] = useState({
        couponCode: initialData?.couponCode || '',
        title: initialData?.title || '',
        description: initialData?.description || '',
        discountType: (initialData?.discountType as 'PERCENTAGE' | 'FLAT') || 'PERCENTAGE',
        discountValue: initialData?.discountValue || '15',
        maxDiscountCap: initialData?.maxDiscountCap || '',
        minOrderValue: initialData?.minOrderValue || '0',
        usageLimitTotal: initialData?.usageLimitTotal || '',
        usageLimitPerUser: initialData?.usageLimitPerUser || '1',
        startTime: initialData?.startTime || '',
        endTime: initialData?.endTime || '',
    });

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

    const toggleItem = (id: number) => {
        setSelectedIds(prev => {
            const n = new Set(prev);
            n.has(id) ? n.delete(id) : n.add(id);
            if (errors.items) setErrors(p => { const e = { ...p }; delete e.items; return e; });
            return n;
        });
    };

    const toggleCategory = (_cat: string, items: MenuItem[]) => {
        const catIds = items.map(i => i.id);
        const allSelected = catIds.every(id => selectedIds.has(id));
        setSelectedIds(prev => {
            const n = new Set(prev);
            if (allSelected) catIds.forEach(id => n.delete(id));
            else catIds.forEach(id => n.add(id));
            return n;
        });
    };

    const toggleCatCollapse = (cat: string) => {
        setCollapsedCats(prev => {
            const n = new Set(prev);
            n.has(cat) ? n.delete(cat) : n.add(cat);
            return n;
        });
    };

    // Group & filter
    const grouped = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        const filtered = q ? menuItems.filter(i => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q)) : menuItems;
        const map = new Map<string, MenuItem[]>();
        filtered.forEach(item => {
            const cat = item.category;
            if (!map.has(cat)) map.set(cat, []);
            map.get(cat)!.push(item);
        });
        return map;
    }, [menuItems, searchQuery]);

    const selectedItems = menuItems.filter(i => selectedIds.has(i.id));
    const estimatedSaving = (item: MenuItem) => {
        if (form.discountType === 'PERCENTAGE') return (item.price * parseFloat(form.discountValue || '0') / 100).toFixed(0);
        return form.discountValue || '0';
    };

    const validate = () => {
        const errs: Record<string, string> = {};
        if (!form.couponCode.trim()) errs.couponCode = 'Coupon code required';
        if (!form.title.trim()) errs.title = 'Title required';
        if (!form.discountValue || parseFloat(form.discountValue) <= 0) errs.discountValue = 'Must be > 0';
        if (form.discountType === 'PERCENTAGE' && parseFloat(form.discountValue) > 100) errs.discountValue = 'Cannot exceed 100%';
        if (selectedIds.size === 0) errs.items = 'Select at least one item';
        if (!form.startTime) errs.startTime = 'Start date required';
        if (!form.endTime) errs.endTime = 'End date required';
        if (form.startTime && form.endTime && new Date(form.endTime) <= new Date(form.startTime)) errs.endTime = 'Must be after start';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;
        onSubmit({
            ...form, couponType: 'ITEM_SPECIFIC',
            discountValue: parseFloat(form.discountValue),
            maxDiscountCap: form.maxDiscountCap ? parseFloat(form.maxDiscountCap) : null,
            minOrderValue: parseFloat(form.minOrderValue),
            usageLimitTotal: form.usageLimitTotal ? parseInt(form.usageLimitTotal) : null,
            usageLimitPerUser: parseInt(form.usageLimitPerUser),
            applicableItemIds: Array.from(selectedIds),
            canteenId: resolvedCanteenId,
        });
    };

    if (loadingCanteen) {
        return (
            <div className="max-w-3xl mx-auto px-6 pb-20 flex items-center justify-center py-20">
                <div className="text-center">
                    <Loader2 size={32} className="animate-spin text-emerald-600 mx-auto mb-3" />
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
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">Item-Specific Offer</h2>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">Discount on selected menu items{canteenName && <span className="ml-2 text-emerald-600 font-medium">· {canteenName}</span>}</p>
                </div>
                <span className="px-2.5 py-1 sm:px-3 sm:py-1.5 bg-emerald-50 text-emerald-700 text-[10px] sm:text-xs font-bold rounded-md border border-emerald-200 uppercase tracking-wide flex-shrink-0">ITEM SPECIFIC</span>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                {/* Basic Info */}
                <div className="px-4 sm:px-8 py-4 sm:py-5 border-b border-gray-100"><h3 className="text-sm sm:text-base font-bold text-gray-800">Basic Information</h3></div>
                <div className="px-4 sm:px-8 py-5 sm:py-6 space-y-4 sm:space-y-5 border-b border-gray-100">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                        <div>
                            <label className={labelCls}>Coupon Code <span className="text-red-500">*</span></label>
                            <input value={form.couponCode} onChange={e => update('couponCode', e.target.value.toUpperCase())} placeholder="ITEM15" className={errors.couponCode ? inputErrCls : inputCls} />
                            {errors.couponCode && <p className="text-sm text-red-500 mt-1">{errors.couponCode}</p>}
                        </div>
                        <div>
                            <label className={labelCls}>Offer Title <span className="text-red-500">*</span></label>
                            <input value={form.title} onChange={e => update('title', e.target.value)} placeholder="15% off on selected items" className={errors.title ? inputErrCls : inputCls} />
                            {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
                        </div>
                    </div>
                    <div>
                        <label className={labelCls}>Description</label>
                        <textarea value={form.description} onChange={e => update('description', e.target.value)} rows={2} placeholder="Describe the offer..." className={`${inputCls} resize-none`} />
                    </div>
                </div>

                {/* Discount */}
                <div className="px-4 sm:px-8 py-4 sm:py-5 border-b border-gray-100"><h3 className="text-sm sm:text-base font-bold text-gray-800">Discount</h3></div>
                <div className="px-4 sm:px-8 py-5 sm:py-6 space-y-4 sm:space-y-5 border-b border-gray-100">
                    <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                        {(['PERCENTAGE', 'FLAT'] as const).map((t, i) => (
                            <button key={t} onClick={() => update('discountType', t)}
                                className={`flex-1 py-3 text-sm font-bold transition-colors ${i > 0 ? 'border-l border-gray-300' : ''} ${form.discountType === t ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
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

                {/* Item Selector */}
                <div className="px-4 sm:px-8 py-4 sm:py-5 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm sm:text-base font-bold text-gray-800">
                            Select Items
                            {selectedIds.size > 0 && (
                                <span className="ml-2 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">{selectedIds.size} selected</span>
                            )}
                        </h3>
                        {selectedIds.size > 0 && (
                            <button onClick={() => setSelectedIds(new Set())} className="text-xs text-red-400 hover:text-red-600 font-semibold transition-colors">Clear all</button>
                        )}
                    </div>
                    {errors.items && <p className="text-sm text-red-500 mt-1">{errors.items}</p>}
                </div>
                <div className="px-4 sm:px-8 py-4 border-b border-gray-100">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search items by name or category..."
                            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-colors" />
                    </div>
                </div>
                <div className="px-4 sm:px-8 py-4 border-b border-gray-100 max-h-[480px] overflow-y-auto">
                    {menuLoading ? (
                        <div className="flex items-center gap-2 text-sm text-gray-400 py-6 justify-center">
                            <Loader2 size={16} className="animate-spin" />Loading menu...
                        </div>
                    ) : grouped.size === 0 ? (
                        <p className="text-sm text-gray-400 py-6 text-center">No items match your search.</p>
                    ) : (
                        <div className="space-y-3">
                            {Array.from(grouped.entries()).map(([cat, items]) => {
                                const isCollapsed = collapsedCats.has(cat);
                                const selectedInCat = items.filter(i => selectedIds.has(i.id)).length;
                                const allInCat = items.every(i => selectedIds.has(i.id));
                                return (
                                    <div key={cat} className="border border-gray-200 rounded-lg overflow-hidden">
                                        {/* Category header */}
                                        <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 cursor-pointer" onClick={() => toggleCatCollapse(cat)}>
                                            <button onClick={e => { e.stopPropagation(); toggleCategory(cat, items); }}
                                                className="text-emerald-600 hover:text-emerald-700 transition-colors flex-shrink-0">
                                                {allInCat ? <CheckSquare size={17} /> : <Square size={17} className="text-gray-400" />}
                                            </button>
                                            <span className="flex items-center gap-1.5 text-sm font-bold text-gray-700 flex-1">
                                                <Tag size={13} className="text-emerald-500" />{cat}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {selectedInCat > 0 && <span className="text-emerald-600 font-bold mr-1">{selectedInCat}/</span>}
                                                {items.length} items
                                            </span>
                                            {isCollapsed ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronUp size={16} className="text-gray-400" />}
                                        </div>
                                        {/* Items */}
                                        {!isCollapsed && (
                                            <div className="divide-y divide-gray-100">
                                                {items.map(item => {
                                                    const isSelected = selectedIds.has(item.id);
                                                    const saving = estimatedSaving(item);
                                                    return (
                                                        <button key={item.id} onClick={() => toggleItem(item.id)}
                                                            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${isSelected ? 'bg-emerald-50' : 'bg-white hover:bg-gray-50'}`}>
                                                            <div className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${isSelected ? 'bg-emerald-600 border-emerald-600' : 'border-gray-300'}`}>
                                                                {isSelected && <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="1,6 4.5,9.5 11,2" /></svg>}
                                                            </div>
                                                            <VegDot isVeg={item.isVegetarian ?? item.dietary?.vegetarian} />
                                                            <div className="flex-1 min-w-0">
                                                                <p className={`text-sm font-semibold truncate ${isSelected ? 'text-emerald-900' : 'text-gray-800'}`}>{item.name}</p>
                                                                {item.subCategory && <p className="text-[11px] text-gray-400 mt-0.5">{item.subCategory}</p>}
                                                            </div>
                                                            <div className="text-right flex-shrink-0">
                                                                <p className="text-sm font-bold text-gray-900">₹{item.price}</p>
                                                                {parseFloat(form.discountValue) > 0 && (
                                                                    <p className="text-[11px] text-emerald-600 font-semibold">Save ₹{saving}</p>
                                                                )}
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Selected summary strip */}
                {selectedItems.length > 0 && (
                    <div className="px-4 sm:px-8 py-4 bg-emerald-50 border-b border-emerald-100">
                        <p className="text-sm font-bold text-emerald-800 mb-2">{selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected:</p>
                        <div className="flex flex-wrap gap-1.5">
                            {selectedItems.slice(0, 10).map(item => (
                                <span key={item.id} className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-emerald-200 rounded-md text-xs font-semibold text-emerald-800">
                                    {item.name} <span className="text-emerald-500">₹{item.price}</span>
                                </span>
                            ))}
                            {selectedItems.length > 10 && (
                                <span className="px-2 py-1 bg-white border border-emerald-200 rounded-md text-xs text-emerald-600 font-semibold">+{selectedItems.length - 10} more</span>
                            )}
                        </div>
                    </div>
                )}

                {/* Constraints & Duration */}
                <div className="px-4 sm:px-8 py-4 sm:py-5 border-b border-gray-100"><h3 className="text-sm sm:text-base font-bold text-gray-800">Constraints &amp; Duration</h3></div>
                <div className="px-4 sm:px-8 py-5 sm:py-6 space-y-4 sm:space-y-5 border-b border-gray-100">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                        <div><label className={labelCls}>Min Order (₹)</label><input type="number" value={form.minOrderValue} onChange={e => update('minOrderValue', e.target.value)} placeholder="0" className={inputCls} /></div>
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

                {/* Actions */}
                <div className="px-4 sm:px-8 py-4 sm:py-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4">
                    <button onClick={onBack} className="px-6 py-3 text-sm sm:text-base font-bold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-center">Cancel</button>
                    <button onClick={handleSubmit} className="px-8 py-3 text-sm sm:text-base font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-sm">
                        <Save size={20} /> Create Offer
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OfferFormItemSpecific;
