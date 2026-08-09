import { useEffect, useCallback, useRef } from 'react';
import { useWebSocket } from './useWebSocket';

/**
 * Coupon-specific WebSocket hook.
 * Subscribes to /topic/coupons and optionally /topic/coupons/{canteenId}
 * for real-time coupon CRUD events.
 *
 * Event types: COUPON_CREATED, COUPON_UPDATED, COUPON_DELETED,
 *              COUPON_TOGGLED, COUPON_ARCHIVED, COUPON_RESTORED
 */
export type CouponWsEvent =
  | 'COUPON_CREATED'
  | 'COUPON_UPDATED'
  | 'COUPON_DELETED'
  | 'COUPON_TOGGLED'
  | 'COUPON_ARCHIVED'
  | 'COUPON_RESTORED';

export interface CouponWsMessage {
  type: CouponWsEvent;
  id?: string;
  couponCode?: string;
  title?: string;
  description?: string;
  couponType?: string;
  discountType?: string;
  discountValue?: number;
  isActive?: boolean;
  isArchived?: boolean;
  canteenId?: number;
  startTime?: string;
  endTime?: string;
  minOrderValue?: number;
  maxDiscountCap?: number;
  usageLimitTotal?: number;
  usageLimitPerUser?: number;
  timestamp?: string;
}

interface UseCouponWebSocketOptions {
  /** Optional canteen ID for per-canteen subscription */
  canteenId?: number;
  /** Called on any coupon event */
  onEvent?: (msg: CouponWsMessage) => void;
  /** Called specifically when a coupon is created */
  onCreated?: (msg: CouponWsMessage) => void;
  /** Called specifically when a coupon is updated */
  onUpdated?: (msg: CouponWsMessage) => void;
  /** Called specifically when a coupon is deleted */
  onDeleted?: (msg: CouponWsMessage) => void;
  /** Called when a coupon is toggled active/inactive */
  onToggled?: (msg: CouponWsMessage) => void;
  /** Called when a coupon is archived */
  onArchived?: (msg: CouponWsMessage) => void;
  /** Called when a coupon is restored */
  onRestored?: (msg: CouponWsMessage) => void;
}

export const useCouponWebSocket = (options: UseCouponWebSocketOptions = {}) => {
  const { isConnected, subscribe } = useWebSocket();
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const handleMessage = useCallback((msg: CouponWsMessage) => {
    const opts = optionsRef.current;

    // Fire generic handler
    opts.onEvent?.(msg);

    // Fire type-specific handler
    switch (msg.type) {
      case 'COUPON_CREATED':
        opts.onCreated?.(msg);
        break;
      case 'COUPON_UPDATED':
        opts.onUpdated?.(msg);
        break;
      case 'COUPON_DELETED':
        opts.onDeleted?.(msg);
        break;
      case 'COUPON_TOGGLED':
        opts.onToggled?.(msg);
        break;
      case 'COUPON_ARCHIVED':
        opts.onArchived?.(msg);
        break;
      case 'COUPON_RESTORED':
        opts.onRestored?.(msg);
        break;
    }
  }, []);

  useEffect(() => {
    if (!isConnected) return;

    // Subscribe to global coupon events
    const globalSub = subscribe('/topic/coupons', handleMessage);

    // Subscribe to canteen-specific events if canteenId provided
    let canteenSub: ReturnType<typeof subscribe> = null;
    if (optionsRef.current.canteenId) {
      canteenSub = subscribe(
        `/topic/coupons/${optionsRef.current.canteenId}`,
        handleMessage
      );
    }

    return () => {
      globalSub?.unsubscribe();
      canteenSub?.unsubscribe();
    };
  }, [isConnected, subscribe, handleMessage]);

  return { isConnected };
};
