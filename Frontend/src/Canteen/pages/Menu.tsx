import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import Sidebar from '@/components/Sidebar';
import ElectroBorder from '@/components/ElectroBorder';
import api from '@/utils/api';
import {
  fetchMenu,
  getCategories,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleItemAvailability,
  saveCategory,
  deleteCategory,
  MenuItem,
  Category,
  DietaryInfo,
  Coupon,
  getActiveCoupons
} from '../utils/canteenStore';

// Icons 
// ... (Icons remain same)
const Icons = {
  Plus: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
  Search: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
  Edit: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>,
  Trash: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>,
  X: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
  Upload: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>,
  Tag: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>,
};

// Dietary tag configs
const DIETARY_TAGS: { key: keyof DietaryInfo; label: string; icon: string; color: string }[] = [
  { key: 'vegetarian', label: 'Vegetarian', icon: 'Veg', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { key: 'vegan', label: 'Vegan', icon: 'Vegan', color: 'bg-green-50 text-green-700 border-green-200' },
  { key: 'glutenFree', label: 'Gluten-Free', icon: 'GF', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { key: 'spicy', label: 'Spicy', icon: 'Hot', color: 'bg-red-50 text-red-700 border-red-200' },
  { key: 'containsNuts', label: 'Contains Nuts', icon: 'Nuts', color: 'bg-orange-50 text-orange-700 border-orange-200' },
];

export default function CanteenMenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'menu' | 'inventory'>('menu');
  /**
   * showHiddenItems controls whether unavailable (hidden) items appear in the
   * vendor menu management grid. Defaults to true so vendors can see and manage
   * all their items. Hidden items are rendered with reduced opacity.
   */
  const [showHiddenItems, setShowHiddenItems] = useState(true);
  const [canteenId, setCanteenId] = useState<number | null>(null);

  // Modal State
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  /**
   * Resolve the authenticated vendor's canteen ID from the backend on mount.
   * Uses /api/canteens/my-canteen which reads the JWT principal and returns
   * the canteen owned by this vendor — avoids hardcoded canteenId = 1.
   */
  useEffect(() => {
    api.get('/canteens/my-canteen')
      .then(res => {
        const id = res.data?.canteen?.id ?? res.data?.id;
        if (id) setCanteenId(id);
        else console.error('my-canteen response has no id:', res.data);
      })
      .catch(err => console.error('Failed to resolve vendor canteen:', err));
  }, []);

  // Load data only after canteenId is resolved
  const loadMenu = async () => {
    if (!canteenId) return;
    setLoading(true);
    const [menuData, couponsData, categoriesData] = await Promise.all([
      fetchMenu(canteenId),
      getActiveCoupons(canteenId),
      getCategories(canteenId)
    ]);
    setItems(menuData);
    setCoupons(couponsData);
    setCategories(categoriesData);
    setLoading(false);
  };

  useEffect(() => {
    if (canteenId) loadMenu();
  }, [canteenId]);

  // Compute discounts map
  const itemDiscounts = useMemo(() => {
    const discounts: Record<number, { value: number; type: string; label: string }> = {};

    coupons.forEach(coupon => {
      // General coupons don't apply to specific items directly for tags usually, 
      // unless we want to show "Site-wide 20% OFF" on everything.
      // For now, let's focus on ITEM_SPECIFIC and COMBO
      if (coupon.couponType === 'ITEM_SPECIFIC' && coupon.applicableItems) {
        coupon.applicableItems.forEach(appItem => {
          // Check if this coupon gives a better discount than existing
          // simple check: just take the first one or max value
          const value = coupon.discountValue;
          const type = coupon.discountType;
          const label = type === 'PERCENTAGE' ? `${value}% OFF` : `₹${value} OFF`;

          if (!discounts[appItem.menuItemId] || value > discounts[appItem.menuItemId].value) {
            discounts[appItem.menuItemId] = { value, type, label };
          }
        });
      }
    });
    return discounts;
  }, [coupons]);

  // Filter logic — vendor sees all items by default; hidden-item toggle controls unavailable visibility
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesVisibility = showHiddenItems ? true : (item.isAvailable !== false);
      return matchesSearch && matchesCategory && matchesVisibility;
    });
  }, [items, searchQuery, selectedCategory, showHiddenItems]);

  // Handlers
  const handleToggleAvailability = async (id: number) => { // Changed id details
    const item = items.find(i => i.id === id);
    if (item) {
      await toggleItemAvailability(id, !item.isAvailable);
      // Refresh locally or reload
      setItems(prev => prev.map(i => i.id === id ? { ...i, isAvailable: !i.isAvailable } : i));
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (confirm('Delete this item permanently?')) {
      await deleteMenuItem(id);
      loadMenu();
    }
  };

  const handleSaveItem = async (item: MenuItem) => {
    if (editingItem) {
      await updateMenuItem(item.id, item);
    } else if (canteenId !== null) {
      await addMenuItem(canteenId, item);
    }
    loadMenu();
    setShowItemModal(false);
    setEditingItem(null);
  };

  const handleAddCategory = async (name: string) => {
    if (!canteenId) return;
    await saveCategory(canteenId, name);
    setCategories(await getCategories(canteenId));
    setShowCategoryModal(false);
  };

  const handleDeleteCategory = async (id: number) => {
    if (!canteenId) return;
    if (confirm('Delete this category?')) {
      await deleteCategory(id);
      setCategories(await getCategories(canteenId));
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setShowItemModal(true);
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setShowItemModal(true);
  };

  return (
    <Sidebar>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="min-h-screen"
      >
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 px-4 sm:px-8 py-5 sticky top-0 z-20 shadow-sm">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                {viewMode === 'inventory' ? 'Stock Management' : 'Menu Management'}
              </h1>
              <p className="text-sm text-gray-500">
                {viewMode === 'inventory'
                  ? `${items.filter(i => i.isAvailable).length} of ${items.length} items available`
                  : `${items.length} items in menu`}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                <button
                  onClick={() => setViewMode('menu')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'menu'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Menu
                </button>
                <button
                  onClick={() => setViewMode('inventory')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'inventory'
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Stock
                </button>
              </div>

              {viewMode === 'menu' && (
                <>
                  {/* Search */}
                  <div className="relative hidden sm:block">
                    <input
                      type="text"
                      placeholder="SEARCH ITEMS..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-64 pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 outline-none transition-all text-sm"
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <Icons.Search />
                    </div>
                  </div>

                  {/* Add Item */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={openAddModal}
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-emerald-200 flex items-center gap-2 hover:from-emerald-600 hover:to-emerald-700 transition-all text-sm"
                  >
                    <Icons.Plus />
                    <span className="hidden sm:inline">Add Item</span>
                  </motion.button>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6">

          {/* ── Inventory / Stock Mode ─────────────────────────────── */}
          <AnimatePresence mode="wait">
            {viewMode === 'inventory' ? (
              <motion.div
                key="inventory"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[
                    { label: 'Total Items', value: items.length, color: 'text-gray-900', bg: 'bg-gray-50' },
                    { label: 'Available', value: items.filter(i => i.isAvailable).length, color: 'text-emerald-700', bg: 'bg-emerald-50' },
                    { label: 'Out of Stock', value: items.filter(i => !i.isAvailable).length, color: 'text-red-600', bg: 'bg-red-50' },
                  ].map(stat => (
                    <div key={stat.label} className={`${stat.bg} rounded-2xl p-4 text-center`}>
                      <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                      <p className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-wide">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Per-Category Sections */}
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
                        <div className="h-6 bg-gray-200 rounded w-1/4 mb-3" />
                        <div className="space-y-2">
                          {[...Array(3)].map((_, j) => <div key={j} className="h-12 bg-gray-100 rounded-xl" />)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {['All', ...categories.map(c => c.name)].map(catName => {
                      const catItems = catName === 'All'
                        ? items
                        : items.filter(i => i.category === catName);
                      if (catName !== 'All' && catItems.length === 0) return null;
                      const allAvailable = catItems.every(i => i.isAvailable);

                      const bulkToggle = async () => {
                        const newState = !allAvailable;
                        await Promise.all(catItems.map(i => toggleItemAvailability(i.id, newState)));
                        setItems(prev => prev.map(i =>
                          catItems.find(ci => ci.id === i.id) ? { ...i, isAvailable: newState } : i
                        ));
                      };

                      return (
                        <div key={catName} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                          {/* Category Header */}
                          <div className="flex items-center justify-between px-5 py-4 bg-gray-50 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-gray-900 uppercase tracking-wider text-sm">{catName}</span>
                              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                                {catItems.filter(i => i.isAvailable).length}/{catItems.length}
                              </span>
                            </div>
                            {/* Bulk Toggle */}
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 font-medium">All {catName === 'All' ? 'Items' : catName}</span>
                              <button
                                onClick={bulkToggle}
                                className={`relative w-11 h-6 rounded-full transition-all duration-200 focus:outline-none ${allAvailable ? 'bg-emerald-500' : 'bg-gray-300'}`}
                              >
                                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${allAvailable ? 'translate-x-5' : 'translate-x-0'}`} />
                              </button>
                            </div>
                          </div>

                          {/* Item Rows */}
                          <div className="divide-y divide-gray-50">
                            {catItems.map(item => (
                              <motion.div
                                key={item.id}
                                layout
                                className="flex items-center justify-between px-5 py-3 hover:bg-gray-50/60 transition-colors"
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  {/* Veg dot */}
                                  <div className="w-3 h-3 rounded-sm border-2 border-emerald-600 flex-shrink-0">
                                    <div className="w-1.5 h-1.5 rounded-full m-0.5 bg-emerald-600" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-semibold text-gray-900 text-sm truncate">{item.name}</p>
                                    <p className="text-xs text-gray-400 truncate">{item.category} · ₹{item.price}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${item.isAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                                    {item.isAvailable ? 'In Stock' : 'Out of Stock'}
                                  </span>
                                  {/* Individual Toggle */}
                                  <button
                                    onClick={() => handleToggleAvailability(item.id)}
                                    className={`relative w-11 h-6 rounded-full transition-all duration-200 focus:outline-none ${item.isAvailable ? 'bg-emerald-500' : 'bg-gray-300'}`}
                                  >
                                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${item.isAvailable ? 'translate-x-5' : 'translate-x-0'}`} />
                                  </button>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            ) : (

              /* ── Menu Management Mode ─────────────────────────────── */
              <motion.div
                key="menu"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Categories Bar */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex gap-2 overflow-x-auto pb-2 flex-1 scrollbar-hide">
                    <button
                      onClick={() => setSelectedCategory('All')}
                      className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap flex-shrink-0 ${selectedCategory === 'All'
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-200'
                        : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-200 hover:bg-emerald-50'
                        }`}
                    >
                      All Items
                    </button>
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.name)}
                        className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap flex-shrink-0 ${selectedCategory === cat.name
                          ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-200'
                          : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-200 hover:bg-emerald-50'
                          }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowCategoryModal(true)}
                    className="p-2.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl border border-gray-200 hover:border-emerald-200 transition-all"
                  >
                    <Icons.Tag />
                  </button>
                </div>

                {/* Menu Items Grid with ElectroBorder */}
                <ElectroBorder color="emerald" intensity="medium" radius="1.5rem">
                  <div className="bg-white rounded-3xl p-6 min-h-[400px]">
                    {loading ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => (
                          <div key={i} className="bg-gray-50 rounded-2xl p-4">
                            <Skeleton height={120} className="rounded-xl" />
                            <Skeleton height={20} className="mt-3" />
                            <Skeleton height={16} width="60%" className="mt-2" />
                          </div>
                        ))}
                      </div>
                    ) : filteredItems.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5 text-gray-400">
                          <Icons.Search />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 uppercase tracking-widest">No Items Found</h3>
                        <p className="text-gray-500 mt-2 uppercase tracking-widest text-sm">Try a different search or category</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredItems.map(item => (
                          <MenuItemCard
                            key={item.id}
                            item={item}
                            discountTag={itemDiscounts[item.id]}
                            onEdit={() => openEditModal(item)}
                            onDelete={() => handleDeleteItem(item.id)}
                            onToggle={() => handleToggleAvailability(item.id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </ElectroBorder>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Modals */}
        <AnimatePresence>
          {showItemModal && (
            <ItemModal
              item={editingItem}
              categories={categories}
              onSave={handleSaveItem}
              onClose={() => { setShowItemModal(false); setEditingItem(null); }}
            />
          )}
          {showCategoryModal && (
            <CategoryModal
              categories={categories}
              onAdd={handleAddCategory}
              onDelete={handleDeleteCategory}
              onClose={() => setShowCategoryModal(false)}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </Sidebar>
  );
}

// Menu Item Card Component
function MenuItemCard({ item, discountTag, onEdit, onDelete, onToggle }: {
  item: MenuItem;
  discountTag?: { label: string; value: number; type: string };
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  return (
    <div className={`bg-white rounded-2xl border-2 p-4 transition-all hover:shadow-lg ${item.isAvailable ? 'border-gray-100 hover:border-emerald-200' : 'border-gray-200 opacity-60'
      }`}>
      {/* Image */}
      <div className="aspect-video bg-gray-100 rounded-xl mb-3 overflow-hidden relative">
        {item.image ? (
          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <Icons.Search />
          </div>
        )}

        {/* Discount Badge */}
        {discountTag && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg shadow-sm animate-pulse z-10">
            {discountTag.label}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 truncate uppercase tracking-wider text-sm">{item.name}</h3>
          <p className="text-xs text-gray-500 truncate uppercase tracking-wider">{item.category}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-emerald-600">
            {discountTag && discountTag.type === 'PERCENTAGE'
              ? <>
                <span className="text-xs text-gray-400 line-through mr-1">₹{item.price}</span>
                ₹{Math.round(item.price * (1 - discountTag.value / 100))}
              </>
              : `₹${item.price}`
            }
          </p>
        </div>
      </div>

      {/* Dietary Tags */}
      {item.dietary && (
        <div className="flex flex-wrap gap-1 mt-2">
          {DIETARY_TAGS.filter(tag => item.dietary && item.dietary[tag.key]).slice(0, 3).map(tag => (
            <span key={tag.key} className={`text-[10px] px-2 py-0.5 rounded-full border ${tag.color} uppercase tracking-wider font-bold`}>
              {tag.icon}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <button
          onClick={onToggle}
          className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all uppercase tracking-wider ${item.isAvailable
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-gray-100 text-gray-500'
            }`}
        >
          {item.isAvailable ? 'Available' : 'Unavailable'}
        </button>
        <div className="flex gap-2">
          <button onClick={onEdit} className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
            <Icons.Edit />
          </button>
          <button onClick={onDelete} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <Icons.Trash />
          </button>
        </div>
      </div>
    </div>
  );
}

// Simple Item Modal
function ItemModal({ item, categories, onSave, onClose }: {
  item: MenuItem | null;
  categories: Category[];
  onSave: (item: MenuItem) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState<Partial<MenuItem>>(item || {
    name: '',
    description: '',
    price: 0,
    category: categories[0]?.name || '',
    isAvailable: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: item?.id || Date.now().toString(),
      name: formData.name || '',
      description: formData.description || '',
      price: formData.price || 0,
      category: formData.category || '',
      isAvailable: formData.isAvailable ?? true,
      image: formData.image || '',
      visibleInMenu: item?.visibleInMenu ?? true,
      dietary: item?.dietary || { vegetarian: true, vegan: false, glutenFree: false, spicy: false, containsNuts: false },
      rating: item?.rating || 4.5,
      salesCount: item?.salesCount || 0,
      createdAt: item?.createdAt || new Date().toISOString()
    } as MenuItem);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold uppercase tracking-widest">{item ? 'Edit Item' : 'Add Item'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <Icons.X />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="ITEM NAME"
            value={formData.name}
            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-4 py-3 border-2 rounded-xl uppercase tracking-widest text-sm"
            required
          />
          <textarea
            placeholder="DESCRIPTION"
            value={formData.description}
            onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-4 py-3 border-2 rounded-xl resize-none uppercase tracking-widest text-sm"
            rows={3}
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              type="number"
              placeholder="PRICE"
              value={formData.price || ''}
              onChange={e => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
              className="px-4 py-3 border-2 rounded-xl uppercase tracking-widest text-sm"
              required
            />
            <select
              value={formData.category}
              onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="px-4 py-3 border-2 rounded-xl uppercase tracking-widest text-sm"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold rounded-xl uppercase tracking-widest"
          >
            {item ? 'Save Changes' : 'Add Item'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}

// Simple Category Modal
function CategoryModal({ categories, onAdd, onDelete, onClose }: {
  categories: Category[];
  onAdd: (name: string) => void;
  onDelete: (id: number) => void;
  onClose: () => void;
}) {
  const [newCategory, setNewCategory] = useState('');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold uppercase tracking-widest">Categories</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <Icons.X />
          </button>
        </div>

        {/* Add new */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="NEW CATEGORY"
            value={newCategory}
            onChange={e => setNewCategory(e.target.value)}
            className="flex-1 px-4 py-2 border-2 rounded-xl text-sm uppercase tracking-widest"
          />
          <button
            onClick={() => { if (newCategory) { onAdd(newCategory); setNewCategory(''); } }}
            className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-bold"
          >
            Add
          </button>
        </div>

        {/* List */}
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {categories.map(cat => (
            <div key={cat.id} className="flex items-center justify-between px-4 py-2 bg-gray-50 rounded-xl">
              <span className="font-medium uppercase tracking-wider text-sm">{cat.name}</span>
              <button onClick={() => onDelete(cat.id)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                <Icons.Trash />
              </button>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}