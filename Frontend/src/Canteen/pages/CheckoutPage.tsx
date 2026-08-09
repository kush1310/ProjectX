import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard, Wallet, Banknote, MapPin, Clock,
  ChevronRight, Check, ArrowLeft, FileText, Tag, BadgeCheck, Lock
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from '../../utils/toast';
import { validateCoupon, CartItemInfo } from '../utils/canteenStore';
import { getSession } from '../../utils/authStore';
import CheckoutModal from '../components/CheckoutModal';
import { useRazorpay } from '../utils/useRazorpay';
import CharusatCampusMap, { CampusLocation } from '../components/CharusatCampusMap';

interface Cart {
  id: number;
  canteen?: { id: number; name: string; location: string };
  items: Array<{
    id: number;
    menuItem: { id: number; name: string; price: number };
    quantity: number;
    unitPrice: number;
  }>;
  totalAmount: number;
}

type PaymentMethod = 'upi' | 'card' | 'cash';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { couponCode } = location.state || {};

  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [appliedCode, setAppliedCode] = useState<string | null>(null);

  // Razorpay payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [foodOrderId, setFoodOrderId] = useState<number | null>(null);

  const {
    initPayment,
    state: paymentState,
    error: paymentError,
    paymentResult,
    resetPayment,
  } = useRazorpay();

  useEffect(() => {
    fetchCart();
  }, []);

  useEffect(() => {
    if (cart && couponCode) {
      validateCouponOnLoad();
    }
  }, [cart, couponCode]);

  const validateCouponOnLoad = async () => {
    const session = getSession();
    if (!session?.id || !cart) return;

    const cartItemsInfo: CartItemInfo[] = cart.items.map(item => ({
      menuItemId: item.menuItem.id,
      itemName: item.menuItem.name,
      quantity: item.quantity,
      price: item.unitPrice
    }));

    try {
      const result = await validateCoupon(couponCode, cart.totalAmount, session.id, cartItemsInfo);
      if (result.valid) {
        setCouponDiscount(result.discountAmount);
        setAppliedCode(result.couponCode || couponCode);
        toast.success("Coupon applied successfully");
      } else {
        toast.error(`Coupon invalid: ${result.message}`);
      }
    } catch (error) {
      console.error("Coupon validation failed", error);
    }
  };

  const fetchCart = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/cart');
      if (!res.data || res.data.items?.length === 0) {
        navigate('/cart');
        return;
      }
      setCart(res.data);
    } catch (err) {
      toast.error('Failed to load cart');
      navigate('/cart');
    } finally {
      setIsLoading(false);
    }
  };

  const placeOrder = async () => {
    if (!cart || cart.items.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    try {
      setIsPlacingOrder(true);

      const resolvedCanteenId = cart.canteen?.id || (cart as any).canteenId ||
        (cart.items.length > 0 ? (cart.items[0].menuItem as any).canteenId : undefined);

      const orderData = {
        canteenId: resolvedCanteenId,
        restaurantId: resolvedCanteenId,
        menuItemIds: cart.items.map(item => item.menuItem.id),
        quantities: cart.items.map(item => item.quantity),
        paymentMethod,
        instructions: specialInstructions,
        couponCode: appliedCode
      };

      // Step 1: Create the food order (always — regardless of payment method)
      const res = await api.post('/orders', orderData);
      const createdOrderId = res.data.id;

      // Step 2: If paying online (UPI/Card), trigger Razorpay flow
      if (paymentMethod === 'upi' || paymentMethod === 'card') {
        setFoodOrderId(createdOrderId);
        setShowPaymentModal(true);

        const discountedBase = Math.max(0, cart.totalAmount - couponDiscount);
        const taxes = Math.round(discountedBase * 0.05);
        const finalTotal = discountedBase + taxes;
        const amountInPaise = Math.round(finalTotal * 100);

        // Initiate Razorpay payment
        initPayment(amountInPaise, createdOrderId);

      } else {
        // Cash payment — direct flow (existing behavior)
        await api.delete('/cart/clear');
        toast.success('Order placed successfully!');
        navigate('/customer/history');
      }

    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to place order');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Handle successful Razorpay payment
  useEffect(() => {
    if (paymentState === 'SUCCESS' && foodOrderId) {
      // Clear cart after successful payment
      api.delete('/cart/clear').catch(() => {});
    }
  }, [paymentState, foodOrderId]);

  const handleTrackOrder = () => {
    setShowPaymentModal(false);
    navigate('/customer/history');
  };

  const handlePaymentModalClose = () => {
    setShowPaymentModal(false);
    if (paymentState === 'SUCCESS') {
      navigate('/customer/history');
    } else {
      resetPayment();
    }
  };

  const handleRetry = () => {
    resetPayment();
    if (foodOrderId && cart) {
      const discountedBase = Math.max(0, cart.totalAmount - couponDiscount);
      const taxes = Math.round(discountedBase * 0.05);
      const finalTotal = discountedBase + taxes;
      const amountInPaise = Math.round(finalTotal * 100);
      initPayment(amountInPaise, foodOrderId);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#e23744] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!cart) return null;

  const subtotal = cart.totalAmount;
  const discountedBase = Math.max(0, subtotal - couponDiscount);
  const taxes = discountedBase > 0 ? Math.round(discountedBase * 0.05) : 0;
  const total = discountedBase + taxes;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => navigate('/cart')}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="text-lg sm:text-xl font-bold text-slate-800">Checkout</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pickup Location */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm"
            >
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#e23744]" />
                Pickup Location
              </h3>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="font-medium text-slate-800">{cart.canteen?.name}</p>
                <p className="text-sm text-slate-500 mt-1">{cart.canteen?.location || 'CSPIT Building, Ground Floor'}</p>
                <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                  <Clock className="w-4 h-4" />
                  <span>Ready in 15-25 mins</span>
                </div>
              </div>
            </motion.div>

            {/* CHARUSAT Campus Map Delivery Location Selector */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-white rounded-2xl p-6 shadow-sm overflow-hidden"
            >
              <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#e23744]" />
                CHARUSAT Campus Live Drop-off Location
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Select your building/hostel drop-off point on the CHARUSAT Changa campus map for live delivery tracking.
              </p>
              <CharusatCampusMap
                mode="select"
                height="h-64"
                canteenName={cart.canteen?.name || 'Canteen Outlet'}
                onSelectLocation={(loc) => {
                  toast.success(`Delivery point set to ${loc.name}`);
                }}
              />
            </motion.div>

            {/* Payment Method */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-sm"
            >
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-[#e23744]" />
                Payment Method
              </h3>
              <div className="space-y-3">
                {[
                  { id: 'upi', label: 'UPI / QR', icon: Wallet, desc: 'Pay using any UPI app', badge: 'Recommended' },
                  { id: 'card', label: 'Card', icon: CreditCard, desc: 'Credit or Debit card' },
                  { id: 'cash', label: 'Cash', icon: Banknote, desc: 'Pay at counter' },
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${paymentMethod === method.id
                        ? 'border-[#e23744] bg-[#e23744]/5'
                        : 'border-slate-200 hover:border-slate-300'
                      }`}
                  >
                    <div className={`p-3 rounded-xl ${paymentMethod === method.id ? 'bg-[#e23744]/10' : 'bg-slate-100'
                      }`}>
                      <method.icon className={`w-5 h-5 ${paymentMethod === method.id ? 'text-[#e23744]' : 'text-slate-500'
                        }`} />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <p className={`font-medium ${paymentMethod === method.id ? 'text-[#e23744]' : 'text-slate-800'
                          }`}>{method.label}</p>
                        {'badge' in method && method.badge && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase">
                            {method.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">{method.desc}</p>
                    </div>
                    {paymentMethod === method.id && (
                      <Check className="w-5 h-5 text-[#e23744]" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Special Instructions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-6 shadow-sm"
            >
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#e23744]" />
                Special Instructions
              </h3>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="Any special requests? (e.g., extra spicy, no onions, etc.)"
                rows={3}
                className="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#e23744]/20 resize-none"
              />
            </motion.div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm lg:sticky lg:top-24"
            >
              <h3 className="font-semibold text-slate-800 mb-4">Order Summary</h3>

              {/* Items */}
              <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-slate-600">
                      {item.quantity}x {item.menuItem.name}
                    </span>
                    <span className="text-slate-800 font-medium">
                      ₹{item.unitPrice * item.quantity}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2.5 border-t border-slate-100 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Item Total</span>
                  <span className="text-slate-800 font-medium">₹{subtotal}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" /> Coupon Discount
                    </span>
                    <span className="text-emerald-600 font-bold">− ₹{couponDiscount}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Delivery</span>
                  <span className="text-emerald-600 font-semibold">FREE</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">GST &amp; Charges (5%)</span>
                  <span className="text-slate-800 font-medium">₹{taxes}</span>
                </div>
                <div className="flex justify-between font-black text-xl pt-3 border-t-2 border-slate-100">
                  <span className="text-slate-800">Grand Total</span>
                  <span style={{ color: '#e23744' }}>₹{total}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="text-center">
                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full border border-emerald-100">
                      <BadgeCheck className="w-3.5 h-3.5" /> Saving ₹{couponDiscount} on this order
                    </span>
                  </div>
                )}
              </div>

              {/* Place Order Button */}
              <button
                onClick={placeOrder}
                disabled={isPlacingOrder}
                className="w-full mt-6 py-4 text-white rounded-xl font-black text-base hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg"
                style={{ background: 'linear-gradient(135deg, #e23744, #f97316)', boxShadow: '0 6px 24px -6px rgba(226,55,68,0.45)' }}
              >
                {isPlacingOrder ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>{paymentMethod === 'cash' ? 'Place Order' : 'Pay Securely'}</span>
                    <span className="font-black">₹{total}</span>
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>

              {paymentMethod !== 'cash' && (
                <p className="text-xs text-slate-400 text-center mt-3 flex items-center justify-center gap-1">
                  <Lock className="w-3 h-3" /> Secured by Razorpay
                </p>
              )}

              <p className="text-xs text-slate-400 text-center mt-2">
                By placing this order, you agree to our Terms of Service
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Razorpay Payment Modal */}
      <CheckoutModal
        isOpen={showPaymentModal}
        onClose={handlePaymentModalClose}
        cartItems={cart?.items || []}
        subtotal={subtotal}
        discount={couponDiscount}
        total={total}
        canteenName={cart?.canteen?.name || 'Canteen'}
        paymentState={paymentState}
        paymentError={paymentError}
        paymentResult={paymentResult}
        onPayNow={() => {
          if (foodOrderId && cart) {
            const base = Math.max(0, cart.totalAmount - couponDiscount);
            const t = Math.round(base * 0.05);
            initPayment(Math.round((base + t) * 100), foodOrderId);
          }
        }}
        onRetry={handleRetry}
        onTrackOrder={handleTrackOrder}
        selectedMethod={paymentMethod}
        onMethodChange={(m) => setPaymentMethod(m as PaymentMethod)}
      />
    </div>
  );
}
