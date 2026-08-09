import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, Trash2, MapPin, Tag, X, ChevronRight, ShieldCheck, Info, Lock, BadgeCheck, ShoppingCart, Receipt, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import { toast } from "../../utils/toast";
import { applyCouponToCart, removeCouponFromCart, getActiveCoupons, Coupon } from "../utils/canteenStore";
import { getSession } from "../../utils/authStore";
import CouponListModal from "../components/CouponListModal";
import { useCouponWebSocket } from "../../hooks/useCouponWebSocket";
import CheckoutModal from "../components/CheckoutModal";
import { useRazorpay } from "../utils/useRazorpay";

interface CartItem {
  id: number;
  menuItem: { id: number; name: string; price: number; isVeg: boolean; category: string; imageUrl?: string; };
  quantity: number;
  unitPrice: number;
  selectedVariant?: string;
  specialInstructions?: string;
}
interface Cart {
  id: number;
  canteen?: { id: number; name: string; };
  items: CartItem[];
  totalAmount: number;
  discountAmount?: number;
  finalAmount?: number;
  appliedCoupon?: { couponCode: string; title?: string; discountValue?: number; discountType?: string; };
}

const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const FOOD_IMGS = [
  'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=200&q=80',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&q=80',
  'https://images.unsplash.com/photo-1567521464027-f127ff144326?w=200&q=80',
  'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=200&q=80',
];

const DOT_BG: React.CSSProperties = {
  backgroundImage: 'radial-gradient(circle, #e2e8f0 1.2px, transparent 1.2px)',
  backgroundSize: '20px 20px',
  backgroundColor: '#f8fafc',
};

function VegDot({ isVeg }: { isVeg?: boolean }) {
  return (
    <div className="w-4 h-4 border-2 border-green-600 rounded-sm flex items-center justify-center bg-white flex-shrink-0">
      <div className="w-2 h-2 rounded-full bg-green-600" />
    </div>
  );
}

function CartSkeleton() {
  return (
    <div className="min-h-screen" style={DOT_BG}>
      <div className="max-w-2xl mx-auto px-6 pt-8 space-y-5">
        {[1,2,3].map(i => (
          <div key={i} className="h-36 bg-white rounded-3xl animate-pulse border border-slate-100" />
        ))}
        <div className="h-48 bg-white rounded-3xl animate-pulse border border-slate-100" />
      </div>
    </div>
  );
}

const iv = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] } } };

