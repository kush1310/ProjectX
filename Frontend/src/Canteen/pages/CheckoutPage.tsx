import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, Wallet, Banknote, MapPin, Clock, 
  ChevronRight, Check, ArrowLeft, FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from '../../utils/toast';

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
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [couponDiscount] = useState(0);

  useEffect(() => {
    fetchCart();
  }, []);

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
      
      const orderData = {
        canteenId: cart.canteen?.id,
        menuItemIds: cart.items.map(item => item.menuItem.id),
        quantities: cart.items.map(item => item.quantity),
        paymentMethod,
        instructions: specialInstructions,
      };

      const res = await api.post('/orders', orderData);
      
      // Clear cart after successful order
      await api.delete('/cart/clear');
      
      toast.success('Order placed successfully!');
      navigate(`/order-confirmation/${res.data.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to place order');
    } finally {
      setIsPlacingOrder(false);
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
  const total = subtotal - couponDiscount;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/cart')}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="text-xl font-bold text-slate-800">Checkout</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pickup Location */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 shadow-sm"
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
                  { id: 'upi', label: 'UPI / QR', icon: Wallet, desc: 'Pay using any UPI app' },
                  { id: 'card', label: 'Card', icon: CreditCard, desc: 'Credit or Debit card' },
                  { id: 'cash', label: 'Cash', icon: Banknote, desc: 'Pay at counter' },
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                      paymentMethod === method.id
                        ? 'border-[#e23744] bg-[#e23744]/5'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className={`p-3 rounded-xl ${
                      paymentMethod === method.id ? 'bg-[#e23744]/10' : 'bg-slate-100'
                    }`}>
                      <method.icon className={`w-5 h-5 ${
                        paymentMethod === method.id ? 'text-[#e23744]' : 'text-slate-500'
                      }`} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className={`font-medium ${
                        paymentMethod === method.id ? 'text-[#e23744]' : 'text-slate-800'
                      }`}>{method.label}</p>
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
              className="bg-white rounded-2xl p-6 shadow-sm sticky top-24"
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
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="text-slate-800">₹{subtotal}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-₹{couponDiscount}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Delivery</span>
                  <span className="text-green-600">FREE</span>
                </div>
                <div className="flex justify-between font-semibold text-lg pt-3 border-t border-slate-100">
                  <span>Total</span>
                  <span>₹{total}</span>
                </div>
              </div>

              {/* Place Order Button */}
              <button
                onClick={placeOrder}
                disabled={isPlacingOrder}
                className="w-full mt-6 py-4 bg-[#e23744] text-white rounded-xl font-semibold hover:bg-[#c53030] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isPlacingOrder ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  <>
                    Place Order • ₹{total}
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <p className="text-xs text-slate-400 text-center mt-4">
                By placing this order, you agree to our Terms of Service
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
