import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Minus, Plus, Trash2, ShoppingBag, ArrowRight,
  Tag, X, Check, Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from '../../utils/toast';
import { validateCoupon, CartItemInfo, applyCouponToCart, removeCouponFromCart } from '../utils/canteenStore';
import { getSession } from '../../utils/authStore';
import CouponListModal from '../components/CouponListModal';

interface CartItem {
  id: number;
  menuItem: {
    id: number;
    name: string;
    price: number;
    isVeg: boolean;
    category: string;
  };
  quantity: number;
  unitPrice: number;
  selectedVariant?: string;
  specialInstructions?: string;
}

interface Cart {
  id: number;
  canteen?: {
    id: number;
    name: string;
  };
  items: CartItem[];
  totalAmount: number;
}

export default function CartPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/cart');
      setCart(res.data);
      // Backend now returns applied coupon details in cart
      if (res.data.appliedCoupon) {
        setAppliedCoupon({
          code: res.data.appliedCoupon.couponCode,
          discount: res.data.discountAmount
        });
        setCouponCode(res.data.appliedCoupon.couponCode);
      } else {
        setAppliedCoupon(null);
        setCouponCode('');
      }
    } catch (err) {
      console.error('Failed to fetch cart:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (itemId: number, quantity: number) => {
    try {
      await api.put(`/cart/update/${itemId}`, { quantity });
      fetchCart();
    } catch (err) {
      toast.error('Failed to update quantity');
    }
  };

  const removeItem = async (itemId: number) => {
    try {
      await api.delete(`/cart/remove/${itemId}`);
      toast.success('Item removed');
      fetchCart();
    } catch (err) {
      toast.error('Failed to remove item');
    }
  };

  const clearCart = async () => {
    try {
      await api.delete('/cart/clear');
      setCart(null);
      toast.success('Cart cleared');
    } catch (err) {
      toast.error('Failed to clear cart');
    }
  };

  const applyCoupon = async (codeOverride?: string) => {
    const codeToApply = codeOverride || couponCode;
    if (!codeToApply?.trim()) return;

    const session = getSession();
    if (!session?.id) {
      toast.error("Please login to apply coupons");
      return;
    }



    try {
      setIsApplyingCoupon(true);

      const result = await applyCouponToCart(codeToApply);

      if (result.success) {
        setAppliedCoupon({ code: codeToApply.toUpperCase(), discount: result.discount || 0 });
        toast.success(result.message);
        setCouponCode(codeToApply.toUpperCase());
        if (codeOverride) setIsModalOpen(false);
        fetchCart(); // Refresh cart to get updated totals from backend
      } else {
        toast.error(result.message);
        setAppliedCoupon(null);
      }
    } catch (err) {
      toast.error('Invalid coupon code');
      setAppliedCoupon(null);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const removeCoupon = async () => {
    try {
      const result = await removeCouponFromCart();
      if (result.success) {
        setAppliedCoupon(null);
        setCouponCode('');
        toast.success("Coupon removed");
        fetchCart();
      } else {
        toast.error(result.message);
      }
    } catch (e) {
      toast.error("Failed to remove coupon");
    }
  };

  const proceedToCheckout = () => {
    if (!cart || cart.items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    navigate('/checkout', { state: { couponCode: appliedCoupon?.code } });
  };

  const subtotal = cart?.totalAmount || 0;
  const discount = appliedCoupon?.discount || 0;
  const deliveryFee = 0; // Free delivery for campus
  const total = subtotal - discount + deliveryFee;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl p-6 animate-pulse">
            <div className="h-6 bg-slate-200 rounded w-1/4 mb-6"></div>
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-4 py-4 border-b border-slate-100">
                <div className="w-20 h-20 bg-slate-100 rounded-xl"></div>
                <div className="flex-1">
                  <div className="h-4 bg-slate-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-slate-100 rounded w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-10 h-10 text-slate-400" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Your cart is empty</h2>
          <p className="text-slate-500 mb-6">Add items from the menu to get started</p>
          <button
            onClick={() => navigate('/customer/menu')}
            className="px-6 py-3 bg-[#e23744] text-white rounded-xl font-medium hover:bg-[#c53030] transition-colors"
          >
            Browse Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Your Cart</h1>
            {cart.canteen && (
              <p className="text-slate-500">{cart.canteen.name}</p>
            )}
          </div>
          <button
            onClick={clearCart}
            className="text-sm text-red-500 hover:text-red-600 font-medium flex items-center gap-1"
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence>
              {cart.items.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className="bg-white rounded-2xl p-4 shadow-sm"
                >
                  <div className="flex gap-4">
                    {/* Veg/Non-veg indicator */}
                    <div className="w-20 h-20 bg-slate-100 rounded-xl flex items-center justify-center relative">
                      <span className={`absolute top-1 left-1 w-4 h-4 rounded-sm border-2 flex items-center justify-center ${item.menuItem.isVeg ? 'border-green-500' : 'border-red-500'
                        }`}>
                        <span className={`w-2 h-2 rounded-full ${item.menuItem.isVeg ? 'bg-green-500' : 'bg-red-500'
                          }`}></span>
                      </span>
                      <ShoppingBag className="w-8 h-8 text-slate-300" />
                    </div>

                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-800">{item.menuItem.name}</h3>
                      <p className="text-sm text-slate-500">{item.menuItem.category}</p>
                      {item.selectedVariant && (
                        <p className="text-xs text-slate-400 mt-1">{item.selectedVariant}</p>
                      )}
                      <p className="font-semibold text-slate-800 mt-2">₹{item.unitPrice}</p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex flex-col items-end justify-between">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      <div className="flex items-center gap-2 bg-slate-100 rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-2 text-slate-600 hover:text-[#e23744] transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-semibold text-slate-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-2 text-slate-600 hover:text-[#e23744] transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-6">
              <h3 className="font-semibold text-slate-800 mb-4">Order Summary</h3>

              {/* Coupon */}
              <div className="mb-6">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-green-50 p-3 rounded-xl border border-green-100">
                    <div className="flex items-center gap-2 text-green-700">
                      <div className="bg-green-100 p-1 rounded-full">
                        <Check className="w-3 h-3" />
                      </div>
                      <span className="text-sm font-semibold">{appliedCoupon.code}</span>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-slate-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Apply coupon"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#e23744]/20"
                        />
                      </div>
                      <button
                        onClick={() => applyCoupon()}
                        disabled={isApplyingCoupon || !couponCode}
                        className="px-4 py-3 bg-[#e23744] text-white rounded-xl text-sm font-medium hover:bg-[#c53030] transition-colors disabled:opacity-50"
                      >
                        Apply
                      </button>
                    </div>
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="text-sm text-[#e23744] font-medium hover:underline w-full text-left flex items-center gap-1"
                    >
                      <Tag size={14} /> View Available Offers
                    </button>
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 border-t border-slate-100 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="text-slate-800">₹{subtotal}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Coupon Discount</span>
                    <span>-₹{discount}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Delivery</span>
                  <span className="text-green-600">FREE</span>
                </div>
                <div className="flex justify-between font-semibold text-lg pt-3 border-t border-slate-100">
                  <span className="text-slate-800">Total</span>
                  <span className="text-slate-800">₹{total}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={proceedToCheckout}
                className="w-full mt-6 py-4 bg-[#e23744] text-white rounded-xl font-semibold hover:bg-[#c53030] transition-colors flex items-center justify-center gap-2"
              >
                Proceed to Checkout
                <ArrowRight className="w-5 h-5" />
              </button>

              {/* Delivery Info */}
              <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                <Clock className="w-4 h-4" />
                <span>Estimated delivery: 15-25 mins</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CouponListModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={(code) => applyCoupon(code)}
        canteenId={cart?.canteen?.id}
      />
    </div>
  );
}
