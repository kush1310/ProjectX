/**
 * Canteen Dashboard - Premium Green Theme
 * 
 * Features:
 * - GREEN theme throughout
 * - Premium order cards with InteractiveGradient
 * - Centered modals with scroll lock
 * - Collapsible navigation (no Orders tab - shown by default)
 * - Read More for long descriptions
 */

import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getOrders, 
  updateOrderStatus, 
  getOrderStats, 
  Order 
} from '../utils/canteenStore';
import { logout } from '@/utils/authStore';
import ConfettiButton from '../components/ConfettiButton';
import LogoutConfirmModal from '../components/LogoutConfirmModal';
import AnimatedBorder from '../components/AnimatedBorder';
import OrderDetailsModal from '../components/OrderDetailsModal';
import { Icons } from '@/components/Icons';
import { toast } from '@/utils/toast';

// Icons
// Icons imported from @/components/Icons

// Nav Items - REMOVED "Orders" as it's shown by default
const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: Icons.Grid, enabled: true },
  { label: 'Menu Management', path: '/canteen/menu', icon: Icons.Menu, enabled: true },
  { label: 'Order History', path: '/order-history', icon: Icons.History, enabled: true },
  { label: 'Analytics', path: '#', icon: Icons.Chart, enabled: false },
  { label: 'Coupon Management', path: '#', icon: Icons.Tag, enabled: false },
  { label: 'Recent Reviews', path: '#', icon: Icons.Star, enabled: false },
  { label: 'Help & Support', path: '#', icon: Icons.Help, enabled: false },
  { label: 'Restaurant Details', path: '#', icon: Icons.Settings, enabled: false },
];

const ORDER_TABS = ['new', 'preparing', 'ready', 'completed'] as const;
type OrderTab = typeof ORDER_TABS[number];

const tabLabels: Record<OrderTab, string> = {
  new: 'New',
  preparing: 'Preparing',
  ready: 'Ready for Pickup',
  completed: 'Completed'
};