export default function CartPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [removingId, setRemovingId] = useState<number | null>(null);

  // ── Checkout state (merged from CheckoutPage) ──
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [foodOrderId, setFoodOrderId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'cash'>('upi');

  const {
    initPayment,
    state: paymentState,
    error: paymentError,
    paymentResult,
    resetPayment,
  } = useRazorpay();

  const [canteenCoupons, setCanteenCoupons] = useState<Coupon[]>([]);

  const fetchCanteenCoupons = (cId?: number) => {
    if (!cId) return;
    getActiveCoupons(cId).then(setCanteenCoupons).catch(() => {});
  };

  useCouponWebSocket({
    canteenId: cart?.canteen?.id,
    onDeleted: (msg) => {
      fetchCanteenCoupons(cart?.canteen?.id);
      if (appliedCoupon?.code === msg.couponCode) { setAppliedCoupon(null); setCouponCode(""); toast.error("Applied coupon was removed"); fetchCart(); }
    },
    onToggled: (msg) => {
      fetchCanteenCoupons(cart?.canteen?.id);
      if (appliedCoupon?.code === msg.couponCode && !msg.isActive) { setAppliedCoupon(null); setCouponCode(""); toast.error("Coupon deactivated"); fetchCart(); }
    },
    onCreated: () => {
      fetchCanteenCoupons(cart?.canteen?.id);
      toast.success("New offer available!");
    },
  });

  useEffect(() => { fetchCart(); }, []);

  const fetchCart = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/cart");
      setCart(res.data);
      if (res.data?.canteen?.id) {
        fetchCanteenCoupons(res.data.canteen.id);
      }
      if (res.data.appliedCoupon) {
        setAppliedCoupon({ code: res.data.appliedCoupon.couponCode, discount: res.data.discountAmount || 0 });
        setCouponCode(res.data.appliedCoupon.couponCode);
      } else { setAppliedCoupon(null); setCouponCode(""); }
    } catch (err) { console.error("Failed to fetch cart:", err); }
    finally {
      setIsLoading(false);
      // Notify ClientLayout to refresh the cart badge count immediately — zero latency
      window.dispatchEvent(new CustomEvent('cartUpdated'));
    }
  };

  const updateQuantity = async (itemId: number, quantity: number) => {
    try { await api.put(`/cart/update/${itemId}`, { quantity }); fetchCart(); }
    catch { toast.error("Failed to update quantity"); }
  };

  const removeItem = async (itemId: number) => {
    setRemovingId(itemId);
    // Silent remove — the item slides out of the list giving clear visual feedback.
    try { await api.delete(`/cart/remove/${itemId}`); fetchCart(); }
    catch { toast.error("Failed to remove item"); }
    finally { setRemovingId(null); }
  };

  const clearCart = async () => {
    // Silent clear — cart becomes visibly empty; also notify ClientLayout badge immediately
    try {
      await api.delete("/cart/clear");
      setCart(null);
      window.dispatchEvent(new CustomEvent('cartUpdated'));
    }
    catch { toast.error("Failed to clear cart"); }
  };

  const applyCoupon = async (codeOverride?: string) => {
    const code = codeOverride || couponCode;
    if (!code?.trim()) return;
    if (!getSession()?.id) { toast.error("Please login to apply coupons"); return; }
    try {
      setIsApplyingCoupon(true);
      const result = await applyCouponToCart(code);
      if (result.success) {
        setAppliedCoupon({ code: code.toUpperCase(), discount: result.discount || 0 });
        toast.success(result.message);
        setCouponCode(code.toUpperCase());
        if (codeOverride) setIsModalOpen(false);
        fetchCart();
      } else { toast.error(result.message); setAppliedCoupon(null); }
    } catch { toast.error("Invalid coupon code"); setAppliedCoupon(null); }
    finally { setIsApplyingCoupon(false); }
  };

  const removeCoupon = async () => {
    try {
      const result = await removeCouponFromCart();
      if (result.success) { setAppliedCoupon(null); setCouponCode(""); toast.success("Coupon removed"); fetchCart(); }
      else toast.error(result.message);
    } catch { toast.error("Failed to remove coupon"); }
  };

  // Derived price values — declared before placeOrder so the function can read them
  const subtotal = cart?.totalAmount || 0;
  const discount = appliedCoupon?.discount ?? cart?.discountAmount ?? 0;
  const discountedBase = Math.max(0, subtotal - discount);
  const taxes = discountedBase > 0 ? Math.round(discountedBase * 0.05) : 0;
  const total = discountedBase + taxes;
  const savings = discount;

  /**
   * placeOrder
   *
   * Two-phase order flow:
   * Phase 1: Create the order record with paymentStatus=PENDING_PAYMENT.
   * Phase 2: Initiate Razorpay. On SUCCESS → clear cart and navigate.
   *          On DISMISS/CANCEL → delete the pending order from DB so it
   *          never appears to vendor or in customer history.
   * Cash orders skip Phase 2 entirely.
   *
   * @returns {void}
   */
  const placeOrder = async () => {
    if (!cart || cart.items.length === 0) { toast.error('Cart is empty'); return; }
    let createdOrderId: number | null = null;
    try {
      setIsPlacingOrder(true);
      const resolvedCanteenId = cart.canteen?.id || (cart as any).canteenId ||
        (cart.items.length > 0 ? (cart.items[0].menuItem as any).canteenId : undefined);
      const orderData = {
        canteenId: resolvedCanteenId,
        restaurantId: resolvedCanteenId,
        menuItemIds: cart.items.map(i => i.menuItem.id),
        quantities: cart.items.map(i => i.quantity),
        paymentMethod,
        instructions: specialInstructions,
        couponCode: appliedCoupon?.code,
      };
      const res = await api.post('/orders', orderData);
      createdOrderId = res.data.id;
      setFoodOrderId(createdOrderId);

      if (paymentMethod === 'upi' || paymentMethod === 'card') {
        setShowPaymentModal(true);
        const base = Math.max(0, subtotal - discount);
        const t = Math.round(base * 0.05);
        initPayment(Math.round((base + t) * 100), createdOrderId!, {
          /**
           * onPaymentSuccess — called after backend verification succeeds.
           * Clears cart, fires cartUpdated event, then navigates to history.
           */
          onSuccess: async () => {
            await api.delete('/cart/clear').catch(() => {});
            window.dispatchEvent(new CustomEvent('cartUpdated'));
          },
          /**
           * onPaymentDismissed — called when user closes Razorpay without paying.
           * Deletes the pending order from DB to prevent ghost entries in
           * vendor dashboard and customer order history.
           */
          onDismissed: async (orderId: number) => {
            try {
              await api.delete(`/orders/${orderId}/cancel-unpaid`);
            } catch (e) {
              console.warn('Could not delete unpaid order:', orderId);
            }
          },
        });
      } else {
        // Cash order: confirmed immediately, clear cart and navigate
        await api.delete('/cart/clear').catch(() => {});
        window.dispatchEvent(new CustomEvent('cartUpdated'));
        navigate('/customer/history');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to place order');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleTrackOrder = () => { setShowPaymentModal(false); navigate('/customer/history'); };

  const handlePaymentModalClose = () => {
    setShowPaymentModal(false);
    if (paymentState === 'SUCCESS') navigate('/customer/history');
    else resetPayment();
  };

  const handleRetry = () => {
    resetPayment();
    if (foodOrderId) {
      const base = Math.max(0, subtotal - discount);
      const t = Math.round(base * 0.05);
      initPayment(Math.round((base + t) * 100), foodOrderId);
    }
  };

  if (isLoading) return <CartSkeleton />;

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col" style={DOT_BG}>
        {/* Clean minimal header — Back button + page title only */}
        <div className="bg-white border-b border-slate-100 px-5 py-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)}
            className="p-1.5 rounded-xl hover:bg-slate-100 transition-colors -ml-1">
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </button>
          <span className="font-bold text-base text-slate-800">Your Cart</span>
        </div>
        <div className="flex-1 flex items-center justify-center px-6 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="text-center max-w-xs w-full"
          >
            {/* Zomato-style icon — clean circular background, no emoji */}
            <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center">
              <ShoppingCart className="w-10 h-10 text-rose-300" strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-800 mb-2 tracking-tight">Your cart is empty</h2>
            <p className="text-slate-400 text-sm mb-10 leading-relaxed">
              Looks like you haven't added<br />anything yet. Start exploring.
            </p>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/customer/menu")}
              className="w-full py-4 rounded-xl font-bold text-white text-base flex items-center justify-center gap-2 transition-all"
              style={{ background: '#e23744' }}
            >
              Browse Menu
              <ChevronRight className="w-5 h-5" />
            </motion.button>
            <p className="text-[11px] text-slate-300 mt-4 font-medium">Free campus delivery on all orders</p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-36" style={DOT_BG}>
      {/* ── HEADER ── */}
      <div className="bg-white/95 backdrop-blur-md sticky top-0 z-30 border-b border-slate-100">
        <div className="max-w-2xl mx-auto px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-slate-100 transition-colors -ml-1">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <span className="font-bold text-base text-slate-800">Your Cart</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-slate-300" />
            <span className="text-[10px] text-slate-400 font-semibold">Secure Checkout</span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 pt-6">
        {/* ── DELIVERY BADGE ── */}
        <motion.div variants={iv} initial="hidden" animate="visible"
          className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4 mb-6">
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-5 h-5 text-rose-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-black text-slate-700">Delivery to Campus</span>
              <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-black rounded-md border border-emerald-100 uppercase tracking-wider">Free</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">CHARUSAT, Changa · {cart.canteen?.name || 'Campus Canteen'}</p>
          </div>
          <span className="text-[11px] font-bold text-rose-500">Change</span>
        </motion.div>

        {/* ── SECTION HEADER ── */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-800">Your Order</h1>
            <span className="px-3 py-1 bg-rose-50 text-rose-500 text-sm font-bold rounded-full border border-rose-100">
              {cart.items.reduce((a, i) => a + i.quantity, 0)} items
            </span>
          </div>
          <button onClick={clearCart} className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-400 transition-colors font-semibold">
            <Trash2 className="w-3.5 h-3.5" /> Clear all
          </button>
        </div>

        {/* ── CART ITEMS ── */}
        <div className="space-y-3 mb-5">
          <AnimatePresence>
            {cart.items.map((item, idx) => (
              <motion.div key={item.id} layout variants={iv} initial="hidden" animate="visible"
                exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                transition={{ delay: idx * 0.05 }}
                className={`bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden transition-opacity ${removingId === item.id ? 'opacity-50' : ''}`}>
                <div className="flex gap-4 p-5">
                  {/* Image */}
                  <div className="w-28 h-28 rounded-2xl overflow-hidden flex-shrink-0 relative bg-slate-50">
                    <img
                      src={item.menuItem.imageUrl || FOOD_IMGS[idx % FOOD_IMGS.length]}
                      alt={item.menuItem.name}
                      className="w-full h-full object-cover"
                      onError={e => { (e.target as HTMLImageElement).src = FOOD_IMGS[idx % FOOD_IMGS.length]; }}
                    />
                    <div className="absolute top-1 left-1"><VegDot isVeg={item.menuItem.isVeg} /></div>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-bold text-slate-800 text-base leading-snug">{item.menuItem.name}</h3>
                      <div className="text-right flex-shrink-0">
                        <p className="font-black text-slate-800 text-lg">{fmt(item.unitPrice * item.quantity)}</p>
                        {item.quantity > 1 && <p className="text-xs text-slate-400">{fmt(item.unitPrice)} each</p>}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 mb-2">{item.menuItem.category}</p>

                    {/* Qty controls + remove */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center rounded-xl border border-slate-200 overflow-hidden">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-10 h-10 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors">
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-10 text-center text-base font-black text-slate-800">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-10 h-10 flex items-center justify-center text-white transition-colors"
                          style={{ background: 'linear-gradient(135deg, #e23744, #f97316)' }}>
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <button onClick={() => removeItem(item.id)}
                        className="text-slate-300 hover:text-red-400 transition-colors p-2 rounded-xl hover:bg-red-50">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* ── COUPON SECTION ── */}
        <div className="mb-5">
          {appliedCoupon ? (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <BadgeCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-black text-emerald-700 text-sm">{appliedCoupon.code}</span>
                  <span className="px-1.5 py-0.5 bg-emerald-200 text-emerald-700 text-[9px] font-black rounded uppercase">Applied!</span>
                </div>
              <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <BadgeCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  Saving <span className="font-black">{fmt(appliedCoupon.discount)}</span> on this order
                </p>
              </div>
              <button onClick={removeCoupon} className="text-emerald-400 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-50">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {canteenCoupons.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-rose-500" />
                    Available Canteen Offers (Tap to apply)
                  </p>
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {canteenCoupons.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => applyCoupon(c.couponCode)}
                        className="flex-shrink-0 bg-gradient-to-r from-rose-50 to-orange-50 hover:from-rose-100 hover:to-orange-100 border border-rose-200 rounded-xl px-3 py-2 text-left transition-all shadow-xs group"
                      >
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="font-black text-xs text-[#e23744] font-mono">{c.couponCode}</span>
                          <span className="text-[10px] font-extrabold text-rose-600 bg-white px-1.5 py-0.5 rounded shadow-2xs">
                            {c.discountType === 'PERCENTAGE' ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium truncate max-w-[180px]">
                          {c.title || c.description || 'Tap to apply'}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={() => setIsModalOpen(true)}
                className="w-full rounded-2xl border-2 border-dashed border-slate-200 bg-white p-4 flex items-center gap-3 hover:border-rose-300 hover:bg-rose-50/40 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-rose-50 transition-colors flex-shrink-0">
                  <Tag className="w-5 h-5 text-slate-400 group-hover:text-rose-400 transition-colors" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-bold text-slate-700">Browse All Coupons & Offers</p>
                  <p className="text-xs text-slate-400">View terms and details for all available codes</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-rose-400 transition-colors" />
              </button>
            </div>
          )}
        </div>

        {/* Manual coupon input + View Available Coupons button */}
        {!appliedCoupon && (
          <div className="space-y-2.5 mb-5">
            <div className="flex gap-2">
              <input
                value={couponCode}
                onChange={e => setCouponCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && applyCoupon()}
                placeholder="Enter coupon code"
                className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 transition-all uppercase tracking-wider"
              />
              <button onClick={() => applyCoupon()} disabled={isApplyingCoupon || !couponCode.trim()}
                className="px-5 py-3 rounded-xl font-bold text-sm text-white disabled:opacity-40 transition-all shadow-md shrink-0"
                style={{ background: 'linear-gradient(135deg, #e23744, #f97316)' }}>
                {isApplyingCoupon ? '...' : 'Apply'}
              </button>
            </div>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-[#e23744] font-bold text-xs flex items-center justify-between transition-all"
            >
              <span className="flex items-center gap-1.5">
                <Tag className="w-4 h-4" />
                View All Available Coupons & Campus Offers
              </span>
              <span className="text-[11px] font-black underline uppercase tracking-wider">Browse (% OFF)</span>
            </button>
          </div>
        )}

        {/* ── BILL SUMMARY ── */}
        <motion.div variants={iv} initial="hidden" animate="visible"
          className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-5">
          <div className="px-5 pt-5 pb-4">
            <div className="flex items-center gap-2 mb-5">
              <Receipt className="w-4.5 h-4.5 text-slate-500" />
              <h3 className="font-bold text-slate-800 text-base">Bill Summary</h3>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-base text-slate-500 font-medium">Item Total</span>
                <span className="text-base font-bold text-slate-800">{fmt(subtotal)}</span>
              </div>

              {discount > 0 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  className="flex justify-between items-center bg-emerald-50 -mx-1 px-3 py-2.5 rounded-xl border border-emerald-100">
                  <div className="flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-sm text-emerald-700 font-bold">Coupon Discount</span>
                    {appliedCoupon && <span className="text-[10px] bg-emerald-200 text-emerald-700 px-1.5 py-0.5 rounded font-black">{appliedCoupon.code}</span>}
                  </div>
                  <span className="text-sm font-black text-emerald-600">− {fmt(discount)}</span>
                </motion.div>
              )}

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-slate-500 font-medium">Delivery Fee</span>
                  <Info className="w-3 h-3 text-slate-300" />
                </div>
                <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">FREE</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-base text-slate-500 font-medium">GST & Charges (5%)</span>
                <span className="text-base font-bold text-slate-800">{fmt(taxes)}</span>
              </div>
            </div>

            {/* Divider */}
            <div className="my-4 border-t border-dashed border-slate-200" />

            {/* Total */}
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Grand Total</p>
                <p className="text-4xl font-black text-slate-800">{fmt(total)}</p>
              </div>
              {savings > 0 && (
                <div className="text-right">
                  <div className="inline-flex items-center gap-1.5 bg-emerald-500 text-white px-3 py-1.5 rounded-xl shadow-md">
                    <BadgeCheck className="w-3.5 h-3.5" />
                    <span className="text-xs font-black">Saving {fmt(savings)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── SPECIAL INSTRUCTIONS ── */}
        <div className="mb-6">
          <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block">Special Instructions</label>
          <textarea
            value={specialInstructions}
            onChange={e => setSpecialInstructions(e.target.value)}
            placeholder="E.g. Less spicy, no onion, extra sauce..."
            className="w-full bg-white border border-slate-200 rounded-2xl p-5 text-base text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 transition-all resize-none h-28 font-medium"
          />
        </div>

        {/* ── TRUST STRIP ── */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {[
            { icon: <ShieldCheck className="w-4 h-4 text-emerald-500" />, label: 'Safe Payment', sub: '256-bit SSL' },
            { icon: <Lock className="w-4 h-4 text-blue-500" />, label: 'Secure Data', sub: 'Encrypted' },
            { icon: <BadgeCheck className="w-4 h-4 text-amber-500" />, label: 'Verified', sub: 'CHARUSAT' },
          ].map(t => (
            <div key={t.label} className="bg-white rounded-2xl border border-slate-100 p-3 flex flex-col items-center text-center shadow-sm">
              {t.icon}
              <p className="text-xs font-black text-slate-700 mt-1.5 leading-tight">{t.label}</p>
              <p className="text-[10px] text-slate-400 font-medium">{t.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── FLOATING CHECKOUT ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40" style={{ background: 'linear-gradient(to top, white 70%, transparent)' }}>
        <div className="max-w-2xl mx-auto px-6 pb-8 pt-4">
          <motion.button whileTap={{ scale: 0.98 }}
            onClick={placeOrder}
            disabled={isPlacingOrder}
            className="w-full py-5 rounded-2xl font-black text-white text-lg shadow-2xl flex items-center justify-between px-8 transition-all disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #e23744 0%, #f97316 100%)', boxShadow: '0 8px 32px -8px rgba(226,55,68,0.5)' }}>
            <div>
              {isPlacingOrder ? (
                <span className="text-lg font-black">Placing Order...</span>
              ) : (
                <>
                  <span className="text-lg font-black">Proceed to Pay</span>
                  {savings > 0 && <p className="text-xs text-white/80 font-medium">Saving {fmt(savings)}</p>}
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isPlacingOrder ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span className="text-2xl font-black">{fmt(total)}</span>
                  <ChevronRight className="w-6 h-6" />
                </>
              )}
            </div>
          </motion.button>
          <p className="text-center text-[10px] text-slate-400 mt-2 font-medium flex items-center justify-center gap-1">
            <Lock className="w-3 h-3" /> Secured by CharusatNeeds · No hidden charges
          </p>
        </div>
      </div>

      <CouponListModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={(code) => applyCoupon(code)}
        canteenId={cart?.canteen?.id}
        orderTotal={cart?.totalAmount}
        cartItemIds={cart?.items?.map(i => i.menuItem.id)}
      />

      {/* CheckoutModal — opens directly from CartPage, no intermediate /checkout page */}
      <CheckoutModal
        isOpen={showPaymentModal}
        onClose={handlePaymentModalClose}
        cartItems={cart?.items || []}
        subtotal={subtotal}
        discount={discount}
        total={total}
        canteenName={cart?.canteen?.name || 'Canteen'}
        paymentState={paymentState}
        paymentError={paymentError}
        paymentResult={paymentResult}
        onPayNow={() => {
          if (foodOrderId) {
            const base = Math.max(0, subtotal - discount);
            const t = Math.round(base * 0.05);
            initPayment(Math.round((base + t) * 100), foodOrderId);
          }
        }}
        onRetry={handleRetry}
        onTrackOrder={handleTrackOrder}
        selectedMethod={paymentMethod}
        onMethodChange={(m) => setPaymentMethod(m as 'upi' | 'card' | 'cash')}
      />
    </div>
  );
}
