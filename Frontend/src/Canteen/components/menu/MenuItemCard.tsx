import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Edit2, Trash2, Eye, EyeOff, Ticket, Plus, Percent, ChevronDown } from 'lucide-react';
import { MenuItem } from '@/Canteen/types/menu';
import { Coupon } from '@/Canteen/utils/canteenStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface MenuItemCardProps {
  item: MenuItem;
  coupons?: Coupon[];
  onEdit: (item: MenuItem) => void;
  onDelete: (id: number) => void;
  onToggleStatus: (id: number, currentStatus: boolean) => void;
  onCreateCoupon?: (item: MenuItem) => void;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({ item, coupons = [], onEdit, onDelete, onToggleStatus }) => {
  const [isCouponDropdownOpen, setIsCouponDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Filter coupons that apply to this specific item
  const itemCoupons = useMemo(() => {
    return coupons.filter(coupon => {
      if (coupon.applicableItemIds && coupon.applicableItemIds.includes(item.id)) {
        return true;
      }
      if (coupon.applicableItems && coupon.applicableItems.some(ai => ai.menuItemId === item.id)) {
        return true;
      }
      return false;
    });
  }, [coupons, item.id]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsCouponDropdownOpen(false);
      }
    };
    if (isCouponDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCouponDropdownOpen]);

  const getDiscountLabel = (coupon: Coupon) => {
    if (coupon.discountType === 'PERCENTAGE') return `${coupon.discountValue}% OFF`;
    if (coupon.discountType === 'FLAT') return `₹${coupon.discountValue} OFF`;
    if (coupon.discountType === 'BOGO') return 'BOGO';
    return `${coupon.discountValue}% OFF`;
  };

  const handleCreateCoupon = () => {
    setIsCouponDropdownOpen(false);
    // Navigate to coupon management page with item context
    navigate('/vendor/coupons', {
      state: {
        createForItem: {
          id: item.id,
          name: item.name,
          price: item.price,
        }
      }
    });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`group relative bg-white border border-gray-100 rounded-2xl overflow-visible hover:shadow-xl transition-all duration-300 ${isCouponDropdownOpen ? 'z-50' : ''}`}
    >
      <div className="relative p-5">
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={() => onToggleStatus(item.id, item.available)}
            className={`px-3 py-1 rounded-full text-xs font-bold border border-gray-100 shadow-sm flex items-center gap-1.5 transition-colors ${item.available
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
            {/* Coupon Dropdown Button */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsCouponDropdownOpen(!isCouponDropdownOpen)}
                className={`p-2 rounded-lg transition-colors flex items-center gap-1 ${isCouponDropdownOpen
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-gray-50 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700'
                  }`}
                title="Coupons"
              >
                <Ticket className="w-4 h-4" />
                {itemCoupons.length > 0 && (
                  <span className="w-4 h-4 bg-emerald-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {itemCoupons.length}
                  </span>
                )}
                <ChevronDown className={`w-3 h-3 transition-transform ${isCouponDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Panel */}
              <AnimatePresence>
                {isCouponDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 z-[100] overflow-hidden"
                  >
                    {/* Header */}
                    <div className="px-4 py-3 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-gray-100">
                      <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                        Coupons for {item.name}
                      </p>
                    </div>

                    {/* Existing Coupons List */}
                    <div className="max-h-48 overflow-y-auto">
                      {itemCoupons.length > 0 ? (
                        itemCoupons.map((coupon) => (
                          <div
                            key={coupon.id}
                            className="px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-mono text-sm font-bold text-gray-800 tracking-wide">
                                {coupon.couponCode}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${coupon.isActive
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-gray-100 text-gray-500'
                                }`}>
                                {coupon.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500 line-clamp-1">{coupon.title}</span>
                              <span className="flex items-center gap-1 text-xs font-bold text-orange-600">
                                <Percent className="w-3 h-3" />
                                {getDiscountLabel(coupon)}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-6 text-center">
                          <Ticket className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm text-gray-400 font-medium">No coupons yet</p>
                          <p className="text-xs text-gray-300 mt-0.5">Create one below</p>
                        </div>
                      )}
                    </div>

                    {/* Create New Coupon — Navigate to Coupon Management */}
                    <div className="border-t border-gray-100">
                      <button
                        onClick={handleCreateCoupon}
                        className="w-full px-4 py-3 flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-50 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Create New Coupon
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

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
