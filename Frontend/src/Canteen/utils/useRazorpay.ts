/**
 * useRazorpay — Custom hook managing the Razorpay payment lifecycle.
 * 
 * State machine: IDLE → LOADING → CHECKOUT → VERIFYING → SUCCESS | FAILED
 * 
 * Security:
 * - Key secret NEVER touched or stored
 * - Payment verification ALWAYS goes through backend
 * - No payment data stored in localStorage/sessionStorage
 */
import { useState, useCallback, useRef } from 'react';
import {
  createOrder,
  verifyPayment,
  loadRazorpayScript,
  generateIdempotencyKey,
  type CreateOrderResponse,
} from './razorpayService';
import { getSession } from '../../utils/authStore';

// ──── Types ──────────────────────────────────────

export type PaymentState = 'IDLE' | 'LOADING' | 'CHECKOUT' | 'VERIFYING' | 'SUCCESS' | 'FAILED';

export interface PaymentResult {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  verified: boolean;
  status: string;
}

/**
 * PaymentCallbacks
 *
 * Optional lifecycle hooks passed into initPayment.
 * onSuccess  — called after server-side verification confirms payment captured.
 * onDismissed — called when user closes the Razorpay modal without completing
 *               payment; receives the foodOrderId so the caller can delete the
 *               pending order record from the database.
 */
export interface PaymentCallbacks {
  onSuccess?:   () => Promise<void> | void;
  onDismissed?: (foodOrderId: number) => Promise<void> | void;
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayErrorResponse {
  error?: {
    code?: string;
    description?: string;
    reason?: string;
  };
}

// ──── Error Code Mapping ─────────────────────────

const ERROR_MESSAGES: Record<string, string> = {
  'BAD_REQUEST_ERROR': 'UPI ID not found. Please check and retry.',
  'VPA_NOT_FOUND': 'UPI ID not found. Please check and retry.',
  'PAYMENT_CANCELLED': 'Payment was cancelled. Try again?',
  'PAYMENT_TIMEOUT': 'Session timed out. Please retry.',
  'INSUFFICIENT_FUNDS': 'Insufficient UPI balance.',
  'SERVER_ERROR': 'We hit a snag. Your money is safe.',
  'NETWORK_ERROR': 'Network issue. Please check your connection.',
  'GATEWAY_ERROR': 'Payment gateway error. Please try again.',
};

function mapErrorMessage(code?: string, description?: string): string {
  if (code && ERROR_MESSAGES[code]) return ERROR_MESSAGES[code];
  if (description) return description;
  return 'Payment failed. Please try again.';
}

// ──── Hook ───────────────────────────────────────

export function useRazorpay() {
  const [state, setState] = useState<PaymentState>('IDLE');
  const [error, setError] = useState<string | null>(null);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const razorpayInstanceRef = useRef<any>(null);

  /**
   * Configure and open the Razorpay checkout modal.
   * UPI is set as the DEFAULT payment method.
   */
  const openRazorpayCheckout = useCallback((
    orderData: CreateOrderResponse,
    foodOrderId: number,
    callbacks?: PaymentCallbacks,
  ) => {
    const session = getSession();
    const user = session?.user || session;

    const options: any = {
      key: orderData.keyId,
      amount: orderData.amount,
      currency: orderData.currency,
      order_id: orderData.razorpayOrderId,
      name: 'CharusatNeeds',
      description: 'Campus Food Order — Secure Payment',
      image: '/logo.png',
      prefill: {
        name: user?.fullName || user?.full_name || '',
        email: user?.email || '',
        contact: user?.mobile || '',
      },
      notes: {
        platform: 'CharusatNeeds',
        university: 'CHARUSAT',
      },
      config: {
        display: {
          blocks: {
            utib: {
              name: 'Pay via UPI',
              instruments: [
                { method: 'upi', flows: ['qr', 'intent', 'collect'] }
              ],
            },
            other: {
              name: 'Other Payment Methods',
              instruments: [
                { method: 'card' },
                { method: 'netbanking' },
                { method: 'wallet' },
              ],
            },
          },
          sequence: ['block.utib', 'block.other'],
          preferences: { show_default_blocks: false },
        },
      },
      modal: {
        ondismiss: async () => {
          setState('FAILED');
          setError('Payment was cancelled.');
          // Cleanup: delete the pending order from backend if caller provided handler
          if (callbacks?.onDismissed) {
            await callbacks.onDismissed(foodOrderId);
          }
        },
        confirm_close: true,
        escape: false,
        animation: true,
        backdropclose: false,
      },
      handler: async (response: RazorpayResponse) => {
        // Payment completed — verify on backend
        setState('VERIFYING');
        try {
          const verification = await verifyPayment({
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });

          if (verification.verified) {
            setPaymentResult({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              verified: true,
              status: 'CAPTURED',
            });
            setState('SUCCESS');
            // Trigger caller-supplied post-success actions (cart clear, navigation)
            if (callbacks?.onSuccess) {
              await callbacks.onSuccess();
            }
          } else {
            setError(verification.message || 'Payment verification failed.');
            setState('FAILED');
          }
        } catch (err: any) {
          console.error('Verification error:', err);
          setError('Payment verification failed. Contact support if amount was deducted.');
          setState('FAILED');
        }
      },
      theme: {
        color: '#1e293b',       // Slate-800 — modern dark branded panel
        backdrop_color: 'rgba(15,23,42,0.65)', // Deep backdrop
        hide_topbar: false,
      },
    };

    const rzp = new (window as any).Razorpay(options);

    rzp.on('payment.failed', (response: RazorpayErrorResponse) => {
      const errCode = response.error?.code || response.error?.reason;
      const errDesc = response.error?.description;
      setError(mapErrorMessage(errCode, errDesc));
      setState('FAILED');
    });

    razorpayInstanceRef.current = rzp;
    rzp.open();
  }, []);

  /**
   * Initiate the full payment flow.
   * @param amountPaise - Amount in paise (e.g., 10000 = ₹100)
   * @param foodOrderId - The food order ID to link payment to
   */
  const initPayment = useCallback(async (
    amountPaise: number,
    foodOrderId: number,
    callbacks?: PaymentCallbacks,
  ) => {
    try {
      setState('LOADING');
      setError(null);
      setPaymentResult(null);

      // 1. Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load payment gateway. Please refresh and try again.');
      }

      // 2. Create order on backend
      const idempotencyKey = generateIdempotencyKey();
      const orderData = await createOrder(amountPaise, foodOrderId, idempotencyKey);

      // 3. Open Razorpay checkout
      setState('CHECKOUT');
      openRazorpayCheckout(orderData, foodOrderId, callbacks);

    } catch (err: any) {
      console.error('Payment init error:', err);
      setError(err.message || 'Payment initialization failed.');
      setState('FAILED');
    }
  }, [openRazorpayCheckout]);

  /**
   * Reset payment state — allows retrying.
   */
  const resetPayment = useCallback(() => {
    setState('IDLE');
    setError(null);
    setPaymentResult(null);
    razorpayInstanceRef.current = null;
  }, []);

  return {
    initPayment,
    state,
    error,
    paymentResult,
    resetPayment,
  };
}
