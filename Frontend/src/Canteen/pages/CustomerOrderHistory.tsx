/**
 * Customer Order History — Premium Minimal Design
 * Grouped by order, expandable, skeleton, reorder
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import {
  Search, ChevronRight, Clock, RotateCcw, X,
  Package, ChevronDown, ChevronUp, ShoppingBag, Star, MessageCircle, Bookmark
} from 'lucide-react';
import api from '@/utils/api';
import { toast } from '@/utils/toast';
import ReviewModal from '../components/ReviewModal';
import RaiseComplaintModal from '../components/RaiseComplaintModal';
import CharusatCampusMap from '../components/CharusatCampusMap';
import { useWebSocket } from '@/hooks/useWebSocket';
import { getSession } from '@/utils/authStore';

interface OrderItem {
  id: number;
  menuItem?: { id: number; name: string; price: number };
  quantity: number;
  totalPrice: number;
  name?: string;
  price?: number;
}

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  totalAmount: number;
  discountAmount?: number;
  finalAmount?: number;
  paymentStatus?: string;
  createdAt: string;
  items: OrderItem[];
  canteen?: { id: number; name: string };
  canteenId?: number;    // flat field returned by backend alongside the nested object
  paymentMethod?: string;
}

export default function CustomerOrderHistory() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId,    setExpandedId]    = useState<number | null>(null);
  const [activeTab,     setActiveTab]     = useState<'all' | 'active' | 'past' | 'bookmarked'>('all');

  // Bookmarked Orders state from localStorage
  const [bookmarkedIds, setBookmarkedIds] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('charusat_bookmarked_orders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleBookmark = (orderId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarkedIds(prev => {
      const isBookmarked = prev.includes(orderId);
      const next = isBookmarked ? prev.filter(id => id !== orderId) : [...prev, orderId];
      localStorage.setItem('charusat_bookmarked_orders', JSON.stringify(next));
      toast.success(isBookmarked ? 'Order removed from bookmarks' : 'Order saved to bookmarks 🔖');
      return next;
    });
  };

  // reviewTarget holds the order being reviewed; null = modal closed
  const [reviewTarget, setReviewTarget] = useState<Order | null>(null);
  const [complaintTarget, setComplaintTarget] = useState<Order | null>(null);

  const session = getSession();
  const { isConnected, subscribe } = useWebSocket();
  // fetchOrdersRef is declared after fetchOrders below to avoid block-scoped-before-declaration error

  const fetchOrders = async () => {
    try {
      // Suppress loading skeleton on background refresh — only show it on initial load
      if (orders.length === 0) setIsLoading(true);
      const res = await api.get('/orders/my-orders?size=100');
      const list = res.data?.content || res.data;
      setOrders(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Keep a stable ref so the useEffect/WebSocket closure always calls the latest fetchOrders
  const fetchOrdersRef = useRef(fetchOrders);
  fetchOrdersRef.current = fetchOrders;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    fetchOrders();

    let unsubscribe: (() => void) | null = null;
    if (isConnected && session?.id) {
      const sub = subscribe(`/topic/customer/${session.id}`, () => {
        fetchOrdersRef.current();
      });
      if (sub) unsubscribe = () => sub.unsubscribe();
    }

    // 20-second safety heartbeat — fallback for WebSocket gaps
    const heartbeat = setInterval(() => { fetchOrdersRef.current(); }, 20000);

    return () => {
      if (unsubscribe) unsubscribe();
      clearInterval(heartbeat);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, session?.id]);


  const cancelOrder = async (orderId: number) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status: 'CANCELLED', rejectionReason: 'Cancelled by customer' });
      toast.success('Order cancelled successfully');
      fetchOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to cancel order');
    }
  };

  const filteredOrders = useMemo(() => {
    // Filter out ghost orders — created but Razorpay was cancelled before payment
    let result = orders.filter(o => o.paymentStatus !== 'PENDING_PAYMENT');
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(o =>
        o.orderNumber?.toLowerCase().includes(q) ||
        o.canteen?.name?.toLowerCase().includes(q) ||
        o.items?.some(i => (i.menuItem?.name || i.name || '').toLowerCase().includes(q))
      );
    }
    if (activeTab === 'active') result = result.filter(o => ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'].includes(o.status));
    if (activeTab === 'past') result = result.filter(o => ['COMPLETED', 'DELIVERED', 'CANCELLED'].includes(o.status));
    if (activeTab === 'bookmarked') result = result.filter(o => bookmarkedIds.includes(o.id));
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, searchQuery, activeTab, bookmarkedIds]);

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const formatTime = (d: string) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const getItemName = (item: OrderItem) => item.menuItem?.name || item.name || 'Item';

  const getStatusStyle = (s: string) => {
    const map: Record<string, { bg: string; text: string; dot: string }> = {
      PENDING: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
      CONFIRMED: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
      PREPARING: { bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-500' },
      READY: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
      COMPLETED: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
      DELIVERED: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
      CANCELLED: { bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-500' },
    };
    return map[s] || { bg: 'bg-neutral-50', text: 'text-neutral-600', dot: 'bg-neutral-500' };
  };

  const getStatusLabel = (s: string) => {
    const labels: Record<string, string> = {
      PENDING: 'Placed', CONFIRMED: 'Confirmed', PREPARING: 'Preparing',
      READY: 'Ready', COMPLETED: 'Delivered', DELIVERED: 'Delivered', CANCELLED: 'Cancelled',
    };
    return labels[s] || s;
  };

  const isActiveOrder = (s: string) => ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'].includes(s);

/**
 * ORDER_STEPS — canonical 6-state Zomato-style tracking sequence.
 * Each step has a display label and the backend status value it maps to.
 */
