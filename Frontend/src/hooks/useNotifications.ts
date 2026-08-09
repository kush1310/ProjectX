/**
 * useNotifications — In-App Notification State Manager
 *
 * Maintains a capped list of in-app notifications (max 20) that are pushed
 * in real-time via WebSocket order-status updates. Notifications are stored
 * in module-level state so they persist across re-renders and route changes.
 *
 * A notification is created when:
 *  - An order status changes (CONFIRMED, PREPARING, READY, COMPLETED, CANCELLED)
 *  - A coupon event occurs (via /topic/coupon/events)
 *
 * Each notification contains:
 *  - id        {string}  — unique identifier
 *  - message   {string}  — human-readable message
 *  - type      {string}  — 'order' | 'coupon' | 'system'
 *  - read      {boolean} — whether the user has opened the dropdown
 *  - createdAt {Date}    — for relative time display
 */

import { useState, useCallback, useEffect, useRef } from 'react';

export interface AppNotification {
  id:        string;
  message:   string;
  type:      'order' | 'coupon' | 'system';
  read:      boolean;
  createdAt: Date;
  icon?:     string; // emoji icon for quick visual scan
}

const MAX_NOTIFICATIONS = 20;

// Module-level store — survives re-renders
let globalNotifications: AppNotification[] = [];
let globalListeners: Array<(n: AppNotification[]) => void> = [];

function notifyAll() {
  globalListeners.forEach(fn => fn([...globalNotifications]));
}

function addNotification(partial: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) {
  const notification: AppNotification = {
    ...partial,
    id:        crypto.randomUUID(),
    read:      false,
    createdAt: new Date(),
  };
  globalNotifications = [notification, ...globalNotifications].slice(0, MAX_NOTIFICATIONS);
  notifyAll();
}

export function pushNotification(partial: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) {
  addNotification(partial);
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([...globalNotifications]);

  useEffect(() => {
    const listener = (updated: AppNotification[]) => setNotifications(updated);
    globalListeners.push(listener);
    return () => {
      globalListeners = globalListeners.filter(l => l !== listener);
    };
  }, []);

  const markAllRead = useCallback(() => {
    globalNotifications = globalNotifications.map(n => ({ ...n, read: true }));
    notifyAll();
  }, []);

  const clearAll = useCallback(() => {
    globalNotifications = [];
    notifyAll();
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications, unreadCount, markAllRead, clearAll };
}

/**
 * ORDER_STATUS_MESSAGES
 *
 * Maps backend OrderStatus enum values to human-readable notification messages
 * and corresponding emoji icons for display in the notification dropdown.
 */
export const ORDER_STATUS_MESSAGES: Record<string, { message: string; icon: string }> = {
  CONFIRMED:  { message: 'Your order has been confirmed by the canteen.',      icon: '✓'   },
  PREPARING:  { message: 'The canteen is now preparing your order.',           icon: '🍳'  },
  READY:      { message: 'Your order is ready for pickup!',                    icon: '✓'   },
  COMPLETED:  { message: 'Order completed. Enjoy your meal!',                  icon: '★'   },
  CANCELLED:  { message: 'Your order was cancelled. A refund has been initiated.', icon: '✕' },
};
