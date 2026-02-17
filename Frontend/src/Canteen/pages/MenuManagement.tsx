import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, FolderPlus, Loader2, ChevronDown, Check } from 'lucide-react';

import MenuCategory from '../components/menu/MenuCategory';
import AddEditItemModal from '../components/menu/AddEditItemModal';
import CategoryModal from '../components/menu/CategoryModal';
import ConfirmModal from '../components/ConfirmModal';
import { MenuItem, MenuCategory as MenuCategoryType } from '@/Canteen/types/menu'; 
import FuzzySearch from 'fuzzy-search';
import { PlaceholdersAndVanishInput } from '@/components/ui/placeholders-and-vanish-input';
import { 
  fetchMenu, 
  addMenuItem, 
  updateMenuItem, 
  deleteMenuItem, 
  toggleItemAvailability,
  fetchCanteens,
  fetchCategories,
  createCategory,
  createCoupon
} from '@/Canteen/utils/canteenStore';
import { CreateCouponForm } from '../coupon-app/src/components/CreateCouponForm';
import { toast } from '@/utils/toast';

type SortOption = 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'category';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'category', label: 'Default (Category)' },
  { value: 'name-asc', label: 'Name A-Z' },
  { value: 'name-desc', label: 'Name Z-A' },
  { value: 'price-asc', label: 'Price Low-High' },
  { value: 'price-desc', label: 'Price High-Low' },
];

