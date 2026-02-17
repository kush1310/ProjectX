import React from 'react';
import { Edit2, Trash2, Eye, EyeOff, Ticket } from 'lucide-react';
import { MenuItem } from '@/Canteen/types/menu';
import { motion } from 'framer-motion';

interface MenuItemCardProps {
  item: MenuItem;
  onEdit: (item: MenuItem) => void;
  onDelete: (id: number) => void;
  onToggleStatus: (id: number, currentStatus: boolean) => void;
  onCreateCoupon?: (item: MenuItem) => void;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({ item, onEdit, onDelete, onToggleStatus, onCreateCoupon }) => {
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group relative bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300"
    >
      {/* No Image Section as per request - only actions on hover or separate button? 
          User said: "menu item should not consists of any kind of images... only when edit... image shown".
          Effectively, the card becomes text-only or we keep the layout but remove the img tag. 
          Let's remove the img tag but keep the container for badges/actions if needed, or redesign.
          Actually, the user likely wants a compact list or card without the big image.
          I will remove the entire "Image Section" div and move Badges/Actions elsewhere.
      */}
      
      <div className="relative p-5">
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={() => onToggleStatus(item.id, item.available)}
            className={`px-3 py-1 rounded-full text-xs font-bold border border-gray-100 shadow-sm flex items-center gap-1.5 transition-colors ${
              item.available 
                ? 'bg-emerald-50 text-emerald-600' 
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {item.available ? (
              <>
                <Eye className="w-3 h-3" /> Visible
              </>
            ) : (
              <>
                <EyeOff className="w-3 h-3" /> Hidden
              </>
            )}
          </button>
        </div>

        {/* Badges */}
        <div className="flex flex-col gap-2 mb-4">
           {item.isRecommended && (
             <span className="w-fit px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wider rounded-md">
               Best Seller
             </span>
           )}
        </div>

        <div className="flex justify-between items-start mb-2 mt-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2 h-2 rounded-full ${item.isVegetarian ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{item.category}</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-emerald-700 transition-colors line-clamp-1">{item.name}</h3>
          </div>
          <span className="text-lg font-bold text-gray-900">₹{item.price}</span>
        </div>
        
        <p className="text-sm text-gray-500 line-clamp-2 mb-4 min-h-[40px]">{item.description}</p>

        {/* Footer info */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
           {(item.hasVariants || item.hasAddons) && (
             <div className="flex gap-2">
                {item.hasVariants && <span className="px-2 py-1 bg-purple-50 text-purple-700 text-[10px] font-bold uppercase rounded-md">Variants</span>}
                {item.hasAddons && <span className="px-2 py-1 bg-orange-50 text-orange-700 text-[10px] font-bold uppercase rounded-md">Add-ons</span>}
             </div>
           )}
           
           <div className="flex gap-2 ml-auto">
              <button 
                onClick={() => onCreateCoupon && onCreateCoupon(item)}
                className="p-2 bg-gray-50 text-emerald-600 rounded-lg hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                title="Create Deal"
              >
                <Ticket className="w-4 h-4" />
              </button>
              <button 
                onClick={() => onEdit(item)}
                className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                title="Edit Item"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => onDelete(item.id)}
                className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
                title="Delete Item"
              >
                <Trash2 className="w-4 h-4" />
              </button>
           </div>
        </div>
      </div>


    </motion.div>
  );
};

export default MenuItemCard;
