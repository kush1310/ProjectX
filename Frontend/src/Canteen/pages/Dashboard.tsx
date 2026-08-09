import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Bell, X,
  Check, Clock, RefreshCw, User, MapPin, Printer, Leaf,
  Store, ToggleLeft, ToggleRight,
} from 'lucide-react';
import { getOrders, updateOrderStatus, type Order } from '../utils/canteenStore';
import { useWebSocket } from '../../hooks/useWebSocket';
import { toast } from '../../utils/toast';
import api from '../../utils/api';

type TabType = 'live' | 'ready' | 'done';

/**
 * useElapsedTime
 *
 * Returns a formatted elapsed time string (MM:SS) since the given ISO timestamp.
 * Updates every second while the component is mounted. Used to show vendors
 * how long an order has been waiting — critical for SLA management.
 *
 * @param createdAt {string} - ISO 8601 timestamp of order creation.
 * @returns {string}         - Formatted string like "04:32" or "1h 12m".
 */
function useElapsedTime(createdAt: string): string {
  const [elapsed, setElapsed] = useState('');
  useEffect(() => {
    const compute = () => {
      const seconds = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
      if (seconds < 3600) {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        setElapsed(`${m}:${s}`);
      } else {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        setElapsed(`${h}h ${m}m`);
      }
    };
    compute();
    const interval = setInterval(compute, 1000);
    return () => clearInterval(interval);
  }, [createdAt]);
  return elapsed;
}

/**
 * printKOT
 *
 * Opens a browser print dialog with a formatted KOT (Kitchen Order Ticket).
 * KOT includes: order number, creation time, item list with quantities,
 * special instructions, and total amount. No external library dependency.
 *
 * @param order {Order} - The order object to print.
 */
function printKOT(order: Order) {
  const lines = (order.items || []).map(i =>
    `<tr><td>${i.quantity}x</td><td>${i.menuItem?.name || i.name}</td><td>\u20b9${i.totalPrice || (i.price * i.quantity)}</td></tr>`
  ).join('');
  const html = `
    <html><head><title>KOT #${order.orderNumber}</title>
    <style>body{font-family:monospace;font-size:14px;padding:16px}h2{text-align:center}table{width:100%}td{padding:2px 4px}hr{border:1px dashed #000}.total{font-weight:bold;font-size:16px}</style>
    </head><body>
    <h2>CHARUSAT NEEDS</h2><hr/>
    <p><b>Order #${order.orderNumber}</b><br/>${new Date(order.createdAt).toLocaleString()}</p>
    <hr/><table>${lines}</table><hr/>
    <p class="total">TOTAL: \u20b9${order.totalAmount || order.total || 0}</p>
    ${order.specialInstructions ? `<p>Note: ${order.specialInstructions}</p>` : ''}
    <hr/><p style="text-align:center">*** KOT COPY ***</p>
    </body></html>`;
  const win = window.open('', '_blank', 'width=320,height=480');
  if (win) { win.document.write(html); win.document.close(); win.print(); }
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } }
};
const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }
};