export default function Dashboard() {
  const navigate = useNavigate();
  
  // State
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<OrderTab>('new');
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [mobileView, setMobileView] = useState<'live' | 'recent'>('live');
  const [rushHour, setRushHour] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 968);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 968);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleRushHour = () => {
    const newState = !rushHour;
    setRushHour(newState);
    if (newState) {
      toast.success('Rush Hour Enabled');
    } else {
      toast.info('Rush Hour Disabled');
    }
  };

  // Load orders
  useEffect(() => {
    setOrders(getOrders());
  }, []);

  // Lock body scroll when logout modal is open
  useEffect(() => {
    if (showLogoutModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showLogoutModal]);

  // Stats
  const stats = useMemo(() => getOrderStats(), [orders]);

  // Filtered orders by tab
  const filteredOrders = useMemo(() => {
    return orders.filter(o => o.status === activeTab);
  }, [orders, activeTab]);

  // Recent 5 orders
  const recentOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [orders]);

  // Tab counts
  const tabCounts = useMemo(() => ({
    new: orders.filter(o => o.status === 'new').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length,
    completed: orders.filter(o => o.status === 'completed').length,
  }), [orders]);

  // Handlers
  const handleAcceptOrder = (id: string) => {
    const updated = updateOrderStatus(id, 'preparing');
    if (updated) setOrders(getOrders());
  };

  const handleDeclineOrder = (id: string) => {
    const updated = updateOrderStatus(id, 'cancelled');
    if (updated) setOrders(getOrders());
  };

  const handleMarkReady = (id: string) => {
    const updated = updateOrderStatus(id, 'ready');
    if (updated) setOrders(getOrders());
  };

  const handleMarkComplete = (id: string) => {
    const updated = updateOrderStatus(id, 'completed');
    if (updated) setOrders(getOrders());
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getTimeSince = (dateStr: string) => {
    const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 flex font-sans text-gray-900">

      {/* LEFT NAVIGATION (Collapsible) */}
      {/* LEFT NAVIGATION (Responsive) */}
      <AnimatePresence>
        {(isMobileNavOpen || isDesktop) && (
          <>
            {/* Mobile Overlay */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileNavOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 min-[968px]:hidden" 
            />
            
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0, width: isNavCollapsed ? 72 : 260 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={`fixed top-0 left-0 z-50 h-full bg-white flex flex-col shadow-2xl min-[968px]:translate-x-0`}
            >
        {/* Logo */}
        <div className={`p-5 border-b border-gray-100/80 flex items-center ${isNavCollapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-emerald-200">
            C
          </div>
          {!isNavCollapsed && (
            <span className="font-bold text-lg tracking-tight text-gray-900">
              Charusat<span className="text-emerald-600">Needs</span>
            </span>
          )}
          
          {/* Mobile Close Button */}
          {!isDesktop && (
            <button 
               onClick={() => setIsMobileNavOpen(false)}
               className="ml-auto p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
               <Icons.X />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = item.path === '/dashboard' && item.label === 'Dashboard';
            return (
              <Link
                key={item.label}
                to={item.enabled ? item.path : '#'}
                onClick={(e) => {
                  if (!item.enabled) e.preventDefault();
                  setIsMobileNavOpen(false); // Auto-close on mobile
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-gradient-to-r from-emerald-50 to-emerald-100/50 text-emerald-700 font-semibold' 
                    : item.enabled 
                      ? 'text-gray-600 hover:bg-gray-50 hover:text-gray-900' 
                      : 'text-gray-400 cursor-not-allowed opacity-50'
                } ${isNavCollapsed ? 'justify-center px-3' : ''}`}
                title={isNavCollapsed ? item.label : undefined}
              >
                <span className={isActive ? 'text-emerald-600' : ''}><item.icon /></span>
                {!isNavCollapsed && <span className="text-sm truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse Toggle - ONLY VERTICAL VISIBLE ON DESKTOP */}
        {isDesktop && (
          <button
            onClick={() => setIsNavCollapsed(!isNavCollapsed)}
            className="absolute -right-3 top-24 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-emerald-600 hover:border-emerald-200 shadow-md transition-all"
          >
            {isNavCollapsed ? <Icons.ChevronRight /> : <Icons.ChevronLeft />}
          </button>
        )}

        {/* Logout */}
        <div className="p-4 border-t border-gray-100/80">
          <button
            onClick={() => setShowLogoutModal(true)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all ${isNavCollapsed ? 'justify-center px-3' : ''}`}
          >
            <Icons.Logout />
            {!isNavCollapsed && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main 
        className={`flex-1 transition-all duration-200 min-h-screen ${isNavCollapsed ? 'min-[968px]:ml-[72px]' : 'min-[968px]:ml-[260px]'} lg:mr-[300px] w-full bg-gray-50/50`}
      >
        {/* Header */}
        <header className="bg-white/70 backdrop-blur-xl border-b border-gray-100 px-3 sm:px-8 py-4 sm:py-6 sticky top-0 z-20">
          
          {/* Mobile Header Controls */}
          <div className="flex flex-wrap items-center justify-between min-[968px]:hidden mb-4 gap-3">
             <button onClick={() => setIsMobileNavOpen(true)} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                <Icons.Menu />
             </button>
             
             {/* Mobile View Toggle */}
             <div className="flex bg-gray-100 rounded-lg p-1 flex-1 max-w-[250px] mx-auto min-w-[200px]">
                <button 
                  onClick={() => setMobileView('live')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${mobileView === 'live' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500'}`}
                >
                  Live Orders
                </button>
                <button 
                  onClick={() => setMobileView('recent')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${mobileView === 'recent' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500'}`}
                >
                  Recent
                </button>
             </div>
             
             <div className="w-8" /> {/* Spacer balance */}
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between max-w-7xl 2xl:max-w-[1920px] mx-auto gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Live Orders</h1>
              <p className="text-xs sm:text-sm text-gray-500 flex items-center gap-2 mt-1">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                Updates live every 30s
              </p>
            </div>

            {/* Rush Hour Toggle */}
            <div className="flex items-center gap-3 sm:gap-4 bg-white px-3 sm:px-5 py-2 sm:py-3 rounded-2xl border border-gray-100 shadow-sm w-full sm:w-auto justify-between sm:justify-start">
              <span className="text-sm font-semibold text-gray-700">Rush Hour</span>
              <button
                onClick={toggleRushHour}
                className={`relative w-12 h-7 rounded-full transition-all duration-300 ${rushHour ? 'bg-gradient-to-r from-orange-400 to-orange-500 shadow-orange-200 shadow-md' : 'bg-gray-200'}`}
              >
                <motion.div
                  animate={{ x: rushHour ? 22 : 3 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-md"
                />
              </button>
              {rushHour && (
                <span className="text-xs font-bold text-orange-600 bg-orange-100 px-3 py-1 rounded-full animate-pulse">
                  ACTIVE
                </span>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 sm:gap-5 mt-4 sm:mt-6 max-w-7xl 2xl:max-w-[1920px] mx-auto">
            <div className="flex flex-col sm:flex-row items-center sm:gap-4 bg-white p-2 sm:px-5 sm:py-4 rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm">
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg sm:rounded-xl flex items-center justify-center text-emerald-600 mb-1 sm:mb-0">
                <svg width="20" height="20" className="sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
              </div>
              <div className="text-center sm:text-left">
                <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Active</p>
                <p className="text-sm sm:text-2xl font-bold text-gray-900">{stats.activeCount}</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center sm:gap-4 bg-white p-2 sm:px-5 sm:py-4 rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm">
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg sm:rounded-xl flex items-center justify-center text-blue-600 mb-1 sm:mb-0">
                <Icons.Clock className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Avg Time</p>
                <p className="text-sm sm:text-2xl font-bold text-gray-900">{stats.avgTime}m</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center sm:gap-4 bg-white p-2 sm:px-5 sm:py-4 rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm">
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg sm:rounded-xl flex items-center justify-center text-emerald-600 font-bold text-sm sm:text-lg mb-1 sm:mb-0">₹</div>
              <div className="text-center sm:text-left">
                <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Revenue</p>
                <p className="text-sm sm:text-2xl font-bold text-gray-900">₹{stats.todayRevenue}</p>
              </div>
            </div>
          </div>
        </header>

        {/* ============ LIVE ORDERS VIEW ============ */}
        <div className={mobileView === 'live' ? 'block' : 'hidden min-[968px]:block'}>
        {/* Tabs */}
        <div className="px-4 lg:px-8 py-5 bg-white/50 backdrop-blur-sm border-b border-gray-100/50 overflow-x-auto no-scrollbar">
          <div className="flex gap-2 max-w-7xl 2xl:max-w-[1920px] mx-auto min-w-max">
            {ORDER_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                  activeTab === tab 
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-200' 
                    : 'text-gray-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200'
                }`}
              >
                {tabLabels[tab]}
                {tabCounts[tab] > 0 && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    activeTab === tab ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tabCounts[tab]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Order Cards Grid */}
        <div className="p-3 sm:p-8">
          <div className="max-w-7xl 2xl:max-w-[1920px] mx-auto">
            <AnimatedBorder rushHour={rushHour} radius="1.5rem">
              <div className="bg-white rounded-3xl p-3 sm:p-6 min-h-[500px]">
                {filteredOrders.length === 0 ? (
                  <div className="text-center py-20 bg-gray-50 rounded-2xl border border-gray-100 mx-auto max-w-lg">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5 text-gray-400">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /></svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">No {tabLabels[activeTab]} Orders</h3>
                    <p className="text-gray-500 mt-2">New orders will appear here automatically</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-5">
                      {filteredOrders.map((order) => (
                        <OrderCard
                          key={order.id}
                          order={order}
                          onAccept={() => handleAcceptOrder(order.id)}
                          onDecline={() => handleDeclineOrder(order.id)}
                          onMarkReady={() => handleMarkReady(order.id)}
                          onMarkComplete={() => handleMarkComplete(order.id)}
                          getTimeSince={getTimeSince}
                          onShowDetails={() => setSelectedOrder(order)}
                        />
                      ))}
                  </div>
                )}
              </div>
            </AnimatedBorder>
          </div>
        </div>
        </div>

        {/* ============ RECENT ORDERS MOBILE VIEW ============ */}
        {mobileView === 'recent' && (
          <div className="p-4 min-[968px]:hidden pb-20">
             <div className="space-y-4">
                <h3 className="font-bold text-gray-900 px-2">Recent Orders History</h3>
                {recentOrders.map((order) => (
                  <RecentOrderCard
                    key={order.id}
                    order={order}
                    getTimeSince={getTimeSince}
                    onShowDetails={() => setSelectedOrder(order)}
                  />
                ))}
             </div>
          </div>
        )}
      </main>

      {/* RIGHT: RECENT 5 ORDERS - Desktop Sidebar */}
      <aside 
        className="hidden min-[968px]:flex fixed top-0 right-0 z-30 h-full w-[300px] bg-white/95 backdrop-blur-xl flex-col shadow-2xl shadow-gray-200/60"
        onWheel={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-50">
          <h2 className="font-bold text-lg text-gray-900">Recent Orders</h2>
          <p className="text-sm text-gray-500 mt-1">Last 5 orders</p>
        </div>
        
        <div 
          className="flex-1 overflow-y-auto p-4 space-y-3 overscroll-contain"
          onWheel={(e) => e.stopPropagation()}
        >
          {recentOrders.map((order) => (
            <RecentOrderCard
              key={order.id}
              order={order}
              getTimeSince={getTimeSince}
              onShowDetails={() => setSelectedOrder(order)}
            />
          ))}
        </div>

        <div className="p-4 border-t border-gray-100/80">
          <Link
            to="/order-history"
            className="block w-full text-center py-3 text-sm font-bold text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all border border-emerald-100"
          >
            View All History →
          </Link>
        </div>
      </aside>

      {/* Logout Modal */}
      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutModal(false)}
      />

      {/* Order Details Modal (Shared) */}
      <OrderDetailsModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />
    </div>
  );
}

// ==================== ORDER CARD COMPONENT ====================
interface OrderCardProps {
  order: Order;
  onAccept: () => void;
  onDecline: () => void;
  onMarkReady: () => void;
  onMarkComplete: () => void;
  getTimeSince: (date: string) => string;
  onShowDetails: () => void;
}

function OrderCard({ order, onAccept, onDecline, onMarkReady, onMarkComplete, getTimeSince, onShowDetails }: OrderCardProps) {
  return (
    <div
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-emerald-200 transition-shadow duration-200 cursor-pointer group flex flex-col"
      onClick={onShowDetails}
      style={{
        background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.04) 0%, #ffffff 30%)'
      }}
    >
      {/* Header */}
      <div className="p-3 sm:p-5 sm:pb-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg sm:text-xl font-bold text-gray-900">#{order.orderNumber}</span>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{order.customerName}</p>
          </div>
          <div className="flex items-center gap-2 bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700 text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-orange-100">
            <Icons.Clock />
            {getTimeSince(order.createdAt)}
          </div>
        </div>
      </div>

      {/* Items - Fixed height section */}
      <div className="px-3 sm:px-5 flex-1">
        <div className="space-y-2">
          {order.items.slice(0, 2).map((item, i) => (
            <div key={i} className="flex justify-between text-xs sm:text-sm">
              <span className="text-gray-600">
                <span className="font-bold text-emerald-600">{item.quantity}x</span> {item.name}
              </span>
              <span className="font-semibold text-gray-900">₹{item.price.toFixed(2)}</span>
            </div>
          ))}
          {order.items.length > 2 && (
            <p className="text-[10px] sm:text-xs text-emerald-600 font-semibold">+{order.items.length - 2} more items</p>
          )}
        </div>

        {order.specialNotes && (
          <div className="mt-3 p-2 sm:p-3 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-100">
            <p className="text-[10px] sm:text-xs text-amber-700">
              <span className="font-bold">Note:</span> {order.specialNotes.length > 40 ? order.specialNotes.slice(0, 40) + '...' : order.specialNotes}
            </p>
          </div>
        )}
      </div>

      {/* Footer - Always at bottom with consistent height */}
      <div className="p-3 sm:p-5 mt-4 bg-gradient-to-r from-gray-50 to-gray-100/50 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 font-medium">Total</span>
            <p className="text-2xl font-bold text-gray-900">₹{order.total.toFixed(2)}</p>
          </div>

          {order.status === 'new' && (
            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={onDecline}
                className="px-4 py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all"
              >
                Decline
              </button>
              <ConfettiButton onClick={onAccept} variant="success" size="md">
                <Icons.Check /> Accept
              </ConfettiButton>
            </div>
          )}

          {order.status === 'preparing' && (
            <button
              onClick={(e) => { e.stopPropagation(); onMarkReady(); }}
              className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-200 transition-all"
            >
              Mark Ready
            </button>
          )}

          {order.status === 'ready' && (
            <button
              onClick={(e) => { e.stopPropagation(); onMarkComplete(); }}
              className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-200 transition-all"
            >
              Complete
            </button>
          )}

          {order.status === 'completed' && (
            <span className="px-4 py-2 text-xs font-bold text-emerald-700 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-full border border-emerald-200 flex items-center gap-1">
              <Icons.Check className="w-3 h-3" /> Completed
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== RECENT ORDER CARD ====================
interface RecentOrderCardProps {
  order: Order;
  getTimeSince: (date: string) => string;
  onShowDetails: () => void;
}

function RecentOrderCard({ order, getTimeSince, onShowDetails }: RecentOrderCardProps) {
  const statusColors: Record<Order['status'], string> = {
    new: 'bg-orange-100 text-orange-700 border-orange-200',
    preparing: 'bg-blue-100 text-blue-700 border-blue-200',
    ready: 'bg-purple-100 text-purple-700 border-purple-200',
    completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    cancelled: 'bg-red-100 text-red-700 border-red-200',
  };

  return (
    <div
      className="bg-white rounded-xl p-3 sm:p-4 cursor-pointer hover:shadow-md hover:border-emerald-200 border border-gray-100 transition-shadow duration-200"
      onClick={onShowDetails}
    >
      <div className="flex items-center justify-between">
        <div>
          <span className="font-bold text-gray-900">#{order.orderNumber}</span>
          <p className="text-xs text-gray-500">{order.customerName}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-gray-900">₹{order.total.toFixed(2)}</p>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColors[order.status]}`}>
            {order.status.toUpperCase()}
          </span>
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-2">{getTimeSince(order.createdAt)}</p>
    </div>
  );
}