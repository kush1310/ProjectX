import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Image as ImageIcon, Check } from 'lucide-react';
import { MenuItem, MenuCategory, MenuVariant } from '@/Canteen/types/menu';

interface AddEditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Partial<MenuItem>) => void;
  initialItem?: MenuItem;
  categories: MenuCategory[];
}

type TabType = 'basic' | 'variants' | 'addons';

const AddEditItemModal: React.FC<AddEditItemModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialItem,
  categories
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('basic');
  
  // Form State
  const [formData, setFormData] = useState<Partial<MenuItem>>({
    name: '',
    description: '',
    price: 0,
    category: '',
    image: '',
    isVegetarian: true,
    available: true,
    isRecommended: false,
    hasVariants: false,
    variants: [],
    hasAddons: false,
    addonGroups: []
  });

  useEffect(() => {
    if (initialItem) {
      setFormData(initialItem);
    } else {
      setFormData({
        name: '',
        description: '',
        price: 0,
        category: categories[0]?.name || '', // Default to first category
        image: '',
        isVegetarian: true,
        available: true,
        isRecommended: false,
        hasVariants: false,
        variants: [],
        hasAddons: false,
        addonGroups: []
      });
    }
  }, [initialItem, categories, isOpen]);

  // Handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
        setFormData(prev => ({ ...prev, [name]: parseFloat(value) }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleVariantChange = (index: number, field: keyof MenuVariant, value: any) => {
    const newVariants = [...(formData.variants || [])];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setFormData(prev => ({ ...prev, variants: newVariants }));
  };

  const addVariant = () => {
    setFormData(prev => ({
        ...prev,
        variants: [...(prev.variants || []), { id: Date.now().toString(), name: '', price: 0 }]
    }));
  };

  const removeVariant = (index: number) => {
    const newVariants = [...(formData.variants || [])];
    newVariants.splice(index, 1);
    setFormData(prev => ({ ...prev, variants: newVariants }));
  };

  const handleSave = () => {
    // Basic validation
    if (!formData.name || !formData.price || !formData.category) {
        alert('Please fill in required fields');
        return;
    }
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           onClick={onClose}
           className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white z-10 sticky top-0">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">
                    {initialItem ? 'Edit Item' : 'Add New Item'}
                </h2>
                <p className="text-gray-500 text-sm">Configure item details, variants, and add-ons</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-900">
                <X className="w-6 h-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex px-8 border-b border-gray-100">
             {(['basic', 'variants', 'addons'] as TabType[]).map(tab => (
                 <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors capitalize ${
                        activeTab === tab 
                        ? 'border-emerald-500 text-emerald-600' 
                        : 'border-transparent text-gray-500 hover:text-gray-900'
                    }`}
                 >
                    {tab === 'basic' ? 'Basic Details' : tab}
                 </button>
             ))}
          </div>

          {/* Body */}
          <div className="p-8 overflow-y-auto flex-1">
             {activeTab === 'basic' && (
                 <div className="space-y-6">
                    <div className="flex gap-6">
                        {/* Image Upload Placeholder */}
                        <div className="w-32 h-32 bg-gray-100 rounded-2xl flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 cursor-pointer hover:bg-gray-50 hover:border-emerald-200 hover:text-emerald-500 transition-all">
                            {formData.image ? (
                                <img src={formData.image} alt="Preview" className="w-full h-full object-cover rounded-2xl" />
                            ) : (
                                <>
                                    <ImageIcon className="w-8 h-8 mb-2" />
                                    <span className="text-xs font-bold">Upload</span>
                                </>
                            )}
                        </div>
                        
                        <div className="flex-1 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Item Name</label>
                                <input 
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                                    placeholder="e.g. Masala Dosa"
                                />
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Price (₹)</label>
                                    <input 
                                        type="number"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 outline-none"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Prep Time (min)</label>
                                    <input 
                                        type="number"
                                        name="preparationTime"
                                        value={formData.preparationTime || ''}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 outline-none"
                                        placeholder="15"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
                                    <select 
                                        name="category"
                                        value={formData.category} // Assuming category is stored as string name for now
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 outline-none bg-white"
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Sub Category (Optional)</label>
                                <input 
                                    name="subCategory"
                                    value={formData.subCategory || ''}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 outline-none transition-all"
                                    placeholder="e.g. Paneer Special, Dry Snacks"
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Sort Order</label>
                                    <input 
                                        type="number"
                                        name="displayOrder"
                                        value={formData.displayOrder || 0}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Avail. From</label>
                                    <input 
                                        type="time"
                                        name="availableFrom"
                                        value={formData.availableFrom || ''}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Avail. To</label>
                                    <input 
                                        type="time"
                                        name="availableTo"
                                        value={formData.availableTo || ''}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                        <textarea 
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 outline-none resize-none"
                            placeholder="Describe the dish..."
                        />
                    </div>

                    <div className="flex gap-6 pt-4 border-t border-gray-100">
                        <label className="flex items-center gap-3 cursor-pointer group">
                             <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${formData.isVegetarian ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                                 {formData.isVegetarian && <Check className="w-4 h-4 text-white" />}
                             </div>
                             <input type="checkbox" name="isVegetarian" checked={formData.isVegetarian} onChange={handleInputChange} className="hidden" />
                             <span className="text-gray-700 font-medium">Vegetarian</span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer group">
                             <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${formData.available ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'}`}>
                                 {formData.available && <Check className="w-4 h-4 text-white" />}
                             </div>
                             <input type="checkbox" name="available" checked={formData.available} onChange={handleInputChange} className="hidden" />
                             <span className="text-gray-700 font-medium">Available</span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer group">
                             <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${formData.isRecommended ? 'bg-amber-500 border-amber-500' : 'border-gray-300'}`}>
                                 {formData.isRecommended && <Check className="w-4 h-4 text-white" />}
                             </div>
                             <input type="checkbox" name="isRecommended" checked={formData.isRecommended || false} onChange={handleInputChange} className="hidden" />
                             <span className="text-gray-700 font-medium">Best Seller</span>
                        </label>
                    </div>
                 </div>
             )}

             {activeTab === 'variants' && (
                 <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Item Variants</h3>
                            <p className="text-sm text-gray-500">Add size or portion variations</p>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <span className="text-sm font-bold text-gray-700">Enable Variants</span>
                            <div className={`relative w-12 h-6 rounded-full transition-colors ${formData.hasVariants ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.hasVariants ? 'translate-x-6' : 'translate-x-0'}`} />
                                <input type="checkbox" name="hasVariants" checked={formData.hasVariants} onChange={handleInputChange} className="hidden" />
                            </div>
                        </label>
                    </div>

                    {formData.hasVariants && (
                        <div className="space-y-4">
                            {formData.variants?.map((variant, idx) => (
                                <div key={idx} className="flex gap-4 items-end animate-fadeIn">
                                    <div className="flex-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Variant Name</label>
                                        <input 
                                            value={variant.name}
                                            onChange={(e) => handleVariantChange(idx, 'name', e.target.value)}
                                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-emerald-500 outline-none"
                                            placeholder="e.g. Small"
                                        />
                                    </div>
                                    <div className="w-32">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Price (₹)</label>
                                        <input 
                                            type="number"
                                            value={variant.price}
                                            onChange={(e) => handleVariantChange(idx, 'price', e.target.value)}
                                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-emerald-500 outline-none"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <button 
                                        onClick={() => removeVariant(idx)}
                                        className="p-3 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors mb-0.5"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                            <button 
                                onClick={addVariant}
                                className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 font-bold hover:border-emerald-500 hover:text-emerald-500 transition-all flex items-center justify-center gap-2"
                            >
                                <Plus className="w-5 h-5" /> Add Variant
                            </button>
                        </div>
                    )}
                 </div>
             )}

             {activeTab === 'addons' && (
                 <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Add-on Groups</h3>
                            <p className="text-sm text-gray-500">Configure customizations (e.g. Toppings, Size Upgrade)</p>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <span className="text-sm font-bold text-gray-700">Enable Add-ons</span>
                            <div className={`relative w-12 h-6 rounded-full transition-colors ${formData.hasAddons ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.hasAddons ? 'translate-x-6' : 'translate-x-0'}`} />
                                <input type="checkbox" name="hasAddons" checked={formData.hasAddons} onChange={handleInputChange} className="hidden" />
                            </div>
                        </label>
                    </div>

                    {formData.hasAddons && (
                        <div className="space-y-6">
                            {formData.addonGroups?.map((group, groupIdx) => (
                                <div key={groupIdx} className="bg-gray-50 rounded-2xl p-4 animate-fadeIn">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1 mr-4">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Group Name</label>
                                            <input 
                                                value={group.name}
                                                onChange={(e) => {
                                                    const newGroups = [...(formData.addonGroups || [])];
                                                    newGroups[groupIdx].name = e.target.value;
                                                    setFormData({...formData, addonGroups: newGroups});
                                                }}
                                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-emerald-500 outline-none"
                                                placeholder="e.g. Extra Toppings"
                                            />
                                        </div>
                                        <button 
                                            onClick={() => {
                                                const newGroups = [...(formData.addonGroups || [])];
                                                newGroups.splice(groupIdx, 1);
                                                setFormData({...formData, addonGroups: newGroups});
                                            }}
                                            className="p-2 text-red-500 bg-red-50 rounded-lg hover:bg-red-100"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    
                                    <div className="flex gap-4 mb-4">
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Min Selection</label>
                                            <input 
                                                type="number"
                                                value={group.minSelection}
                                                onChange={(e) => {
                                                    const newGroups = [...(formData.addonGroups || [])];
                                                    newGroups[groupIdx].minSelection = parseInt(e.target.value);
                                                    setFormData({...formData, addonGroups: newGroups});
                                                }}
                                                className="w-20 px-3 py-2 rounded-xl border border-gray-200"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Max Selection</label>
                                            <input 
                                                type="number"
                                                value={group.maxSelection}
                                                onChange={(e) => {
                                                    const newGroups = [...(formData.addonGroups || [])];
                                                    newGroups[groupIdx].maxSelection = parseInt(e.target.value);
                                                    setFormData({...formData, addonGroups: newGroups});
                                                }}
                                                className="w-20 px-3 py-2 rounded-xl border border-gray-200"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <h4 className="text-sm font-bold text-gray-700">Options</h4>
                                        {group.options.map((option, optIdx) => (
                                            <div key={optIdx} className="flex gap-2 items-center">
                                                <input 
                                                    value={option.name}
                                                    onChange={(e) => {
                                                        const newGroups = [...(formData.addonGroups || [])];
                                                        newGroups[groupIdx].options[optIdx].name = e.target.value;
                                                        setFormData({...formData, addonGroups: newGroups});
                                                    }}
                                                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm"
                                                    placeholder="Option Name"
                                                />
                                                <input 
                                                    type="number"
                                                    value={option.price}
                                                    onChange={(e) => {
                                                        const newGroups = [...(formData.addonGroups || [])];
                                                        newGroups[groupIdx].options[optIdx].price = parseFloat(e.target.value);
                                                        setFormData({...formData, addonGroups: newGroups});
                                                    }}
                                                    className="w-24 px-3 py-2 rounded-lg border border-gray-200 text-sm"
                                                    placeholder="Price"
                                                />
                                                <button 
                                                    onClick={() => {
                                                        const newGroups = [...(formData.addonGroups || [])];
                                                        newGroups[groupIdx].options.splice(optIdx, 1);
                                                        setFormData({...formData, addonGroups: newGroups});
                                                    }}
                                                    className="p-2 text-gray-400 hover:text-red-500"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                        <button 
                                            onClick={() => {
                                                const newGroups = [...(formData.addonGroups || [])];
                                                newGroups[groupIdx].options.push({ id: Date.now().toString(), name: '', price: 0 });
                                                setFormData({...formData, addonGroups: newGroups});
                                            }}
                                            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 mt-2"
                                        >
                                            <Plus className="w-3 h-3" /> Add Option
                                        </button>
                                    </div>
                                </div>
                            ))}

                            <button 
                                onClick={() => {
                                    setFormData(prev => ({
                                        ...prev,
                                        addonGroups: [...(prev.addonGroups || []), {
                                            id: Date.now().toString(),
                                            name: 'New Group',
                                            required: false,
                                            minSelection: 0,
                                            maxSelection: 1,
                                            options: []
                                        }]
                                    }));
                                }}
                                className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 font-bold hover:border-emerald-500 hover:text-emerald-500 transition-all flex items-center justify-center gap-2"
                            >
                                <Plus className="w-5 h-5" /> Add Add-on Group
                            </button>
                        </div>
                    )}
                 </div>
             )}

          </div>

          {/* Footer */}
          <div className="px-8 py-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button 
                onClick={onClose}
                className="px-6 py-3 font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
              >
                  Cancel
              </button>
              <button 
                onClick={handleSave}
                className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 transition-all transform active:scale-95"
              >
                  {initialItem ? 'Update Item' : 'Create Item'}
              </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AddEditItemModal;
