/**
 * ClientLayout — Zomato-Inspired Navigation Wrapper
 *
 * Desktop: sticky top navbar with logo, nav links, profile dropdown.
 * Mobile:  sticky top bar (logo + cart + profile icon) +
 *          fixed bottom navigation bar (Home / History / Cart / Profile)
 *          following Zomato's mobile UX pattern — no hamburger sidebar.
 *
 * Active order toast renders above the bottom nav when orders are live.
 */

import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useIdleTimeout } from '@/hooks/useIdleTimeout';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Clock,
  User,
  ChevronDown,
  LogOut,
  ShoppingCart,
  Shield,
  ChevronRight,
  Bell,
  Bookmark,
  Tag,
} from 'lucide-react';
import { getSession, logout } from '@/utils/authStore';
import api from '@/utils/api';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useNotifications, pushNotification, ORDER_STATUS_MESSAGES } from '@/hooks/useNotifications';
import LogoutConfirmModal from './LogoutConfirmModal';

interface ClientLayoutProps {
  children: React.ReactNode;
}

/** Desktop nav items — rendered in top bar on md+ screens. */
const desktopNavItems = [
  { label: 'Home',           path: '/customer/dashboard', icon: Home  },
  { label: 'Offers & Deals', path: '/customer/offers',    icon: Tag   },
  { label: 'Current Orders', path: '/customer/history',   icon: Clock },
];

/**
 * Mobile bottom nav items — strictly 4 tabs per 2026 design reference.
 * Cart is removed from bottom navigation and positioned exclusively in the top header.
 */
const mobileBottomNav = [
  { label: 'Home',      path: '/customer/dashboard', icon: Home  },
  { label: 'Offers',    path: '/customer/offers',    icon: Tag   },
  { label: 'Orders',    path: '/customer/history',   icon: Clock },
  { label: 'Profile',   path: '/customer/profile',   icon: User  },
];

interface ActiveOrder {
  id: number;
  orderNumber: string;
  status: string;
  paymentStatus?: string;
  canteen?: { name: string };
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  useIdleTimeout(); // OWASP: auto-logout after 15 min inactivity

  const location  = useLocation();
  const navigate  = useNavigate();
  const session   = getSession();

