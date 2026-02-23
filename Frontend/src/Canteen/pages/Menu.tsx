import { useState, useEffect, useMemo } from 'react';
import { toast } from '@/utils/toast';
import { motion } from 'framer-motion';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import Sidebar from '@/components/Sidebar';
import ElectroBorder from '@/components/ElectroBorder';
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
  Variant,
  AddOn
} from '../utils/canteenStore';

// Icons - Enhanced with beautiful, recognizable icons
const Icons = {
  Plus: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
  Search: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
  // Pencil icon - Clear edit indication with pencil design
  Pencil: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>,
  // Trash bin with lid - More stylish delete icon
  TrashBin: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>,
  // Ticket/Coupon icon - For add coupon functionality  
  Ticket: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" /><path d="M13 5v2" /><path d="M13 17v2" /><path d="M13 11v2" /></svg>,
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [canteenId] = useState<number>(1); // Hardcoded for now until user context provides it

  // Modal State
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [showCategoryDeleteAlert, setShowCategoryDeleteAlert] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  // Load data
  const loadMenu = async () => {
    setLoading(true);
    const menuData = await fetchMenu(canteenId);
    setItems(menuData);
    setCategories(await getCategories(canteenId));
    setLoading(false);
  };

  useEffect(() => {
    loadMenu();
  }, [canteenId]);

  // Filter logic
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [items, searchQuery, selectedCategory]);

  // Handlers
  const handleToggleAvailability = async (id: number) => {
    const item = items.find(i => i.id === id);
    if (item) {
      await toggleItemAvailability(id, !item.isAvailable);
      setItems(prev => prev.map(i => i.id === id ? { ...i, isAvailable: !i.isAvailable } : i));
      toast.success(`${item.name} ${!item.isAvailable ? 'marked available' : 'marked unavailable'}`);
    }
  };

  const confirmDelete = (id: number) => {
    setItemToDelete(id);
    setShowDeleteAlert(true);
  };

  const executeDelete = async () => {
    if (itemToDelete) {
      await deleteMenuItem(itemToDelete);
      toast.success('Item deleted successfully');
      loadMenu();
      setShowDeleteAlert(false);
      setItemToDelete(null);
    }
  };

  const confirmDeleteCategory = (id: string) => {
    setCategoryToDelete(id);
    setShowCategoryDeleteAlert(true);
  };

  const executeDeleteCategory = async () => {
    if (categoryToDelete) {
      await deleteCategory(categoryToDelete);
      toast.success('Category deleted');
      loadMenu();
      setShowCategoryDeleteAlert(false);
      setCategoryToDelete(null);
    }
  };

  const handleSaveItem = async (item: MenuItem) => {
    if (editingItem) {
      await updateMenuItem(item.id, item);
      toast.success('Item updated successfully');
    } else {
      await addMenuItem(canteenId, item);
      toast.success('New item added');
    }
    loadMenu();
    setShowItemModal(false);
    setEditingItem(null);
  };

  const handleAddCategory = async (name: string) => {
    // legacy saveCategory usage fixed to createCategory signature
    await saveCategory(canteenId, name);
    setCategories(await getCategories(canteenId));
    setShowCategoryModal(false);
  };

  const handleDeleteCategory = async (id: string) => {
    confirmDeleteCategory(id);
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
        <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 px-4 sm:px-8 py-5 sticky top-0 z-[100] shadow-sm">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Menu Management
              </h1>
              <p className="text-sm text-gray-500">{items.length} items in menu</p>
            </div>

            <div className="flex items-center gap-4">
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
              <button
                type="button"
                onClick={openAddModal}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-emerald-200 flex items-center gap-2 hover:from-emerald-600 hover:to-emerald-700 hover:scale-105 active:scale-95 transition-all text-sm z-[101] relative"
              >
                <Icons.Plus />
                <span className="hidden sm:inline">Add Item</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content with ElectroBorder */}
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6 relative z-10">
          {/* Categories Bar - Responsive SVG Icons */}
          <div className="flex items-center gap-2 sm:gap-4 mb-8">
            <div className="flex gap-2 sm:gap-3 md:gap-4 overflow-x-auto pb-4 sm:pb-6 pt-2 sm:pt-4 px-1 sm:px-2 flex-1 scrollbar-hide snap-x">
              {/* All Items Card - Universal Emerald Design */}
              <button
                onClick={() => setSelectedCategory('All')}
                className={`group min-w-[120px] h-[100px] sm:h-[110px] rounded-2xl flex flex-col items-center justify-center gap-2 transition-all duration-300 relative overflow-hidden snap-start flex-shrink-0 ${selectedCategory === 'All'
                  ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-xl scale-105 ring-2 sm:ring-4 ring-emerald-100'
                  : 'bg-white text-gray-600 shadow-md hover:shadow-xl hover:-translate-y-1 hover:bg-gradient-to-br hover:from-emerald-400 hover:to-emerald-600 hover:text-white'
                  }`}
              >
                {/* Active Indicator Circle */}
                <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${selectedCategory === 'All' ? 'bg-white' : 'bg-gray-200 group-hover:bg-white/50'}`} />

                <div className="relative z-10 flex flex-col items-center px-2">
                  <span className="text-sm sm:text-base font-black uppercase tracking-tight text-center leading-tight drop-shadow-sm">
                    ALL ITEMS
                  </span>
                  <div className={`w-8 h-0.5 rounded-full mt-2 transition-colors ${selectedCategory === 'All' ? 'bg-white' : 'bg-gray-200 group-hover:bg-white'}`} />
                </div>
              </button>

              {/* Dynamic Categories - Clean White Design */}
              {categories.map(cat => {
                const isSelected = selectedCategory === cat.name;

                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`group min-w-[120px] h-[100px] sm:h-[110px] rounded-2xl flex flex-col items-center justify-center gap-2 transition-all duration-300 relative overflow-hidden snap-start flex-shrink-0 ${isSelected
                      ? 'bg-white text-emerald-600 shadow-xl scale-105 ring-2 sm:ring-4 ring-emerald-100 border-2 border-emerald-500'
                      : 'bg-white text-gray-700 shadow-md hover:shadow-xl hover:-translate-y-1 hover:text-emerald-600 hover:border-emerald-200 border border-transparent'
                      }`}
                  >
                    <span className="text-sm sm:text-base font-black uppercase tracking-tight text-center leading-tight px-2">
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Add Category Button - Restored Original Design */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCategoryModal(true)}
              className="px-5 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 flex items-center gap-2 hover:from-emerald-600 hover:to-emerald-700 transition-all text-sm whitespace-nowrap flex-shrink-0"
            >
              <Icons.Plus />
              <span>Add Category</span>
            </motion.button>
          </div>

          {/* Menu Items Grid with ElectroBorder */}
          <ElectroBorder color="emerald" intensity="medium" radius="1.5rem">
            <div className="bg-white rounded-3xl p-6 min-h-[400px]">
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="bg-gradient-to-br from-gray-50 to-emerald-50/20 rounded-2xl p-4 border border-gray-100">
                      <Skeleton height={60} className="rounded-xl" />
                      <div className="flex justify-between mt-3">
                        <Skeleton height={20} width="40%" />
                        <Skeleton height={16} width="20%" />
                      </div>
                      <Skeleton height={32} className="mt-3 rounded-lg" />
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredItems.map(item => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      onEdit={() => openEditModal(item)}
                      onDelete={() => confirmDelete(item.id)}
                      onToggle={() => handleToggleAvailability(item.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </ElectroBorder>
        </div>

        {/* Modals - Direct Rendering (No Animation Wrapper) for Reliability */}
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
        {showDeleteAlert && (
          <DeleteConfirmationModal
            onConfirm={executeDelete}
            onCancel={() => { setShowDeleteAlert(false); setItemToDelete(null); }}
          />
        )}
        {showCategoryDeleteAlert && (
          <DeleteConfirmationModal
            onConfirm={executeDeleteCategory}
            onCancel={() => { setShowCategoryDeleteAlert(false); setCategoryToDelete(null); }}
          />
        )}
      </motion.div>
    </Sidebar >
  );
}

// Menu Item Card Component - Restored Original Design
function MenuItemCard({ item, onEdit, onDelete, onToggle }: {
  item: MenuItem;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      className="group bg-white rounded-2xl p-4 border border-gray-100 shadow-md hover:shadow-xl transition-all relative overflow-hidden"
    >
      {/* Top colored bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${item.isAvailable ? 'bg-emerald-500' : 'bg-gray-400'}`} />

      {/* Content */}
      <div className="pt-3">
        <h3 className="text-lg font-bold text-gray-900 mb-0.5 leading-tight">{item.name}</h3>
        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-3">{item.category}</p>

        {/* Price */}
        <div className="mb-4">
          <span className="text-2xl font-black text-gray-900">₹{item.price}</span>
        </div>

        {/* Toggle Switch + Coupon Button */}
        <div className="flex items-center justify-between gap-2 mb-3">
          {/* Availability Toggle Switch */}
          <button
            onClick={onToggle}
            className="flex items-center gap-2"
          >
            <div className={`relative w-12 h-6 rounded-full transition-colors ${item.isAvailable ? 'bg-emerald-500' : 'bg-gray-300'
              }`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${item.isAvailable ? 'left-7' : 'left-1'
                }`} />
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${item.isAvailable ? 'text-emerald-600' : 'text-gray-500'
              }`}>
              {item.isAvailable ? 'AVAILABLE' : 'UNAVAILABLE'}
            </span>
          </button>

          {/* Coupon Button */}
          <button className="flex items-center gap-1 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors">
            <Icons.Ticket />
            <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">COUPON</span>
          </button>
        </div>

        {/* Edit & Delete Icon Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all"
            title="Edit"
          >
            <Icons.Pencil />
          </button>
          <button
            onClick={onDelete}
            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all"
            title="Delete"
          >
            <Icons.TrashBin />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// COMPLETE 3-TAB ITEM MODAL
function ItemModal({ item, categories, onSave, onClose }: {
  item: MenuItem | null;
  categories: Category[];
  onSave: (item: MenuItem) => void;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'basic' | 'customization' | 'settings'>('basic');
  const [formData, setFormData] = useState<MenuItem>(() => ({
    id: item?.id || Math.floor(Math.random() * 10000),
    canteenId: item?.canteenId || 1,
    name: item?.name || '',
    description: item?.description || '',
    category: item?.category || categories[0]?.name || '',
    price: item?.price || 0,
    isAvailable: item?.isAvailable ?? true,
    imageUrl: item?.imageUrl || '',
    dietaryInfo: item?.dietaryInfo || {},
    preparationTime: item?.preparationTime || 15,
    discount: item?.discount || 0,
    spiceLevel: item?.spiceLevel || '',
    sugarLevel: item?.sugarLevel || '',
    isPopular: item?.isPopular || false,
    isRecommended: item?.isRecommended || false,
    isLimitedTime: item?.isLimitedTime || false,
    isCouponApplicable: item?.isCouponApplicable || false,
    availabilityTime: item?.availabilityTime || 'All Day',
    variantType: item?.variantType || 'None',
    variants: item?.variants || [],
    addOns: item?.addOns || [],
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  // Variant handlers
  const addVariant = () => {
    setFormData({
      ...formData,
      variants: [...(formData.variants || []), { name: '', price: 0 }]
    });
  };

  const updateVariant = (index: number, field: keyof Variant, value: any) => {
    const newVariants = [...(formData.variants || [])];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setFormData({ ...formData, variants: newVariants });
  };

  const removeVariant = (index: number) => {
    setFormData({
      ...formData,
      variants: formData.variants?.filter((_, i) => i !== index)
    });
  };

  // AddOn handlers
  const addAddOn = () => {
    setFormData({
      ...formData,
      addOns: [...(formData.addOns || []), { name: '', price: 0 }]
    });
  };

  const updateAddOn = (index: number, field: keyof AddOn, value: any) => {
    const newAddOns = [...(formData.addOns || [])];
    newAddOns[index] = { ...newAddOns[index], [field]: value };
    setFormData({ ...formData, addOns: newAddOns });
  };

  const removeAddOn = (index: number) => {
    setFormData({
      ...formData,
      addOns: formData.addOns?.filter((_, i) => i !== index)
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transitionEnd: { display: "none" } }} // Prevent ghost clicks / overlap
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 20, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-white rounded-[2rem] w-full max-w-2xl h-[90vh] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-white/20 relative overflow-hidden flex flex-col pointer-events-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight leading-none">
              {item ? 'Edit Item' : 'Add New Item'}
            </h3>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
              Customize your menu item
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-full transition-all">
            <Icons.X />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-6 border-b border-gray-100 shrink-0 gap-6">
          {['basic', 'customization', 'settings'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`pb-3 text-sm font-bold uppercase tracking-wider relative transition-colors ${activeTab === tab ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'
                }`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">

            {activeTab === 'basic' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                {/* Basic Details Inputs */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Item Name</label>
                  <input type="text" placeholder="Item Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-4 bg-gray-50 rounded-xl font-bold border-2 border-transparent focus:border-emerald-500 focus:bg-white transition-all outline-none" required />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Category</label>
                  <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-4 bg-gray-50 rounded-xl font-bold border-2 border-transparent focus:border-emerald-500 focus:bg-white transition-all outline-none cursor-pointer">
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Description</label>
                  <textarea placeholder="Tasty description..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                    rows={3} className="w-full p-4 bg-gray-50 rounded-xl font-medium border-2 border-transparent focus:border-emerald-500 focus:bg-white transition-all outline-none resize-none" />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Base Price (₹)</label>
                  <input type="number" placeholder="0" value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full p-4 bg-gray-50 rounded-xl font-bold border-2 border-transparent focus:border-emerald-500 focus:bg-white transition-all outline-none" required />
                </div>
              </motion.div>
            )}

            {activeTab === 'customization' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                {/* Variants */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-black text-gray-800 uppercase">📦 Variants</label>
                    <select
                      value={formData.variantType || 'None'}
                      onChange={e => setFormData({ ...formData, variantType: e.target.value as any })}
                      className="text-xs font-bold bg-gray-100 rounded-lg px-2 py-1 outline-none"
                    >
                      <option value="None">No Variants</option>
                      <option value="Size">Size (Small/Med/Large)</option>
                      <option value="Quantity">Quantity (Half/Full)</option>
                      <option value="Type">Type</option>
                      <option value="Crust">Crust</option>
                    </select>
                  </div>

                  {formData.variantType !== 'None' && (
                    <div className="space-y-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
                      {formData.variants?.map((v, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input type="text" placeholder="Variant Name" value={v.name} onChange={e => updateVariant(idx, 'name', e.target.value)}
                            className="flex-1 p-2 rounded-lg border border-gray-200 text-sm font-medium" />
                          <input type="number" placeholder="Price" value={v.price} onChange={e => updateVariant(idx, 'price', Number(e.target.value))}
                            className="w-24 p-2 rounded-lg border border-gray-200 text-sm font-bold" />
                          <button type="button" onClick={() => removeVariant(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Icons.X /></button>
                        </div>
                      ))}
                      <button type="button" onClick={addVariant} className="text-xs font-bold text-emerald-600 hover:underline">+ Add Variant Option</button>
                    </div>
                  )}
                </div>

                {/* Add-ons */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-black text-gray-800 uppercase">➕ Add-Ons</label>
                  </div>
                  <div className="space-y-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    {formData.addOns?.map((a, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input type="text" placeholder="Add-on Name (e.g. Extra Cheese)" value={a.name} onChange={e => updateAddOn(idx, 'name', e.target.value)}
                          className="flex-1 p-2 rounded-lg border border-gray-200 text-sm font-medium" />
                        <input type="number" placeholder="Price" value={a.price} onChange={e => updateAddOn(idx, 'price', Number(e.target.value))}
                          className="w-24 p-2 rounded-lg border border-gray-200 text-sm font-bold" />
                        <button type="button" onClick={() => removeAddOn(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Icons.X /></button>
                      </div>
                    ))}
                    <button type="button" onClick={addAddOn} className="text-xs font-bold text-emerald-600 hover:underline">+ Add Add-on</button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">

                {/* 1. Availability */}
                <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="font-bold text-emerald-800 uppercase text-sm">Item Availability</span>
                    <div className={`w-12 h-6 rounded-full transition-colors relative ${formData.isAvailable ? 'bg-emerald-500' : 'bg-gray-300'}`}
                      onClick={() => setFormData({ ...formData, isAvailable: !formData.isAvailable })}>
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${formData.isAvailable ? 'left-7' : 'left-1'}`} />
                    </div>
                  </label>
                </div>

                {/* 2. Preferences */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase">Spice Level</label>
                    <select value={formData.spiceLevel || ''} onChange={e => setFormData({ ...formData, spiceLevel: e.target.value as any })}
                      className="w-full p-3 bg-gray-50 rounded-lg text-sm font-bold outline-none border border-transparent focus:border-emerald-400">
                      <option value="">Default</option>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase">Sugar Level</label>
                    <select value={formData.sugarLevel || ''} onChange={e => setFormData({ ...formData, sugarLevel: e.target.value as any })}
                      className="w-full p-3 bg-gray-50 rounded-lg text-sm font-bold outline-none border border-transparent focus:border-emerald-400">
                      <option value="">Default</option>
                      <option value="No Sugar">No Sugar</option>
                      <option value="Less Sugar">Less Sugar</option>
                      <option value="Normal Sugar">Normal Sugar</option>
                    </select>
                  </div>
                </div>

                {/* 3. Pricing & Control */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase">Discount (%)</label>
                    <input type="number" value={formData.discount} onChange={e => setFormData({ ...formData, discount: Number(e.target.value) })}
                      className="w-full p-3 bg-gray-50 rounded-lg text-sm font-bold outline-none" placeholder="0" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase">Prep Time (mins)</label>
                    <input type="number" value={formData.preparationTime} onChange={e => setFormData({ ...formData, preparationTime: Number(e.target.value) })}
                      className="w-full p-3 bg-gray-50 rounded-lg text-sm font-bold outline-none" placeholder="15" />
                  </div>
                </div>

                {/* 4. Tags */}
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Tags</label>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { key: 'isPopular', label: '🔥 Popular' },
                      { key: 'isRecommended', label: '⭐ Recommended' },
                      { key: 'isLimitedTime', label: '⏳ Limited' },
                      { key: 'isCouponApplicable', label: '🎟️ Coupon' }
                    ].map((tag) => (
                      <button
                        key={tag.key}
                        type="button"
                        onClick={() => setFormData({ ...formData, [tag.key]: !formData[tag.key as keyof MenuItem] })}
                        className={`px-3 py-2 rounded-lg text-xs font-bold uppercase border transition-all ${formData[tag.key as keyof MenuItem]
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-600'
                          : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                          }`}
                      >
                        {tag.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. Availability Time */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase">Time Availability</label>
                  <select value={formData.availabilityTime || 'All Day'} onChange={e => setFormData({ ...formData, availabilityTime: e.target.value as any })}
                    className="w-full p-3 bg-gray-50 rounded-lg text-sm font-bold outline-none border border-transparent focus:border-emerald-400">
                    <option value="All Day">All Day</option>
                    <option value="Breakfast">Breakfast Only</option>
                    <option value="Lunch">Lunch Only</option>
                    <option value="Evening">Evening Only</option>
                  </select>
                </div>

              </motion.div>
            )}

            <div className="pt-4 border-t border-gray-100 flex gap-4 shrink-0 mt-auto">
              <button type="submit" className="flex-1 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-black rounded-xl shadow-lg shadow-emerald-200 hover:shadow-xl hover:from-emerald-600 hover:to-emerald-700 transition-all uppercase tracking-widest text-sm">
                {item ? 'Save Item' : 'Create Item'}
              </button>
            </div>

          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Custom Sweet Alert for Deletion
function DeleteConfirmationModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void; }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transitionEnd: { display: "none" } }} // Prevent ghost clicks / overlap
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl text-center relative overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-400 to-rose-500" />

        {/* Icon */}
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-red-100">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse">
            <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
          </svg>
        </div>

        <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">Are you sure?</h3>
        <p className="text-gray-500 mb-8 font-medium">
          Do you really want to delete this item? This process cannot be undone.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onCancel}
            className="py-3 px-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all uppercase tracking-wider text-xs"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="py-3 px-4 bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold rounded-xl shadow-lg shadow-red-200 hover:shadow-xl hover:from-red-600 hover:to-rose-700 transform hover:-translate-y-0.5 transition-all uppercase tracking-wider text-xs"
          >
            Yes, Delete
          </button>
        </div>
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
      exit={{ opacity: 0, transitionEnd: { display: "none" } }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
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
                <Icons.TrashBin />
              </button>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}