/* ═══════ Animated Skeleton ═══════ */
function OrderSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden shadow-sm">
      {/* Payment header skeleton */}
      <div className="h-8 ag-skeleton rounded-none" />
      <div className="p-4 space-y-3">
        {/* Title row */}
        <div className="flex justify-between items-start">
          <div className="space-y-1.5 flex-1">
            <div className="h-4 w-28 ag-skeleton" />
            <div className="h-3 w-36 ag-skeleton" />
          </div>
          <div className="h-5 w-16 ag-skeleton rounded-lg" />
        </div>
        {/* Items skeleton */}
        <div className="space-y-2 py-3 border-t border-b border-neutral-50">
          <div className="flex justify-between">
            <div className="h-3 w-40 ag-skeleton" />
            <div className="h-3 w-10 ag-skeleton" />
          </div>
          <div className="flex justify-between">
            <div className="h-3 w-32 ag-skeleton" />
            <div className="h-3 w-10 ag-skeleton" />
          </div>
        </div>
        {/* Footer */}
        <div className="flex justify-between items-center">
          <div className="h-3 w-14 ag-skeleton" />
          <div className="flex items-center gap-2">
            <div className="h-4 w-12 ag-skeleton rounded" />
            <div className="h-5 w-14 ag-skeleton" />
          </div>
        </div>
        {/* Button */}
        <div className="h-10 w-full ag-skeleton rounded-xl" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [orders, setOrders]   = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('live');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  // Canteen open/close toggle state
  const [canteenId, setCanteenId] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [isTogglingOpen, setIsTogglingOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const { isConnected, subscribe } = useWebSocket();

  useEffect(() => {
    fetchOrders();
    // Fetch the vendor's canteen to get id + isOpen state
    api.get('/canteens/my-canteen')
      .then(res => {
        if (res.data?.canteen) {
          setCanteenId(res.data.canteen.id);
          setIsOpen(res.data.canteen.isOpen ?? true);
        }
      })
      .catch(() => { /* vendor canteen not yet set up */ });
  }, []);

  useEffect(() => {
    if (!isConnected) return;
    const sub1 = subscribe('/topic/orders', (newOrder) => {
      setOrders(prev => [newOrder, ...prev]);
      toast.success('New order received!');
    });
    const sub2 = subscribe('/topic/order-updates', (updated) => {
      setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
    });
    return () => { sub1?.unsubscribe(); sub2?.unsubscribe(); };
  }, [isConnected, subscribe]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const data = await getOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error('Failed to load orders');
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: number, status: string) => {
    try {
      await updateOrderStatus(orderId, status);
      toast.success(`Order ${status.toLowerCase()}`);
      fetchOrders();
    } catch (err) {
      toast.error('Failed to update order');
    }
  };

  /**
   * toggleRestaurantOpen
   *
   * Calls PATCH /api/canteens/{id}/toggle-open to flip the restaurant's
   * open/closed state. Optimistically updates local UI before the backend
   * responds. On success the backend broadcasts CANTEEN_STATUS_CHANGED via
   * WebSocket so all customers see the update in real-time.
   *
   * @returns {void}
   */
  const toggleRestaurantOpen = async () => {
    if (isTogglingOpen) return;
    setIsTogglingOpen(true);
    const previousState = isOpen;
    setIsOpen(!isOpen); // Optimistic update
    try {
      let res;
      try {
        res = await api.patch('/canteens/my-canteen/toggle-open');
      } catch (e) {
        if (canteenId) {
          res = await api.patch(`/canteens/${canteenId}/toggle-open`);
        } else {
          throw e;
        }
      }
      if (res.data?.canteen?.id) {
        setCanteenId(res.data.canteen.id);
      }
      const nextOpen = res.data.isOpen ?? !previousState;
      setIsOpen(nextOpen);
      toast.success(nextOpen ? 'Restaurant is now OPEN' : 'Restaurant is now CLOSED');
    } catch (err: any) {
      setIsOpen(previousState); // Rollback on failure
      toast.error(err.response?.data?.message || 'Failed to toggle restaurant status');
    } finally {
      setIsTogglingOpen(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchQuery === '' ||
      order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer?.fullName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab =
      (activeTab === 'live'  && ['PENDING', 'CONFIRMED', 'PREPARING'].includes(order.status)) ||
      (activeTab === 'ready' && order.status === 'READY') ||
      (activeTab === 'done'  && ['COMPLETED', 'CANCELLED'].includes(order.status));
    return matchesSearch && matchesTab;
  });

  const tabCounts = {
    live: orders.filter(o => ['PENDING', 'CONFIRMED', 'PREPARING'].includes(o.status)).length,
    ready: orders.filter(o => o.status === 'READY').length,
    done: orders.filter(o => ['COMPLETED', 'CANCELLED'].includes(o.status)).length,
  };

  return (
    <div className="min-h-screen">
      {/* ── Header ── */}
      <header className="sticky top-0 z-30 ag-glass-strong border-b border-white/30">
        <div className="px-3 sm:px-5 py-3 sm:py-4 space-y-3">
          {/* Row 1: Title + Actions */}
          <div className="flex items-center justify-between gap-3">
            {/* Title + Status */}
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-extrabold text-neutral-900 truncate">Order Dashboard</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`w-2.5 h-2.5 rounded-full ${isOpen ? 'bg-emerald-500 ag-status-pulse' : 'bg-red-500'}`} />
                <span className={`text-[11px] sm:text-xs font-bold ${isOpen ? 'text-emerald-700' : 'text-red-700'}`}>
                  {isOpen ? 'Store Open' : 'Store Closed'}
                </span>
                <span className="text-[11px] sm:text-xs text-neutral-300">|</span>
                <span className="text-[11px] sm:text-xs text-neutral-500 font-medium">{orders.length} total orders</span>
              </div>
            </div>

            {/* Restaurant Toggle + Refresh + Bell */}
            <div className="flex items-center gap-2 flex-shrink-0">

              {/* Open / Closed toggle — prominent vendor control */}
              <button
                id="restaurant-toggle-btn"
                onClick={toggleRestaurantOpen}
                disabled={isTogglingOpen}
                title={isOpen ? 'Click to close restaurant' : 'Click to open restaurant'}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border shadow-sm transition-all duration-200 ${
                  isOpen
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100 hover:border-emerald-400'
                    : 'bg-red-50 border-red-300 text-red-800 hover:bg-red-100 hover:border-red-400'
                } ${isTogglingOpen ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
              >
                {isTogglingOpen ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-neutral-600" />
                ) : isOpen ? (
                  <ToggleRight className="w-5 h-5 text-emerald-600" />
                ) : (
                  <ToggleLeft className="w-5 h-5 text-red-600" />
                )}
                <span className="font-extrabold">{isOpen ? 'STORE OPEN' : 'STORE CLOSED'}</span>
              </button>

              <button
                onClick={fetchOrders}
                className="p-2 sm:p-2.5 rounded-xl bg-white/60 border border-neutral-200 hover:bg-white hover:shadow-sm transition-all"
              >
                <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 text-neutral-500 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <button className="relative p-2 sm:p-2.5 rounded-xl bg-white/60 border border-neutral-200 hover:bg-white hover:shadow-sm transition-all">
                <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-600" />
                {orders.filter(o => o.status === 'PREPARING').length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-[#e23744] text-white text-[9px] sm:text-[10px] font-bold rounded-full flex items-center justify-center ag-status-pulse">
                    {orders.filter(o => o.status === 'PREPARING').length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Row 2: Search Bar (full width on mobile) */}
          <div className="ag-search-wrapper">
            <Search className="ag-search-icon" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ag-search-input"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); searchRef.current?.focus(); }}
                className="ag-search-clear"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Row 3: Tabs — Zomato vendor labels */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
            {([
              { key: 'live',  label: 'Live Orders' },
              { key: 'ready', label: 'Ready'        },
              { key: 'done',  label: 'Done'          },
            ] as { key: TabType; label: string }[]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`relative px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap flex-shrink-0 ${
                  activeTab === key
                    ? 'bg-gradient-to-r from-[#3D6EEE] to-[#5B8AF5] text-white shadow-lg shadow-blue-200/40'
                    : 'bg-white/60 text-neutral-500 border border-neutral-200 hover:bg-white hover:border-neutral-300'
                }`}
              >
                {label}
                <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold ${
                  activeTab === key ? 'bg-white/25' : 'bg-neutral-100'
                }`}>
                  {tabCounts[key]}
                </span>
                {/* Pulsing dot for live orders with activity */}
                {key === 'live' && tabCounts.live > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#E23744] rounded-full animate-pulse" />
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── Orders Grid ── */}
      <main className="px-3 sm:px-5 py-4 sm:py-6">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
              className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              {[1, 2, 3, 4, 5, 6].map(i => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <OrderSkeleton />
                </motion.div>
              ))}
            </motion.div>
          ) : filteredOrders.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center py-16 sm:py-20"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 bg-neutral-100 rounded-full flex items-center justify-center ag-float">
                <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-neutral-300" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-neutral-800">No orders in {activeTab}</h3>
              <p className="text-neutral-400 text-xs sm:text-sm mt-1">Orders will appear here when received</p>
            </motion.div>
          ) : (
            <motion.div
              key="orders"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              {filteredOrders.map((order) => (
                <OrderCard key={order.id} order={order} onStatusUpdate={handleStatusUpdate} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

const VENDOR_STEPS = [
  { label: 'Placed', status: 'PENDING' },
  { label: 'Confirmed', status: 'CONFIRMED' },
  { label: 'Preparing', status: 'PREPARING' },
  { label: 'Ready', status: 'READY' },
  { label: 'Completed', status: 'COMPLETED' },
];

function VendorOrderTimeline({ currentStatus }: { currentStatus: string }) {
  if (currentStatus === 'CANCELLED') {
    return (
      <div className="my-2 px-2.5 py-1 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between text-[10px] font-bold text-red-700">
        <span>Order Cancelled</span>
        <X className="w-3 h-3 text-red-500" />
      </div>
    );
  }

  let stepIndex = VENDOR_STEPS.findIndex(s => s.status === currentStatus);
  if (stepIndex === -1 && currentStatus === 'DELIVERED') stepIndex = 4;
  if (stepIndex === -1) stepIndex = 0;

  const progressPercent = (stepIndex / (VENDOR_STEPS.length - 1)) * 100;

  return (
    <div className="my-2.5 px-0.5">
      <div className="relative flex items-center justify-between">
        {/* Background line */}
        <div className="absolute inset-x-0 top-[7px] h-[2px] bg-neutral-200" />
        {/* Progress line */}
        <motion.div
          className="absolute top-[7px] left-0 h-[2px] bg-gradient-to-r from-[#e23744] to-emerald-500 origin-left"
          initial={{ width: '0%' }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />

        {VENDOR_STEPS.map((step, idx) => {
          const isDone = idx < stepIndex;
          const isActive = idx === stepIndex;

          return (
            <div key={step.status} className="flex flex-col items-center relative z-10">
              <div
                className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition-all ${
                  isDone
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : isActive
                    ? 'bg-[#e23744] border-[#e23744] ring-2 ring-rose-200'
                    : 'bg-white border-neutral-300'
                }`}
              >
                {isDone && <Check className="w-2 h-2 text-white" strokeWidth={3} />}
                {isActive && <div className="w-1 h-1 bg-white rounded-full animate-pulse" />}
              </div>
              <span className={`text-[8px] font-bold mt-1 text-center truncate max-w-[42px] ${
                isDone ? 'text-emerald-700' : isActive ? 'text-[#e23744]' : 'text-neutral-400'
              }`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Order Card ──
function OrderCard({ order, onStatusUpdate }: { order: Order; onStatusUpdate: (id: number, status: string) => void }) {
  const elapsed = useElapsedTime(order.createdAt);

  // Determine if all items in the order are vegetarian (for VEG ORDER badge)
  const isAllVeg = (order.items || []).every(
    item => item.menuItem?.isVeg === true
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-100 text-amber-700';
      case 'CONFIRMED': return 'bg-blue-100 text-blue-700';
      case 'PREPARING': return 'bg-blue-100 text-blue-700';
      case 'READY': return 'bg-emerald-100 text-emerald-700';
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-700';
      case 'CANCELLED': return 'bg-red-100 text-red-700';
      default: return 'bg-neutral-100 text-neutral-700';
    }
  };

  const getNextAction = (status: string) => {
    switch (status) {
      case 'PENDING': return { label: 'Accept Order', next: 'CONFIRMED', style: 'from-blue-500 to-blue-600' };
      case 'CONFIRMED': return { label: 'Start Preparing', next: 'PREPARING', style: 'from-blue-500 to-blue-600' };
      case 'PREPARING': return { label: 'Mark Ready', next: 'READY', style: 'from-emerald-500 to-emerald-600' };
      case 'READY': return { label: 'Complete Order', next: 'COMPLETED', style: 'from-emerald-500 to-emerald-600' };
      default: return null;
    }
  };

  const action = getNextAction(order.status);

  return (
    <motion.div
      layout
      variants={cardVariants}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.25 } }}
      className="ag-card rounded-2xl overflow-hidden group"
    >
      {/* Payment type header */}
      <div className={`px-3 sm:px-4 py-1.5 sm:py-2 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider ${
        order.paymentMethod === 'upi' 
          ? 'bg-gradient-to-r from-[#e23744] to-[#ff6b6b] text-white' 
          : 'bg-neutral-100 text-neutral-500'
      }`}>
        {order.paymentMethod === 'upi' ? 'ONLINE PAYMENT' : 'SELF PICKUP'}
      </div>

      <div className="p-3 sm:p-4">
        {/* Order Info */}
        <div className="flex justify-between items-start mb-2">
          <div className="min-w-0 flex-1 mr-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-neutral-900 text-sm sm:text-base truncate tracking-tight">#{order.orderNumber}</h3>
              {/* VEG ORDER badge — shown when every item in order is vegetarian */}
              {isAllVeg && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 border border-emerald-300 rounded text-[10px] font-bold text-emerald-700 flex-shrink-0">
                  <Leaf className="w-2.5 h-2.5" />
                  VEG
                </span>
              )}
            </div>
            <p className="text-[10px] sm:text-xs text-neutral-500 flex items-center gap-1 mt-1 truncate">
              <User className="w-3.5 h-3.5 flex-shrink-0 text-neutral-400" />
              <span className="truncate font-medium">{order.customer?.fullName || 'Customer'}</span>
            </p>
            {order.specialInstructions && (
              <p className="text-[10px] sm:text-xs text-neutral-600 flex items-start gap-1 mt-1.5 truncate max-w-full" title={order.specialInstructions}>
                <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-[#e23744]" />
                <span className="truncate font-medium">{order.specialInstructions}</span>
              </p>
            )}
          </div>
          <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap flex-shrink-0 shadow-sm ${getStatusColor(order.status)}`}>
            {order.status}
          </span>
        </div>

        {/* Vendor Order Progress Timeline */}
        <VendorOrderTimeline currentStatus={order.status} />

        {/* Items */}
        <div className="space-y-2 mb-3 sm:mb-4 border border-neutral-100 bg-neutral-50/50 rounded-xl p-2 sm:p-3 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] max-h-36 overflow-y-auto scroll-smooth [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-neutral-200/50 hover:[&::-webkit-scrollbar-thumb]:bg-neutral-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent pr-1.5 transition-colors duration-200">
          {order.items?.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center text-[10px] sm:text-xs gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-white shadow-sm border border-neutral-200 flex items-center justify-center text-[10px] sm:text-xs font-bold text-neutral-700">
                  {item.quantity}
                </span>
                <span className="truncate font-semibold text-neutral-800">
                  {item.menuItem?.name || item.name || 'Unknown Item'}
                </span>
              </div>
              <span className="text-neutral-900 font-extrabold whitespace-nowrap flex-shrink-0">
                ₹{item.totalPrice}
              </span>
            </div>
          ))}
        </div>

        {/* Total, Payment & Elapsed Timer */}
        <div className="flex justify-between items-center mb-3 sm:mb-4 px-1">
          <div className="flex items-center gap-1.5">
            {/* Elapsed time — color-coded: green<10min, amber<20min, red>20min */}
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold ${
              (() => {
                const secs = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 1000);
                if (secs < 600)  return 'bg-emerald-100 text-emerald-700';
                if (secs < 1200) return 'bg-amber-100 text-amber-700';
                return 'bg-red-100 text-red-700';
              })()
            }`}>
              <Clock className="w-3.5 h-3.5" />
              {elapsed}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 text-[9px] sm:text-[10px] font-extrabold rounded-lg ${order.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              {order.paymentStatus === 'PAID' ? 'PAID' : 'UNPAID'}
            </span>
            <span className="font-extrabold text-base sm:text-lg text-neutral-900">₹{order.totalAmount}</span>
          </div>
        </div>

        {/* Actions — next-status button + KOT print + cancel */}
        {action && (
          <div className="flex gap-2">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => onStatusUpdate(order.id, action.next)}
              className={`flex-1 py-2 sm:py-2.5 rounded-xl text-white text-xs sm:text-sm font-bold bg-gradient-to-r ${action.style} shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5`}
            >
              {action.label}
            </motion.button>
            {/* KOT print button */}
            <button
              onClick={() => printKOT(order)}
              title="Print KOT"
              className="px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl bg-neutral-100 text-neutral-500 hover:bg-[#3D6EEE] hover:text-white transition-all"
            >
              <Printer className="w-4 h-4" />
            </button>
            {order.status === 'PENDING' && (
              <button
                onClick={() => onStatusUpdate(order.id, 'CANCELLED')}
                className="px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl bg-neutral-100 text-neutral-500 hover:bg-red-50 hover:text-red-500 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {order.status === 'COMPLETED' && (
          <div className="flex items-center justify-center gap-2 py-2 sm:py-2.5 bg-emerald-50 rounded-xl text-emerald-600">
            <Check className="w-4 h-4" />
            <span className="font-semibold text-xs sm:text-sm">Completed</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}