  const [showDropdown,      setShowDropdown]      = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showLogoutModal,   setShowLogoutModal]   = useState(false);
  const [activeOrders,      setActiveOrders]      = useState<ActiveOrder[]>([]);
  const [cartCount,         setCartCount]         = useState(0);

  const { notifications, unreadCount, markAllRead, clearAll } = useNotifications();

  const dropdownRef  = useRef<HTMLDivElement>(null);
  const notifRef     = useRef<HTMLDivElement>(null);

  /* ── Derived display values ── */
  const userName    = session?.fullName || session?.email?.split('@')[0] || 'User';
  const userInitial = userName.charAt(0).toUpperCase();

  /* ── Fetch active orders (polling every 30 s) ── */
  const fetchActive = async () => {
    try {
      const res    = await api.get('/orders/my-orders');
      const orders = Array.isArray(res.data) ? res.data : [];
      setActiveOrders(
        orders.filter((o: ActiveOrder) =>
          // Exclude ghost orders — unpaid Razorpay sessions
          o.paymentStatus !== 'PENDING_PAYMENT' &&
          ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'].includes(o.status)
        )
      );
    } catch { /* silently fail */ }
  };

  /* ── Fetch cart item count for mobile badge ── */
  const fetchCartCount = async () => {
    try {
      const res   = await api.get('/cart');
      const items = res.data?.items || [];
      // Explicitly set to 0 on empty — prevents ghost badge after cart clear
      setCartCount(items.reduce((acc: number, i: any) => acc + (i.quantity || 1), 0));
    } catch { setCartCount(0); }
  };

  useEffect(() => {
    fetchActive();
    fetchCartCount();
    const ordersInterval = setInterval(fetchActive, 30000);

    // Zero-latency cart badge: CartPage dispatches 'cartUpdated' on every
    // add / remove / quantity change / clear / successful checkout.
    // This replaces polling entirely — badge reflects reality immediately.
    const onCartUpdated = () => fetchCartCount();
    window.addEventListener('cartUpdated', onCartUpdated);

    return () => {
      clearInterval(ordersInterval);
      window.removeEventListener('cartUpdated', onCartUpdated);
    };
  }, []);

  /* —— WebSocket: refresh active orders in real-time + push in-app notifications —— */
  const { isConnected, subscribe } = useWebSocket();

  useEffect(() => {
    if (!isConnected || !session?.id) return;
    const sub = subscribe(`/topic/customer/${session.id}`, (payload: any) => {
      fetchActive();
      fetchCartCount();
      // Push an in-app notification if the payload carries an order status update
      if (payload?.status && ORDER_STATUS_MESSAGES[payload.status]) {
        const { message, icon } = ORDER_STATUS_MESSAGES[payload.status];
        pushNotification({
          type:    'order',
          message: payload.orderNumber ? `#${payload.orderNumber}: ${message}` : message,
          icon,
        });
      }
    });
    return () => { if (sub) sub.unsubscribe(); };
  }, [isConnected, subscribe, session?.id]);

  /* —— Close dropdowns on outside click —— */
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  /* ── Refresh cart count on route change ── */
  useEffect(() => {
    fetchCartCount();
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [location.pathname]);

  const handleLogout = () => {
    setShowDropdown(false);
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const isActive = (path: string) =>
    path === '/customer/dashboard'
      ? location.pathname === path
      : location.pathname.startsWith(path);

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      PENDING:   'Order placed',
      CONFIRMED: 'Order confirmed',
      PREPARING: 'Preparing your order',
      READY:     'Ready for pickup',
    };
    return map[status] || status;
  };

  return (
    <div className="min-h-screen bg-[#F8F8F8]">

      {/* ══════════════════════════════════════════════════
          TOP NAVBAR — visible on all screen sizes
          Desktop: full nav with links + profile dropdown
          Mobile:  logo + cart icon only (nav is at bottom)
      ══════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#E8E8E8] shadow-[0_1px_8px_rgba(0,0,0,0.06)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">

          {/* Logo — text only, no badge/icon per design standards */}
          <Link to="/customer/dashboard" className="flex items-center">
            <span className="font-extrabold text-[15px] text-[#1C1C1C] tracking-tight">
              Charusat<span className="text-[#E23744]">Needs</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-0.5">
            {desktopNavItems.map((item) => {
              const active = isActive(item.path);
              const Icon   = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold transition-all duration-200 ${
                    active
                      ? 'text-[#E23744]'
                      : 'text-[#696969] hover:text-[#1C1C1C]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                  {/* Zomato-style red underline indicator */}
                  {active && (
                    <motion.div
                      layoutId="nav-underline"
                      className="absolute bottom-0 left-3 right-3 h-[2px] bg-[#E23744] rounded-full"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right side controls */}
          <div className="flex items-center gap-2">

            {/* Notification Bell */}
            <div ref={notifRef} className="relative">
              <button
                onClick={() => {
                  setShowNotifDropdown(prev => !prev);
                  if (!showNotifDropdown) markAllRead();
                }}
                className="relative p-2 rounded-xl hover:bg-neutral-100 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 text-[#1C1C1C]" />
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-[#E23744] text-white text-[9px] font-extrabold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute right-0 top-full mt-2 w-80 min-w-[280px] max-w-[calc(100vw-1rem)] rounded-2xl bg-white shadow-xl border border-[#E8E8E8] z-[60] overflow-hidden"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[#F4F4F4]">
                      <p className="text-[13px] font-bold text-[#1C1C1C]">Notifications</p>
                      {notifications.length > 0 && (
                        <button
                          onClick={clearAll}
                          className="text-[11px] text-[#9C9C9C] hover:text-[#E23744] transition-colors font-medium"
                        >
                          Clear all
                        </button>
                      )}
                    </div>

                    {/* Notification list */}
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 px-4">
                          <Bell className="w-8 h-8 text-[#D1D5DB] mb-2" />
                          <p className="text-[12px] text-[#9C9C9C] font-medium">No notifications yet</p>
                          <p className="text-[11px] text-[#B0B0B0] mt-0.5">Order updates will appear here</p>
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className={`flex items-start gap-3 px-4 py-3 border-b border-[#F8F8F8] last:border-0 ${
                              !notif.read ? 'bg-[#FFF5F5]' : 'bg-white'
                            }`}
                          >
                            <span className="text-base flex-shrink-0 mt-0.5">{notif.icon || '●'}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] text-[#1C1C1C] font-medium leading-snug">{notif.message}</p>
                              <p className="text-[10px] text-[#9C9C9C] mt-0.5">
                                {(() => {
                                  const diff = Math.floor((Date.now() - new Date(notif.createdAt).getTime()) / 1000);
                                  if (diff < 60) return `${diff}s ago`;
                                  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
                                  return `${Math.floor(diff / 3600)}h ago`;
                                })()}
                              </p>
                            </div>
                            {!notif.read && (
                              <span className="w-2 h-2 bg-[#E23744] rounded-full flex-shrink-0 mt-1.5" />
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Cart icon with badge (Header on both mobile & desktop per 2026 reference) */}
            <button
              onClick={() => navigate('/cart')}
              className="relative p-2 rounded-xl hover:bg-neutral-100 transition-colors"
              aria-label="Cart"
            >
              <ShoppingCart className="w-5 h-5 text-[#1C1C1C]" />
              {cartCount > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-4 h-4 px-1 bg-[#E23744] text-white text-[9px] font-extrabold rounded-full flex items-center justify-center shadow-sm">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </button>

            {/* Desktop: Profile dropdown or Guest Sign In */}
            {session ? (
              <div ref={dropdownRef} className="relative hidden md:block">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-neutral-50 transition-all"
                >
                  {/* Avatar circle */}
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FFE5E7] to-[#FECDD3] border-2 border-white shadow-sm flex items-center justify-center flex-shrink-0">
                    <span className="text-[#E23744] font-bold text-xs">{userInitial}</span>
                  </div>
                  <span className="text-[13px] font-semibold text-[#1C1C1C] max-w-[100px] truncate">
                    {userName}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-[#9C9C9C] transition-transform duration-200 ${
                      showDropdown ? 'rotate-180' : ''
                    }`}
                  />
                </button>

              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute right-0 top-full mt-2 w-52 py-1.5 rounded-2xl bg-white shadow-xl border border-[#E8E8E8] z-[60]"
                  >
                    {/* User info row */}
                    <div className="px-4 py-2.5 border-b border-[#F4F4F4]">
                      <p className="text-[13px] font-bold text-[#1C1C1C] truncate">{userName}</p>
                      <p className="text-[11px] text-[#9C9C9C] truncate">{session?.email || ''}</p>
                    </div>

                    <Link
                      to="/customer/profile"
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-[#1C1C1C] hover:bg-[#F8F8F8] transition-colors"
                    >
                      <User className="w-4 h-4 text-[#9C9C9C]" />
                      Profile
                      <ChevronRight className="w-3.5 h-3.5 text-[#9C9C9C] ml-auto" />
                    </Link>
                    <Link
                      to="/customer/history"
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-[#1C1C1C] hover:bg-[#F8F8F8] transition-colors"
                    >
                      <Clock className="w-4 h-4 text-[#9C9C9C]" />
                      Order History
                      <ChevronRight className="w-3.5 h-3.5 text-[#9C9C9C] ml-auto" />
                    </Link>
                    <Link
                      to="/customer/offers"
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-[#1C1C1C] hover:bg-[#F8F8F8] transition-colors"
                    >
                      <Tag className="w-4 h-4 text-[#E23744]" />
                      Offers & Announcements
                      <ChevronRight className="w-3.5 h-3.5 text-[#9C9C9C] ml-auto" />
                    </Link>
                    <Link
                      to="/customer/bookmarks"
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-[#1C1C1C] hover:bg-[#F8F8F8] transition-colors"
                    >
                      <Bookmark className="w-4 h-4 text-[#9C9C9C]" />
                      Bookmarks
                      <ChevronRight className="w-3.5 h-3.5 text-[#9C9C9C] ml-auto" />
                    </Link>
                    <Link
                      to="/customer/security"
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-[#1C1C1C] hover:bg-[#F8F8F8] transition-colors"
                    >
                      <Shield className="w-4 h-4 text-[#9C9C9C]" />
                      Security
                      <ChevronRight className="w-3.5 h-3.5 text-[#9C9C9C] ml-auto" />
                    </Link>
                    <div className="my-1 border-t border-[#F4F4F4]" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-[#E23744] hover:bg-[#FFF5F5] transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white bg-[#E23744] hover:bg-[#C53030] shadow-sm transition-all"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════
          PAGE CONTENT
          Mobile: add pb-16 to avoid content hiding behind bottom nav
          Desktop: no extra padding needed
      ══════════════════════════════════════════════════ */}
      <main className="pb-16 md:pb-0">
        {children}
      </main>

      {/* ══════════════════════════════════════════════════
          ACTIVE ORDER TOAST
          Renders above the bottom nav (bottom-20 on mobile,
          bottom-4 on desktop) when an order is in progress.
      ══════════════════════════════════════════════════ */}
      <AnimatePresence>
        {activeOrders.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="fixed bottom-20 md:bottom-6 left-4 right-4 z-40 sm:left-auto sm:right-6 sm:max-w-xs"
          >
            <button
              onClick={() => navigate('/customer/history')}
              className="w-full flex items-center gap-3 px-4 py-3 bg-[#1BA672] hover:bg-[#169460] rounded-2xl text-white shadow-xl shadow-emerald-600/20 transition-all"
            >
              {/* Pulsing dot */}
              <div className="relative">
                <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                  <span className="text-sm font-bold">{activeOrders.length}</span>
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
              </div>

              <div className="flex-1 text-left min-w-0">
                <p className="text-[13px] font-bold truncate">
                  {activeOrders[0].canteen?.name || 'Your order'}
                </p>
                <p className="text-[11px] text-emerald-100 font-medium">
                  {getStatusText(activeOrders[0].status)}
                  {activeOrders.length > 1 ? ` +${activeOrders.length - 1} more` : ''}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-emerald-200 -rotate-90 flex-shrink-0" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════
          MOBILE BOTTOM NAV BAR — Zomato style
          Fixed at bottom, visible only on mobile (md:hidden).
          Four tabs: Home | History | Cart | Profile
          Cart tab shows badge when cartCount > 0.
      ══════════════════════════════════════════════════ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E8E8E8] shadow-[0_-1px_12px_rgba(0,0,0,0.08)]">
        <div className="grid grid-cols-4 h-16">
          {mobileBottomNav.map((item) => {
            const destination = (item.path === '/customer/profile' || item.path === '/customer/history') && !session
              ? '/login'
              : item.path;
            const active = isActive(item.path);
            const Icon   = item.icon;

            return (
              <Link
                key={item.path}
                to={destination}
                className="flex flex-col items-center justify-center gap-0.5 transition-colors relative py-1"
              >
                <div className="relative">
                  <Icon
                    className={`w-5 h-5 transition-colors ${
                      active ? 'text-[#E23744]' : 'text-[#9C9C9C]'
                    }`}
                    strokeWidth={active ? 2.5 : 2}
                  />
                </div>
                <span
                  className={`text-[10px] font-semibold transition-colors ${
                    active ? 'text-[#E23744]' : 'text-[#9C9C9C]'
                  }`}
                >
                  {item.label}
                </span>
                {/* Active dot indicator — positioned directly below label per reference */}
                {active && (
                  <motion.div
                    layoutId="bottom-nav-dot"
                    className="w-1.5 h-1.5 bg-[#E23744] rounded-full mt-0.5"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
    </div>
  );
}
