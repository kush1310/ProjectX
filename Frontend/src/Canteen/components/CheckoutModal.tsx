/**
 * CheckoutModal — Full-screen animated payment modal.
 * 
 * Animations:
 * - AnimatePresence wrapping → slides up from bottom
 * - Order items stagger in 60ms apart
 * - Pay button morphs to spinner
 * - Success: checkmark SVG stroke animation
 * - Failure: shake animation
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Lock, Smartphone, CreditCard, Landmark, Wallet } from 'lucide-react';
import UpiPayment from './UpiPayment';
import PaymentStatus from './PaymentStatus';
import { type PaymentState, type PaymentResult } from '../utils/useRazorpay';

interface CartItem {
  id: number;
  menuItem: { id: number; name: string; price: number };
  quantity: number;
  unitPrice: number;
}

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  canteenName: string;
  paymentState: PaymentState;
  paymentError: string | null;
  paymentResult: PaymentResult | null;
  onPayNow: () => void;
  onRetry: () => void;
  onTrackOrder: () => void;
  selectedMethod: string;
  onMethodChange: (method: string) => void;
}

const paymentMethods = [
  { id: 'upi', label: 'UPI', icon: Smartphone, desc: 'Any UPI app' },
  { id: 'card', label: 'Card', icon: CreditCard, desc: 'Credit or Debit' },
  { id: 'netbanking', label: 'Net Banking', icon: Landmark, desc: 'All Indian banks' },
  { id: 'wallet', label: 'Wallets', icon: Wallet, desc: 'Paytm, PhonePe' },
];

export default function CheckoutModal({
  isOpen,
  onClose,
  cartItems,
  subtotal,
  discount,
  total,
  canteenName,
  paymentState,
  paymentError,
  paymentResult,
  onPayNow,
  onRetry,
  onTrackOrder,
  selectedMethod,
  onMethodChange,
}: CheckoutModalProps) {
  const [showUpiDetails, setShowUpiDetails] = useState(false);

  const isProcessing = paymentState === 'LOADING' || paymentState === 'CHECKOUT' || paymentState === 'VERIFYING';

  // Show PaymentStatus for success/failure
  if (paymentState === 'SUCCESS' || paymentState === 'FAILED') {
    return (
      <PaymentStatus
        isOpen={isOpen}
        status={paymentState === 'SUCCESS' ? 'success' : 'failed'}
        paymentResult={paymentResult}
        error={paymentError}
        onRetry={onRetry}
        onTrackOrder={onTrackOrder}
        onClose={onClose}
        total={total}
      />
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]"
            onClick={!isProcessing ? onClose : undefined}
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none">
            <motion.div
              initial={{ y: '100%', opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: '100%', opacity: 0, scale: 0.96 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="pointer-events-auto w-full max-h-[90vh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl sm:max-w-lg"
            >
            {/* Header */}
            <div className="sticky top-0 bg-white rounded-t-3xl border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Complete Payment</h2>
                <p className="text-sm text-slate-500">{canteenName}</p>
              </div>
              <button
                onClick={onClose}
                disabled={isProcessing}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-5">
              {/* Order Summary — staggered animation */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Order Summary</h3>
                <div className="space-y-2 max-h-36 overflow-y-auto">
                  {cartItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.06 }}
                      className="flex justify-between items-center text-sm"
                    >
                      <span className="text-slate-600">
                        <span className="inline-block w-5 h-5 bg-green-100 text-green-700 text-xs font-bold rounded text-center leading-5 mr-2">
                          {item.quantity}
                        </span>
                        {item.menuItem.name}
                      </span>
                      <span className="font-medium text-slate-800">₹{item.unitPrice * item.quantity}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Price breakdown */}
                <div className="mt-3 pt-3 border-t border-dashed border-slate-200 space-y-1.5">
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>Subtotal</span>
                    <span>₹{subtotal}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount</span>
                      <span>-₹{discount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>Delivery</span>
                    <span className="text-green-600">FREE</span>
                  </div>
                  <div className="flex justify-between font-bold text-base pt-2 border-t border-slate-200">
                    <span>Total</span>
                    <span className="text-[#e23744]">₹{total}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Payment Method</h3>
                <div className="grid grid-cols-2 gap-2">
                  {paymentMethods.map((method) => {
                    const Icon = method.icon;
                    return (
                    <button
                      key={method.id}
                      onClick={() => {
                        onMethodChange(method.id);
                        setShowUpiDetails(method.id === 'upi');
                      }}
                      disabled={isProcessing}
                      className={`relative p-3 rounded-xl border-2 transition-all text-left disabled:opacity-50 ${
                        selectedMethod === method.id
                          ? 'border-[#e23744] bg-[#e23744]/5 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mb-1 ${
                        selectedMethod === method.id ? 'text-[#e23744]' : 'text-slate-400'
                      }`} strokeWidth={1.5} />
                      <p className={`text-sm font-semibold ${
                        selectedMethod === method.id ? 'text-[#e23744]' : 'text-slate-700'
                      }`}>{method.label}</p>
                      <p className="text-xs text-slate-400">{method.desc}</p>
                      {selectedMethod === method.id && (
                        <motion.div
                          layoutId="payment-indicator"
                          className="absolute top-2 right-2 w-4 h-4 bg-[#e23744] rounded-full flex items-center justify-center"
                        >
                          <div className="w-1.5 h-1.5 bg-white rounded-full" />
                        </motion.div>
                      )}
                    </button>
                    );
                  })}
                </div>
              </div>

              {/* UPI Details Section */}
              <AnimatePresence>
                {showUpiDetails && selectedMethod === 'upi' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <UpiPayment />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Pay Button — morphs to spinner */}
              <motion.button
                onClick={onPayNow}
                disabled={isProcessing}
                whileTap={{ scale: 0.97 }}
                className="w-full py-4 bg-[#e23744] text-white rounded-2xl font-semibold text-base
                           hover:bg-[#c53030] transition-all disabled:opacity-70 flex items-center justify-center gap-3
                           shadow-lg shadow-[#e23744]/20"
              >
                <AnimatePresence mode="wait">
                  {isProcessing ? (
                    <motion.div
                      key="spinner"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>
                        {paymentState === 'LOADING' && 'Creating order...'}
                        {paymentState === 'CHECKOUT' && 'Waiting for payment...'}
                        {paymentState === 'VERIFYING' && 'Verifying payment...'}
                      </span>
                    </motion.div>
                  ) : (
                    <motion.span
                      key="pay"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      Pay ₹{total}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>

              {/* Trust badges */}
              <div className="flex items-center justify-center gap-4 text-xs text-slate-400 pb-2">
                <div className="flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Secured by Razorpay</span>
                </div>
                <div className="flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" />
                  <span>256-bit SSL</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </>
      )}
    </AnimatePresence>
  );
}