const ORDER_STEPS = [
  { label: 'Placed',    status: 'PENDING'   },
  { label: 'Confirmed', status: 'CONFIRMED'  },
  { label: 'Preparing', status: 'PREPARING'  },
  { label: 'Ready',     status: 'READY'      },
  { label: 'Picked Up', status: 'PICKED_UP'  },
  { label: 'Completed', status: 'COMPLETED'  },
];

/**
 * OrderTimeline
 *
 * Renders a horizontal 6-dot progress timeline for an order. Active step is
 * highlighted in brand red; completed steps in emerald. Connecting lines fill
 * proportionally based on the current step index.
 *
 * Not rendered for CANCELLED orders — caller must guard that case.
 *
 * @param currentStatus {string} - Backend order status (e.g., 'PREPARING').
 */
function OrderTimeline({ currentStatus }: { currentStatus: string }) {
  let stepIndex = ORDER_STEPS.findIndex(s => s.status === currentStatus);
  if (stepIndex === -1 && (currentStatus === 'COMPLETED' || currentStatus === 'DELIVERED')) stepIndex = 5;
  if (stepIndex === -1) stepIndex = 0;
  if (stepIndex === -1) stepIndex = 0;

  return (
    <div className="mb-4">
      <p className="text-[9px] font-bold uppercase tracking-widest text-[#9C9C9C] mb-3">Order Status</p>
      <div className="relative flex items-center justify-between">
        {/* Background track */}
        <div className="absolute inset-x-0 top-[9px] h-[2px] bg-[#F4F4F4]" />
        {/* Filled track — grows proportionally with step progress */}
        <motion.div
          className="absolute top-[9px] left-0 h-[2px] bg-[#E23744] origin-left"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: stepIndex / (ORDER_STEPS.length - 1) }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ width: '100%' }}
        />
        {ORDER_STEPS.map((step, idx) => {
          const done   = idx < stepIndex;
          const active = idx === stepIndex;
          return (
            <div key={step.status} className="flex flex-col items-center relative z-10">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                done
                  ? 'bg-emerald-500 border-emerald-500'
                  : active
                  ? 'bg-[#E23744] border-[#E23744] ring-2 ring-rose-200'
                  : 'bg-white border-[#E0E0E0]'
              }`}>
                {done && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10">
                    <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                {active && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
              </div>
              <p className={`text-[8px] font-bold mt-1.5 text-center leading-tight max-w-[36px] ${
                done ? 'text-emerald-600' : active ? 'text-[#E23744]' : 'text-[#B0B0B0]'
              }`}>
                {step.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-5 pb-4">
          <h1 className="text-xl font-extrabold text-neutral-900">Your Orders</h1>
          <p className="text-[11px] text-neutral-400 mt-0.5">{orders.length} orders total</p>

          {/* Search */}
          <div className="ag-search-wrapper mt-3">
            <Search className="ag-search-icon" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="ag-search-input"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="ag-search-clear"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-3 bg-neutral-100 p-1 rounded-xl">
            {[
              { id: 'all', label: 'All' },
              { id: 'active', label: 'Active' },
              { id: 'past', label: 'Past' },
              { id: 'bookmarked', label: `Bookmarked (${bookmarkedIds.length})` },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-neutral-100 p-4">
                <div className="flex items-start gap-3 mb-3">
                  <Skeleton width={44} height={44} borderRadius={12} />
                  <div className="flex-1">
                    <Skeleton width={140} height={14} />
                    <Skeleton width={80} height={10} className="mt-1" />
                  </div>
                  <Skeleton width={64} height={22} borderRadius={8} />
                </div>
                <Skeleton count={2} height={10} className="mt-1" />
                <div className="flex justify-between mt-3 pt-2 border-t border-neutral-50">
                  <Skeleton width={120} height={10} />
                  <Skeleton width={50} height={14} />
                </div>
              </div>
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(145deg, #f5f5f5, #e8e8e8)',
                boxShadow: '4px 4px 10px rgba(0,0,0,0.05), -4px -4px 10px rgba(255,255,255,0.8)',
              }}
            >
              <ShoppingBag className="w-7 h-7 text-neutral-300" />
            </div>
            <h3 className="text-base font-bold text-neutral-800">
              {activeTab === 'bookmarked' ? 'No bookmarked orders yet' : 'No orders found'}
            </h3>
            <p className="text-neutral-400 text-xs mt-1 mb-5">
              {activeTab === 'bookmarked' ? 'Tap the bookmark icon on any order to save your favorite meals' : searchQuery ? 'Try a different search' : 'Start ordering from your favorite canteen'}
            </p>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/customer/dashboard')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#e23744] to-[#ff6b6b] text-white text-xs font-bold shadow-lg shadow-rose-200/30"
            >
              Browse Canteens
            </motion.button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map(order => {
              const expanded = expandedId === order.id;
              const status = getStatusStyle(order.status);
              const active = isActiveOrder(order.status);
              const isBookmarked = bookmarkedIds.includes(order.id);

              return (
                <motion.div
                  key={order.id}
                  layout
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className={`group bg-white rounded-2xl overflow-hidden transition-all duration-300 ${
                    active
                      ? 'border-2 border-[#e23744]/30 shadow-lg shadow-rose-500/10'
                      : 'border border-neutral-100 hover:border-red-200 hover:shadow-lg hover:shadow-neutral-200/50'
                  }`}
                >
                  {/* Active status strip */}
                  {active && (
                    <div className="bg-gradient-to-r from-[#e23744] via-rose-600 to-[#ff6b6b] px-4 py-2 flex items-center justify-between shadow-inner">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-white rounded-full ag-status-pulse" />
                        <span className="text-[11px] text-white font-extrabold uppercase tracking-wider">
                          ORDER {getStatusLabel(order.status)}
                        </span>
                      </div>
                      <span className="text-[10px] text-white/90 font-bold bg-black/10 px-2 py-0.5 rounded-md backdrop-blur-sm">
                        #{order.orderNumber}
                      </span>
                    </div>
                  )}

                  {/* Card body */}
                  <div
                    className="p-4 sm:p-5 cursor-pointer"
                    onClick={() => setExpandedId(expanded ? null : order.id)}
                  >
                    {/* Top row */}
                    <div className="flex items-start gap-3.5 mb-3">
                      <div className="w-11 h-11 rounded-2xl bg-rose-50/70 border border-rose-100/50 flex items-center justify-center flex-shrink-0 group-hover:scale-105 group-hover:bg-rose-100/70 transition-all duration-300">
                        <Package className="w-5 h-5 text-[#e23744]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-extrabold text-neutral-900 truncate group-hover:text-[#e23744] transition-colors">
                            {order.canteen?.name || 'Canteen'}
                          </h3>
                          {!active && (
                            <span className="text-[10px] text-neutral-400 font-medium">#{order.orderNumber}</span>
                          )}
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/canteen/${order.canteen?.id || 1}/menu`); }}
                          className="text-[11px] text-[#e23744] font-bold inline-flex items-center gap-0.5 mt-0.5 hover:underline"
                        >
                          View menu <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Header Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={(e) => toggleBookmark(order.id, e)}
                          className={`p-2 rounded-xl transition-all ${
                            isBookmarked
                              ? 'text-amber-500 bg-amber-50 border border-amber-200 shadow-sm'
                              : 'text-neutral-400 bg-neutral-50 hover:text-amber-500 hover:bg-amber-50'
                          }`}
                          title={isBookmarked ? 'Remove bookmark' : 'Bookmark order'}
                        >
                          <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-500' : ''}`} />
                        </button>

                        {!active && (
                          <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${status.bg} ${status.text} border-neutral-100`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                            {getStatusLabel(order.status)}
                          </span>
                        )}

                        <div className="p-1 rounded-lg text-neutral-400 group-hover:text-neutral-700 transition-colors">
                          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>
                    </div>

                    {/* Items Preview */}
                    <div className="space-y-1 my-3 bg-neutral-50/70 p-2.5 rounded-xl border border-neutral-100/60">
                      {order.items?.slice(0, 3).map((item, i) => (
                        <div key={i} className="text-xs text-neutral-700 flex items-center justify-between font-medium">
                          <span className="flex items-center gap-2 truncate">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                            <span className="font-bold text-neutral-900">{item.quantity}×</span>
                            <span className="truncate">{getItemName(item)}</span>
                          </span>
                          <span className="text-neutral-500 font-semibold text-[11px] shrink-0 ml-2">₹{item.totalPrice || item.price || 0}</span>
                        </div>
                      ))}
                      {(order.items?.length || 0) > 3 && (
                        <p className="text-[10px] font-bold text-[#e23744] pt-1 pl-3">
                          +{(order.items?.length || 0) - 3} more items in this order
                        </p>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2.5 border-t border-neutral-100">
                      <span className="flex items-center gap-1.5 text-[11px] text-neutral-500 font-medium">
                        <Clock className="w-3.5 h-3.5 text-neutral-400" />
                        {formatDate(order.createdAt)} · {formatTime(order.createdAt)}
                      </span>
                      <div className="flex items-center gap-2">
                        {order.paymentStatus === 'PAID' && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">PAID</span>
                        )}
                        {order.paymentStatus === 'REFUNDED' && (
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">REFUNDED</span>
                        )}
                        <span className="text-base font-extrabold text-neutral-900 tracking-tight">
                          ₹{Math.round(order.totalAmount || 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expanded details */}
                  <AnimatePresence>
                    {expanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-3 border-t border-neutral-100 bg-neutral-50/50">
                            {/* Live CHARUSAT Campus Delivery Agent Radar */}
                            {active && order.status !== 'CANCELLED' && (
                              <div className="mb-4">
                                <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700 mb-2 flex items-center justify-between">
                                  <span>Live Campus Delivery Radar</span>
                                  <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                                    CHARUSAT Changa
                                  </span>
                                </h4>
                                <CharusatCampusMap
                                  mode="track"
                                  height="h-56"
                                  canteenName={order.canteen?.name || 'Canteen Outlet'}
                                  orderNumber={order.orderNumber}
                                  orderStatus={order.status}
                                />
                              </div>
                            )}

                            {/* Order tracking timeline — hidden for cancelled orders */}
                            {order.status !== 'CANCELLED' && (
                              <OrderTimeline currentStatus={order.status} />
                            )}
                            <h4 className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 mb-2">Items</h4>
                          <div className="space-y-1.5 mb-3">
                            {order.items?.map((item, i) => (
                              <div key={i} className="flex justify-between text-xs bg-white px-3 py-2 rounded-lg">
                                <span className="text-neutral-700 font-medium">{item.quantity} × {getItemName(item)}</span>
                                <span className="font-bold text-neutral-900">₹{item.totalPrice || item.price || 0}</span>
                              </div>
                            ))}
                          </div>

                          <div className="flex flex-wrap gap-2 mb-3 text-[10px]">
                            <span className="px-2.5 py-1 bg-white rounded-lg font-semibold text-neutral-500">
                              #{order.orderNumber}
                            </span>
                            <span className="px-2.5 py-1 bg-white rounded-lg font-semibold text-neutral-500">
                              {order.paymentMethod?.toUpperCase() || 'N/A'}
                            </span>
                          </div>

                          <div className="flex gap-2">
                            {order.status === 'PENDING' && (
                              <motion.button
                                whileTap={{ scale: 0.96 }}
                                onClick={(e) => { e.stopPropagation(); cancelOrder(order.id); }}
                                className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-red-300 text-red-500 hover:bg-red-50 transition-all flex items-center justify-center gap-1.5"
                              >
                                <X className="w-3.5 h-3.5" />
                                Cancel Order
                              </motion.button>
                            )}
                            {order.status === 'COMPLETED' && (
                              <div className="flex flex-col gap-2 w-full">
                                <div className="flex gap-2">
                                  <motion.button
                                    whileTap={{ scale: 0.96 }}
                                    onClick={() => navigate(`/canteen/${order.canteen?.id || 1}/menu`)}
                                    className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-[#E23744] text-[#E23744] hover:bg-rose-50 transition-all flex items-center justify-center gap-1.5"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    Reorder
                                  </motion.button>
                                  {/* Rate Order button — triggers ReviewModal */}
                                  <motion.button
                                    whileTap={{ scale: 0.96 }}
                                    onClick={(e) => { e.stopPropagation(); setReviewTarget(order); }}
                                    className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-amber-50 border border-amber-300 text-amber-700 hover:bg-amber-100 transition-all flex items-center justify-center gap-1.5"
                                  >
                                    <Star className="w-3.5 h-3.5" />
                                    Rate Order
                                  </motion.button>
                                </div>
                                {/* Raise Complaint — triggers RaiseComplaintModal */}
                                <motion.button
                                  whileTap={{ scale: 0.96 }}
                                  onClick={(e) => { e.stopPropagation(); setComplaintTarget(order); }}
                                  className="w-full py-2 rounded-xl text-xs font-bold border border-red-200 text-red-500 hover:bg-red-50 transition-all flex items-center justify-center gap-1.5"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                  Raise a Complaint
                                </motion.button>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Post-order review modal */}
      <ReviewModal
        isOpen={reviewTarget !== null}
        onClose={() => setReviewTarget(null)}
        orderId={reviewTarget?.id ?? 0}
        canteenName={reviewTarget?.canteen?.name ?? 'Canteen'}
        orderNumber={reviewTarget?.orderNumber ?? ''}
      />

      {/* Raise complaint modal */}
      <RaiseComplaintModal
        isOpen={complaintTarget !== null}
        onClose={() => setComplaintTarget(null)}
        orderId={complaintTarget?.id ?? 0}
        canteenId={complaintTarget?.canteen?.id ?? complaintTarget?.canteenId ?? 0}
        canteenName={complaintTarget?.canteen?.name ?? 'Canteen'}
        orderNumber={complaintTarget?.orderNumber ?? ''}
      />
    </div>
  );
}
