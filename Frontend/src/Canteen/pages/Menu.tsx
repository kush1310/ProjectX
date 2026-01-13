/**
 * Canteen Menu Management - Premium Green Theme
 * 
 * Features:
 * - NO sidebar, only back button
 * - GREEN theme throughout
 * - Premium centered modals with scroll lock
 * - Dynamic categories (localStorage)
 * - Dietary tags with Read More
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { 
  getMenuItems, 
  getCategories, 
  saveMenuItem, 
  deleteMenuItem, 
  toggleItemAvailability,
  saveCategory,
  deleteCategory,
  MenuItem, 
  Category,
  DietaryInfo 
} from '../utils/canteenStore';

// Icons
const Icons = {
  Back: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>,
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Modal State
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);



  // Load data
  useEffect(() => {
    const timer = setTimeout(() => {
      setItems(getMenuItems());
      setCategories(getCategories());
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

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
  const handleToggleAvailability = (id: string) => {
    toggleItemAvailability(id);
    setItems(getMenuItems());
  };

  const handleDeleteItem = (id: string) => {
    if (confirm('Delete this item permanently?')) {
      deleteMenuItem(id);
      setItems(getMenuItems());
    }
  };

  const handleSaveItem = (item: MenuItem) => {
    saveMenuItem(item);
    setItems(getMenuItems());
    setShowItemModal(false);
    setEditingItem(null);
  };

  const handleAddCategory = (name: string) => {
    const newCategory: Category = {
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      color: '#10b981'
    };
    saveCategory(newCategory);
    setCategories(getCategories());
    setShowCategoryModal(false);
  };

  const handleDeleteCategory = (id: string) => {
    if (confirm('Delete this category?')) {
      deleteCategory(id);
      setCategories(getCategories());
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 font-sans">
      {/* Header - Back Button Only */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 px-4 sm:px-8 py-5 sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="p-2.5 -ml-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
            >
              <Icons.Back />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Menu Management</h1>
              <p className="text-sm text-gray-500">{items.length} items in menu</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative hidden sm:block">
              <input
                type="text"
                placeholder="Search items..."
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
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-emerald-200 flex items-center gap-2 hover:from-emerald-600 hover:to-emerald-700 transition-all"
            >
              <Icons.Plus />
              <span className="hidden sm:inline">Add Item</span>
            </motion.button>
          </div>
        </div>
      </header>

      {/* Categories Bar */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-5">
        <div className="flex items-center gap-4">
          <div className="flex gap-2 overflow-x-auto pb-2 flex-1 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap flex-shrink-0 ${
                selectedCategory === 'All'
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
                className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap flex-shrink-0 ${
                  selectedCategory === cat.name
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-200'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-200 hover:bg-emerald-50'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Manage Categories */}
          <button
            onClick={() => setShowCategoryModal(true)}
            className="p-3 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all border border-gray-200 hover:border-emerald-200"
            title="Manage Categories"
          >
            <Icons.Tag />
          </button>
        </div>
      </div>

      {/* Menu Items Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 pb-10">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <Skeleton height={160} borderRadius={16} className="mb-4" />
                <Skeleton width="70%" height={24} className="mb-2" />
                <Skeleton width="100%" height={16} className="mb-4" />
                <Skeleton width={80} height={28} />
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-5">
              <Icons.Search />
            </div>
            <h3 className="text-xl font-bold text-gray-900">No items found</h3>
            <p className="text-gray-500 mt-2">Try adjusting your search or add new items</p>
            <button
              onClick={openAddModal}
              className="mt-5 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 hover:from-emerald-600 hover:to-emerald-700 transition-all"
            >
              Add First Item
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredItems.map(item => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  onEdit={() => openEditModal(item)}
                  onDelete={() => handleDeleteItem(item.id)}
                  onToggle={() => handleToggleAvailability(item.id)}
                />
              ))}
          </div>
        )}
      </div>

      {/* Add/Edit Item Modal */}
      <AnimatePresence>
        {showItemModal && (
          <ItemFormModal
            item={editingItem}
            categories={categories}
            onClose={() => { setShowItemModal(false); setEditingItem(null); }}
            onSave={handleSaveItem}
          />
        )}
      </AnimatePresence>

      {/* Category Management Modal */}
      <AnimatePresence>
        {showCategoryModal && (
          <CategoryModal
            categories={categories}
            onClose={() => setShowCategoryModal(false)}
            onAdd={handleAddCategory}
            onDelete={handleDeleteCategory}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ==================== MENU ITEM CARD ====================
interface MenuItemCardProps {
  item: MenuItem;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}

function MenuItemCard({ item, onEdit, onDelete, onToggle }: MenuItemCardProps) {
  const [showFullDesc, setShowFullDesc] = useState(false);
  const activeTags = DIETARY_TAGS.filter(tag => item.dietary[tag.key]);
  const isLongDesc = item.description.length > 60;

  return (
    <div
      className={`bg-white rounded-2xl border overflow-hidden hover:shadow-lg transition-shadow duration-200 group ${
        item.isAvailable ? 'border-gray-100 hover:border-emerald-200' : 'border-gray-100 opacity-75'
      }`}
    >
      {/* Image */}
      <div className="relative h-44 bg-gray-100 overflow-hidden">
        <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        {!item.isAvailable && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
            <span className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg transform -rotate-2">
              SOLD OUT
            </span>
          </div>
        )}

        {/* Actions overlay */}
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
          <button onClick={onEdit} className="p-2.5 bg-white/95 backdrop-blur-sm rounded-xl text-emerald-600 hover:bg-emerald-50 shadow-md border border-gray-100 transition-colors">
            <Icons.Edit />
          </button>
          <button onClick={onDelete} className="p-2.5 bg-white/95 backdrop-blur-sm rounded-xl text-red-500 hover:bg-red-50 shadow-md border border-gray-100 transition-colors">
            <Icons.Trash />
          </button>
        </div>

        {/* Category badge */}
        <div className="absolute bottom-3 left-3">
          <span className="bg-white/95 backdrop-blur-sm text-xs font-bold text-emerald-700 px-3 py-1 rounded-full shadow-sm border border-emerald-100">
            {item.category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="font-bold text-gray-900 text-lg line-clamp-1">{item.name}</h3>
          <span className="text-xl font-bold text-emerald-600">₹{item.price}</span>
        </div>

        {/* Description with Read More */}
        <p className="text-sm text-gray-500 mb-4">
          {showFullDesc || !isLongDesc ? item.description : item.description.slice(0, 60) + '...'}
          {isLongDesc && (
            <button
              onClick={() => setShowFullDesc(!showFullDesc)}
              className="text-emerald-600 font-semibold ml-1 hover:underline"
            >
              {showFullDesc ? 'Show less' : 'Read more'}
            </button>
          )}
        </p>

        {/* Dietary Tags */}
        {activeTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {activeTags.map(tag => (
              <span key={tag.key} className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${tag.color}`}>
                {tag.icon} {tag.label}
              </span>
            ))}
          </div>
        )}

        {/* Availability Toggle */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <span className="text-sm text-gray-500 font-medium">Availability</span>
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative inline-flex items-center">
              <input type="checkbox" checked={item.isAvailable} onChange={onToggle} className="sr-only peer" />
              <div className={`w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:shadow after:transition-all duration-300 ${item.isAvailable ? 'peer-checked:bg-gradient-to-r peer-checked:from-emerald-500 peer-checked:to-emerald-600' : ''}`} />
            </div>
            <span className={`text-sm font-bold ${item.isAvailable ? 'text-emerald-600' : 'text-gray-400'}`}>
              {item.isAvailable ? 'In Stock' : 'Out'}
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}

// ==================== ITEM FORM MODAL ====================
interface ItemFormModalProps {
  item: MenuItem | null;
  categories: Category[];
  onClose: () => void;
  onSave: (item: MenuItem) => void;
}

function ItemFormModal({ item, categories, onClose, onSave }: ItemFormModalProps) {
  const [formData, setFormData] = useState({
    name: item?.name || '',
    description: item?.description || '',
    price: item?.price.toString() || '',
    category: item?.category || categories[0]?.name || '',
    image: item?.image || '',
    isAvailable: item?.isAvailable ?? true,
    visibleInMenu: item?.visibleInMenu ?? true,
    dietary: item?.dietary || {
      vegetarian: false,
      vegan: false,
      glutenFree: false,
      spicy: false,
      containsNuts: false
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newItem: MenuItem = {
      id: item?.id || crypto.randomUUID(),
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price) || 0,
      category: formData.category,
      image: formData.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
      isAvailable: formData.isAvailable,
      visibleInMenu: formData.visibleInMenu,
      dietary: formData.dietary,
      rating: item?.rating || 0,
      salesCount: item?.salesCount || 0,
      createdAt: item?.createdAt || new Date().toISOString()
    };

    onSave(newItem);
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const toggleDietary = (key: keyof DietaryInfo) => {
    setFormData(prev => ({
      ...prev,
      dietary: { ...prev.dietary, [key]: !prev.dietary[key] }
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onWheel={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shrink-0">
          <div>
            <h2 className="text-lg font-bold">
              {item ? 'Edit Menu Item' : 'Add New Item'}
            </h2>
            <p className="text-emerald-100 text-sm">Fill in the details below</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
            <Icons.X />
          </button>
        </div>

        {/* Form - Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-5">
              {/* Basic Information */}
              <div className="p-5 bg-gray-50 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                  <Icons.Edit /> Basic Information
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Item Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Truffle Mushroom Risotto"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 outline-none transition-all text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Category</label>
                    <select
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 outline-none transition-all text-sm"
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Price (₹)</label>
                    <input
                      type="number"
                      required
                      value={formData.price}
                      onChange={e => setFormData({ ...formData, price: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 outline-none transition-all text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Description</label>
                  <textarea
                    rows={4}
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the ingredients, taste profile..."
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 outline-none transition-all text-sm resize-none"
                  />
                </div>
              </div>

              {/* Dietary Information */}
              <div className="p-5 bg-gray-50 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                  <Icons.Tag /> Dietary Information
                </div>
                <div className="flex flex-wrap gap-2">
                  {DIETARY_TAGS.map(tag => (
                    <button
                      key={tag.key}
                      type="button"
                      onClick={() => toggleDietary(tag.key)}
                      className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${
                        formData.dietary[tag.key]
                          ? tag.color
                          : 'bg-white text-gray-500 border-gray-200 hover:border-emerald-200 hover:bg-emerald-50'
                      }`}
                    >
                      {tag.icon} {tag.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-5">
              {/* Image Upload */}
              <div className="p-5 bg-gray-50 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                  <Icons.Upload /> Item Image
                </div>
                <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-emerald-400 transition-colors cursor-pointer bg-white">
                  <div className="text-gray-400 mb-3 flex justify-center">
                    <Icons.Upload />
                  </div>
                  <p className="text-sm text-gray-600 font-medium">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-400 mt-2">PNG, JPG or GIF (max. 800x600px)</p>
                </div>
                <input
                  type="url"
                  value={formData.image}
                  onChange={e => setFormData({ ...formData, image: e.target.value })}
                  placeholder="Or paste image URL..."
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all"
                />
              </div>

              {/* Availability */}
              <div className="p-5 bg-gray-50 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                  <Icons.Search /> Availability
                </div>
                <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">In Stock</p>
                    <p className="text-xs text-gray-500">Available for ordering</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isAvailable}
                      onChange={e => setFormData({ ...formData, isAvailable: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-12 h-7 bg-gray-200 rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:shadow after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-emerald-500 peer-checked:to-emerald-600" />
                  </label>
                </div>
                <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Visible in Menu</p>
                    <p className="text-xs text-gray-500">Show to customers</p>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${formData.visibleInMenu ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                    {formData.visibleInMenu ? 'ACTIVE' : 'HIDDEN'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-200 transition-all flex items-center gap-2"
          >
            {item ? 'Save Changes' : 'Save Item'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ==================== CATEGORY MODAL ====================
interface CategoryModalProps {
  categories: Category[];
  onClose: () => void;
  onAdd: (name: string) => void;
  onDelete: (id: string) => void;
}

function CategoryModal({ categories, onClose, onAdd, onDelete }: CategoryModalProps) {
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleAdd = () => {
    if (newCategoryName.trim()) {
      onAdd(newCategoryName.trim());
      setNewCategoryName('');
    }
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        onWheel={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
          <h2 className="text-lg font-bold">Manage Categories</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
            <Icons.X />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Add New */}
          <div className="flex gap-3">
            <input
              type="text"
              value={newCategoryName}
              onChange={e => setNewCategoryName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="New category name..."
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 outline-none transition-all"
            />
            <button
              onClick={handleAdd}
              className="px-5 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold rounded-xl hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-200 transition-all"
            >
              Add
            </button>
          </div>

          {/* List */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {categories.map(cat => (
              <div key={cat.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                <span className="font-semibold text-gray-900">{cat.name}</span>
                <button
                  onClick={() => onDelete(cat.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Icons.Trash />
                </button>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}