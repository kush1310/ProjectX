/**
 * PaymentStatus — Success / Failure animated status screen.
 * 
 * Success:
 * - Green circle scales in (spring)
 * - Checkmark SVG strokes in (pathLength 0→1)
 * - Confetti burst (canvas-confetti)
 * - Order details + "Track Order" CTA
 * 
 * Failure:
 * - Red circle + X mark
 * - Shake animation
 * - "Try Again" + "Contact Support"
 */
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { type PaymentResult } from '../utils/useRazorpay';

interface PaymentStatusProps {
  isOpen: boolean;
  status: 'success' | 'failed';
  paymentResult: PaymentResult | null;
  error: string | null;
  onRetry: () => void;
  onTrackOrder: () => void;
  onClose: () => void;
  total: number;
}

export default function PaymentStatus({
  isOpen,
  status,
  paymentResult,
  error,
  onRetry,
  onTrackOrder,
  onClose,
  total,
}: PaymentStatusProps) {

  // Confetti on success
  useEffect(() => {
    if (status === 'success' && isOpen) {
      const timer = setTimeout(() => {
        // 3 confetti bursts
        const fire = (opts: confetti.Options) => {
          confetti({
            ...opts,
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#e23744', '#ff6b7a', '#22c55e', '#fbbf24', '#3b82f6'],
          });
        };
        fire({ angle: 60, origin: { x: 0.25, y: 0.6 } });
        setTimeout(() => fire({ angle: 90, origin: { x: 0.5, y: 0.6 } }), 150);
        setTimeout(() => fire({ angle: 120, origin: { x: 0.75, y: 0.6 } }), 300);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [status, isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Status Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center">
              {status === 'success' ? (
                <SuccessContent
                  paymentResult={paymentResult}
                  total={total}
                  onTrackOrder={onTrackOrder}
                  onClose={onClose}
                />
              ) : (
                <FailureContent
                  error={error}
                  onRetry={onRetry}
                  onClose={onClose}
                />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function SuccessContent({
  paymentResult,
  total,
  onTrackOrder,
  onClose,
}: {
  paymentResult: PaymentResult | null;
  total: number;
  onTrackOrder: () => void;
  onClose: () => void;
}) {
  return (
    <>
      {/* Animated circle + checkmark */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.1 }}
        className="w-24 h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6"
      >
        <svg
          viewBox="0 0 52 52"
          className="w-12 h-12"
        >
          <motion.path
            d="M14.1 27.2l7.1 7.2 16.7-16.8"
            fill="none"
            stroke="#22c55e"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.4, ease: 'easeInOut' }}
          />
        </svg>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Payment Successful
        </h2>
        <p className="text-slate-500 mb-4">
          Your order has been placed successfully
        </p>

        {/* Payment details */}
        <div className="bg-slate-50 rounded-2xl p-4 mb-6 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Amount Paid</span>
            <span className="font-semibold text-slate-800">₹{total}</span>
          </div>
          {paymentResult?.razorpayPaymentId && (
            <div className="flex justify-between">
              <span className="text-slate-500">Payment ID</span>
              <span className="font-mono text-xs text-slate-600">
                ...{paymentResult.razorpayPaymentId.slice(-8)}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-slate-500">Est. Delivery</span>
            <span className="font-medium text-green-600">15-25 mins</span>
          </div>
        </div>

        {/* CTAs */}
        <div className="space-y-3">
          <button
            onClick={onTrackOrder}
            className="w-full py-3.5 bg-[#e23744] text-white rounded-2xl font-semibold
                       hover:bg-[#c53030] transition-colors shadow-lg shadow-[#e23744]/20"
          >
            Track Order
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors"
          >
            Back to Menu
          </button>
        </div>
      </motion.div>
    </>
  );
}

function FailureContent({
  error,
  onRetry,
  onClose,
}: {
  error: string | null;
  onRetry: () => void;
  onClose: () => void;
}) {
  return (
    <>
      {/* Animated circle + X */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', damping: 12, stiffness: 200 }}
        className="w-24 h-24 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-6"
      >
        <motion.div
          animate={{ x: [0, -8, 8, -5, 5, 0] }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <svg viewBox="0 0 52 52" className="w-12 h-12">
            <motion.path
              d="M16 16l20 20"
              fill="none"
              stroke="#ef4444"
              strokeWidth="4"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            />
            <motion.path
              d="M36 16l-20 20"
              fill="none"
              stroke="#ef4444"
              strokeWidth="4"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.3, delay: 0.5 }}
            />
          </svg>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Payment Failed
        </h2>
        <p className="text-slate-500 mb-2">
          {error || 'Something went wrong with your payment.'}
        </p>
        <p className="text-xs text-slate-400 mb-6">
          Don't worry — no money was deducted from your account.
        </p>

        {/* CTAs */}
        <div className="space-y-3">
          <button
            onClick={onRetry}
            className="w-full py-3.5 bg-[#e23744] text-white rounded-2xl font-semibold
                       hover:bg-[#c53030] transition-colors shadow-lg shadow-[#e23744]/20"
          >
            Try Again
          </button>
          <a
            href="mailto:support@charusat.edu.in"
            className="block w-full py-3 text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors"
          >
            Contact Support
          </a>
          <button
            onClick={onClose}
            className="w-full py-2 text-slate-400 hover:text-slate-500 text-xs transition-colors"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </>
  );
}