export default function MenuManagement() {
  const [categories, setCategories] = useState<MenuCategoryType[]>([]); 
  const [items, setItems] = useState<MenuItem[]>([]);
  const [canteenId, setCanteenId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('category');
  const [isSortOpen, setIsSortOpen] = useState(false);
  
  // Coupon Modal State
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [selectedItemForCoupon, setSelectedItemForCoupon] = useState<MenuItem | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | undefined>(undefined);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  
  // Delete Confirmation Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Initial Fetch
  useEffect(() => {
    const loadData = async () => {
      try {
        const canteens = await fetchCanteens();
        if (canteens.length > 0) {
          const id = canteens[0].id;
          setCanteenId(id);
          
          const [menuData, categoryData] = await Promise.all([
            fetchMenu(id),
            fetchCategories(id)
          ]);
          
          setItems(menuData as unknown as MenuItem[]);
          
          const mappedCategories = categoryData.map(c => ({
            id: c.id.toString(),
            name: c.name,
            itemCount: 0,
            isActive: true
          }));
          
          if (mappedCategories.length === 0) {
              const uniqueCategories = Array.from(new Set(menuData.map((i: any) => i.category)));
              const derivedCats = uniqueCategories.map((cat, index) => ({
                id: `derived-${index}`,
                name: cat as string,
                itemCount: 0,
                isActive: true
              }));
              setCategories(derivedCats);
          } else {
              setCategories(mappedCategories);
          }
        }
      } catch (error) {
        console.error("Failed to load data", error);
        toast.error("Failed to load menu data");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Update Item Counts
  useEffect(() => {
     setCategories(prev => prev.map(cat => ({
         ...cat,
         itemCount: items.filter(i => i.category === cat.name).length
     })));
  }, [items]);

  const filteredItems = useMemo(() => {
    let result = items;

    if (searchQuery) {
      const searcher = new FuzzySearch(items, ['name', 'category', 'description'], {
        caseSensitive: false,
      });
      result = searcher.search(searchQuery);
    }

    return [...result].sort((a, b) => {
      switch (sortBy) {
        case 'name-asc': return a.name.localeCompare(b.name);
        case 'name-desc': return b.name.localeCompare(a.name);
        case 'price-asc': return a.price - b.price;
        case 'price-desc': return b.price - a.price;
        default: return 0;
      }
    });
  }, [items, searchQuery, sortBy]);

  const groupedItems = useMemo(() => {
    if (sortBy !== 'category') {
        return [{
            id: 'all-sorted',
            name: 'All Items',
            itemCount: filteredItems.length,
            isActive: true,
            items: filteredItems
        }];
    }

    const groups = categories.map(cat => ({
        ...cat,
        items: filteredItems.filter(item => item.category === cat.name)
    })).filter(group => group.items.length > 0);

    const categorizedItemIds = new Set(groups.flatMap(g => g.items.map(i => i.id)));
    const uncategorizedItems = filteredItems.filter(i => !categorizedItemIds.has(i.id));

    if (uncategorizedItems.length > 0) {
        groups.push({
            id: 'uncategorized',
            name: 'Other Items',
            itemCount: uncategorizedItems.length,
            isActive: true,
            items: uncategorizedItems
        });
    }

    return groups;
  }, [categories, filteredItems, sortBy]);

  // Handlers
  const handleAddNew = () => {
    setEditingItem(undefined);
    setIsModalOpen(true);
  };

  const handleAddCategory = () => {
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (name: string) => {
      if (name && canteenId) {
          const newCat = await createCategory(canteenId, name);
          if (newCat) {
              setCategories(prev => [...prev, {
                  id: newCat.id.toString(),
                  name: newCat.name,
                  itemCount: 0,
                  isActive: true
              }]);
              toast.success("Category created");
          } else {
              toast.error("Failed to create category");
          }
      }
  };

  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleCreateDeal = (item: MenuItem) => {
      setSelectedItemForCoupon(item);
      setIsCouponModalOpen(true);
  };

  const handleDeleteItem = async (id: number) => {
    setItemToDelete(id);
    setDeleteModalOpen(true);
  };
  
  const confirmDeleteItem = async () => {
    if (!itemToDelete) return;
    
    setIsDeleting(true);
    const success = await deleteMenuItem(itemToDelete);
    if (success) {
        setItems(prev => prev.filter(i => i.id !== itemToDelete));
        toast.success('Item deleted successfully');
    } else {
        toast.error('Failed to delete item');
    }
    setIsDeleting(false);
    setDeleteModalOpen(false);
    setItemToDelete(null);
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    const success = await toggleItemAvailability(id, !currentStatus);
    if (success) {
        setItems(prev => prev.map(i => i.id === id ? { ...i, available: !currentStatus } : i));
        toast.success(currentStatus ? 'Item hidden from menu' : 'Item visible in menu');
    } else {
        toast.error('Failed to update status');
    }
  };

  const handleSaveItem = async (itemData: Partial<MenuItem>) => {
    if (!canteenId) {
        toast.error("No canteen selected");
        return;
    }

    if (editingItem) {
        const updated = await updateMenuItem(editingItem.id, itemData);
        if (updated) {
            setItems(prev => prev.map(i => i.id === editingItem.id ? { ...updated, available: updated.isAvailable } as unknown as MenuItem : i));
            toast.success('Item updated successfully');
        } else {
            toast.error('Failed to update item');
        }
    } else {
        const newItem = await addMenuItem(canteenId, itemData);
        if (newItem) {
            setItems(prev => [...prev, { ...newItem, available: newItem.isAvailable } as unknown as MenuItem]);
            toast.success('New item created successfully');
        } else {
            toast.error('Failed to create item');
        }
    }
  };

  const currentSortLabel = SORT_OPTIONS.find(o => o.value === sortBy)?.label || 'Sort';

  return (
    <>
      <div className="max-w-[1600px] mx-auto pb-20">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Menu Management</h1>
                <p className="text-gray-500 mt-1 text-sm md:text-base">Manage your categories, items, and variations.</p>
            </div>
            
            {/* Action Buttons - Text Links Style */}
            <div className="flex items-center gap-6">
                 <button 
                    onClick={handleAddCategory}
                    className="flex items-center gap-2 text-gray-600 hover:text-[#e23744] font-semibold text-sm transition-colors group"
                 >
                    <FolderPlus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span>New Category</span>
                 </button>
                 
                 <button 
                     onClick={handleAddNew}
                     className="flex items-center gap-2 text-[#e23744] hover:text-[#d62f3f] font-bold text-sm transition-colors group"
                 >
                     <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                     <span>Add New Item</span>
                 </button>
            </div>
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-xl p-4 rounded-2xl border border-gray-100 shadow-sm mb-8 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
                <PlaceholdersAndVanishInput
                    placeholders={["Search menu items...", "Find 'Butter Chicken'", "Look for category..."]}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onSubmit={(e) => e.preventDefault()}
                />
            </div>
            
            {/* Sort Dropdown - Zomato Style */}
            <div className="relative">
                <button 
                  onClick={() => setIsSortOpen(!isSortOpen)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:border-gray-300 transition-colors text-sm min-w-[180px] justify-between"
                >
                    <span className="flex items-center gap-2">
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
                      <span className="text-gray-500">Sort:</span>
                      <span className="font-semibold text-gray-800">{currentSortLabel.replace('Default (', '').replace(')', '')}</span>
                    </span>
                </button>
                
                {isSortOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsSortOpen(false)} 
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50">
                        {SORT_OPTIONS.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => {
                                  setSortBy(opt.value);
                                  setIsSortOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-between ${
                                  sortBy === opt.value 
                                    ? 'text-[#e23744] bg-rose-50' 
                                    : 'text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                {opt.label}
                                {sortBy === opt.value && <Check className="w-4 h-4" />}
                            </button>
                        ))}
                    </div>
                  </>
                )}
            </div>
        </div>

        {isLoading ? (
             <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-10 h-10 text-[#e23744] animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Loading menu data...</p>
             </div>
        ) : (
            <div className="space-y-2">
                {groupedItems.map(category => (
                    <MenuCategory 
                        key={category.id}
                        category={category}
                        items={category.items}
                        onEditCategory={() => {}}
                        onEditItem={handleEditItem}
                        onDeleteItem={handleDeleteItem}
                        onToggleItemStatus={handleToggleStatus}
                        onCreateCoupon={handleCreateDeal}
                    />
                ))}

                {groupedItems.length === 0 && (
                    <div className="text-center py-20 bg-white/50 rounded-3xl border border-dashed border-gray-200">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5 text-gray-400">
                            <Search className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">No items found</h3>
                        <p className="text-gray-500 mt-2">Try adjusting your search or filters</p>
                    </div>
                )}
            </div>
        )}
      </div>

      <AddEditItemModal 
         isOpen={isModalOpen}
         onClose={() => setIsModalOpen(false)}
         onSave={handleSaveItem}
         initialItem={editingItem}
         categories={categories}
      />

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSave={handleSaveCategory}
      />

    {isCouponModalOpen && (
        <CreateCouponForm
            onClose={() => setIsCouponModalOpen(false)}
            onSubmit={async (coupon) => {
                await createCoupon(coupon);
                toast.success("Deal Created Successfully!");
            }}
            initialData={{
                 title: selectedItemForCoupon ? `Deal on ${selectedItemForCoupon.name}` : '',
                 code: selectedItemForCoupon ? `${selectedItemForCoupon.name.substring(0,3).toUpperCase()}20` : '',
                 scope: 'ITEM',
                 targetIds: selectedItemForCoupon ? String(selectedItemForCoupon.id) : '',
                 discountValue: 20
            } as any}
        />
    )}

    <ConfirmModal
      isOpen={deleteModalOpen}
      title="Delete Item"
      message="Are you sure you want to delete this item? This action cannot be undone."
      confirmText="Delete"
      cancelText="Cancel"
      variant="danger"
      onConfirm={confirmDeleteItem}
      onCancel={() => {
        setDeleteModalOpen(false);
        setItemToDelete(null);
      }}
      isLoading={isDeleting}
    />

    </>
  );
}
