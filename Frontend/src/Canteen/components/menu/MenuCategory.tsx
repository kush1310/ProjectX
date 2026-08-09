import React from 'react';
import { MenuItem, MenuCategory as MenuCategoryType } from '../../types/menu';
import MenuItemCard from './MenuItemCard';
import { Edit2, GripVertical } from 'lucide-react';
import { Coupon } from '@/Canteen/utils/canteenStore';

interface MenuCategoryProps {
  category: MenuCategoryType;
  items: MenuItem[];
  coupons?: Coupon[];
  onEditCategory: (category: MenuCategoryType) => void;
  onEditItem: (item: MenuItem) => void;
  onDeleteItem: (id: number) => void;
  onToggleItemStatus: (id: number, currentStatus: boolean) => void;
  onToggleCategoryStatus?: (category: MenuCategoryType) => void;
  onCreateCoupon?: (item: MenuItem) => void;
}

const MenuCategory: React.FC<MenuCategoryProps> = ({
  category,
  items,
  coupons = [],
  onEditCategory,
  onEditItem,
  onDeleteItem,
  onToggleItemStatus,
  onToggleCategoryStatus,
  onCreateCoupon
}) => {
  const isCategoryInStock = category.isAvailable !== false;

  return (
    <div className={`mb-10 p-4 rounded-3xl transition-colors ${!isCategoryInStock ? 'bg-red-50/30 border border-red-100' : ''}`}>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 group cursor-move">
          <GripVertical className="text-gray-300 group-hover:text-gray-500 transition-colors" />
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                {category.name}
                <span className="text-sm font-medium bg-gray-100 px-2 py-0.5 rounded-full text-gray-500">
                  {items.length}
                </span>
              </h2>
              {/* Category Out of Stock Red Badge */}
              {!isCategoryInStock ? (
                <span className="px-3 py-1 bg-red-100 text-red-600 border border-red-200 text-xs font-bold rounded-full uppercase tracking-wider animate-pulse">
                  Out of Stock
                </span>
              ) : (
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-medium rounded-full">
                  Category In Stock
                </span>
              )}
            </div>
            {category.description && (
              <p className="text-gray-500 text-sm mt-1">{category.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Category Stock Toggle Button */}
          {onToggleCategoryStatus && (
            <button
              onClick={() => onToggleCategoryStatus(category)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border shadow-sm flex items-center gap-2 transition-all ${
                isCategoryInStock
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                  : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
              }`}
              title={isCategoryInStock ? "Mark category as Out of Stock" : "Mark category as In Stock"}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${isCategoryInStock ? 'bg-emerald-500' : 'bg-red-500'}`} />
              {isCategoryInStock ? 'Category: In Stock' : 'Category: Out of Stock'}
            </button>
          )}

          <button
            onClick={() => onEditCategory(category)}
            className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2"
          >
            <Edit2 className="w-4 h-4" /> Edit Category
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-10 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
          <p className="text-gray-500">No items in this category yet.</p>
          <button className="mt-2 text-emerald-600 font-bold text-sm hover:underline">
            + Add "{category.name}" Item
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
          {items.map(item => (
            <MenuItemCard
              key={item.id}
              item={item}
              coupons={coupons}
              isCategoryOutOfStock={!isCategoryInStock}
              onEdit={onEditItem}
              onDelete={onDeleteItem}
              onToggleStatus={onToggleItemStatus}
              onCreateCoupon={onCreateCoupon}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MenuCategory;
