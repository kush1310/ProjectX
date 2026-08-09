/**
 * Razorpay Service — API layer for payment operations.
 * 
 * Security:
 * - Uses existing `api` instance (JWT interceptor + payload encryption)
 * - NEVER stores/accesses key secret
 * - All amounts in paise (integer)
 */
import api from '../../utils/api';

// ──── Types ──────────────────────────────────────

export interface CreateOrderRequest {
  amount: number;        // in paise
  currency: string;      // "INR"
  foodOrderId: number;
  idempotencyKey: string;
}

export interface CreateOrderResponse {
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

export interface VerifyPaymentRequest {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface VerifyPaymentResponse {
  verified: boolean;
  orderId: string;
  status: string;
  message: string;
}

export interface PaymentStatusResponse {
  razorpayOrderId: string;
  status: string;
  razorpayPaymentId: string | null;
}

export interface PaymentAnalytics {
  totalRevenuePaise: number;
  successfulPayments: number;
  failedPayments: number;
  upiPercentage: number;
  dailyRevenue: Array<{ date: string; amountPaise: number }>;
}

export interface PaymentOrder {
  id: number;
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
  amountInPaise: number;
  currency: string;
  status: string;
  userId: number;
  foodOrderId: number | null;
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string | null;
}

// ──── Service Functions ──────────────────────────

/**
 * Create a Razorpay order via backend.
 */
export async function createOrder(amount: number, foodOrderId: number, idempotencyKey: string): Promise<CreateOrderResponse> {
  const res = await api.post('/payments/create-order', {
    amount,
    currency: 'INR',
    foodOrderId,
    idempotencyKey,
  });
  return res.data.data;
}

/**
 * Verify payment signature via backend.
 * NEVER verify on frontend — always delegate to backend.
 */
export async function verifyPayment(data: VerifyPaymentRequest): Promise<VerifyPaymentResponse> {
  const res = await api.post('/payments/verify', data);
  return res.data.data;
}

/**
 * Validate UPI VPA via backend.
 */
export async function validateVpa(vpa: string): Promise<{ valid: boolean; name: string }> {
  const res = await api.post('/payments/validate-vpa', { vpa });
  return res.data;
}

/**
 * Poll payment status (for QR/UPI collect flow).
 * Polls every 3s, up to maxAttempts times.
 */
export async function pollPaymentStatus(
  razorpayOrderId: string,
  maxAttempts: number = 20,
  onStatusUpdate?: (status: PaymentStatusResponse) => void
): Promise<PaymentStatusResponse | null> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await api.get(`/payments/status/${razorpayOrderId}`);
      const status: PaymentStatusResponse = res.data.data;
      onStatusUpdate?.(status);

      if (status.status === 'CAPTURED' || status.status === 'FAILED') {
        return status;
      }
    } catch {
      // Continue polling on error
    }

    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  return null;
}

/**
 * Fetch payment order history.
 */
export async function fetchOrderHistory(): Promise<PaymentOrder[]> {
  const res = await api.get('/payments/orders');
  return res.data.data;
}

/**
 * Fetch payment analytics (admin/vendor).
 */
export async function fetchAnalytics(): Promise<PaymentAnalytics> {
  const res = await api.get('/payments/analytics');
  return res.data.data;
}

/**
 * Dynamically load Razorpay Checkout.js script.
 * Only loads from official CDN — never bundled.
 */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    // Check if already loaded
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error('Failed to load Razorpay checkout.js');
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

/**
 * Generate a unique idempotency key.
 */
export function generateIdempotencyKey(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}
