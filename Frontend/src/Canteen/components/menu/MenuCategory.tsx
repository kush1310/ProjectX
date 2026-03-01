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
  onCreateCoupon
}) => {
  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3 group cursor-move">
          <GripVertical className="text-gray-300 group-hover:text-gray-500 transition-colors" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              {category.name}
              <span className="text-sm font-medium bg-gray-100 px-2 py-0.5 rounded-full text-gray-500">
                {items.length}
              </span>
            </h2>
            {category.description && (
              <p className="text-gray-500 text-sm mt-1">{category.description}</p>
            )}
          </div>
        </div>

        <button
          onClick={() => onEditCategory(category)}
          className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2"
        >
          <Edit2 className="w-4 h-4" /> Edit Category
        </button>
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
