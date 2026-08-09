/**
 * Order History Page — Vendor Side
 * Modern expandable cards with shimmer loading and responsive design
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getOrders, Order } from '../utils/canteenStore';
import { Search, MapPin, Phone, Clock, ChevronDown, Package, X } from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { toast } from '@/utils/toast';

const statusFilters = ['all', 'COMPLETED', 'CANCELLED', 'IN_PROGRESS'] as const;
type StatusFilter = typeof statusFilters[number];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } }
};
const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } }
};

/* ═══════ Shimmer Skeleton ═══════ */
function OrderHistorySkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map(i => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className="bg-white rounded-2xl border border-neutral-100 p-4 sm:p-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 ag-skeleton rounded-full" />
              <div className="space-y-1.5">
                <div className="h-4 w-28 sm:w-36 ag-skeleton" />
                <div className="h-3 w-20 ag-skeleton" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="space-y-1.5 text-right">
                <div className="h-4 w-14 ag-skeleton ml-auto" />
                <div className="h-3 w-24 ag-skeleton" />
              </div>
              <div className="h-6 w-20 ag-skeleton rounded-xl" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const fetchOrders = async () => {
    try {
      if (orders.length === 0) setIsLoading(true);
      const data = await getOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Real-Time STOMP Updates
  const { isConnected, subscribe } = useWebSocket();
  
  useEffect(() => {
    if (isConnected) {
      const handleUpdate = () => {
        fetchOrders();
      };
      const sub1 = subscribe('/topic/orders', handleUpdate);
      const sub2 = subscribe('/topic/order-updates', handleUpdate);
      return () => {
        sub1?.unsubscribe();
        sub2?.unsubscribe();
      };
    }
  }, [isConnected, subscribe]);

  const filteredOrders = useMemo(() => {
    return orders
      .filter(o => {
        if (!o) return false;
        if (statusFilter === 'all') return true;
        if (statusFilter === 'COMPLETED') return o.status === 'COMPLETED' || (o.status as string) === 'DELIVERED';
        if (statusFilter === 'CANCELLED') return o.status === 'CANCELLED';
        if (statusFilter === 'IN_PROGRESS') return ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'].includes(o.status);
        return (o.status as string) === statusFilter;
      })
      .filter(o => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        const customerName = (o.customer?.fullName || o.customerName || '').toLowerCase();
        const orderNum = (o.orderNumber || '').toString().toLowerCase();
        const itemsMatch = Array.isArray(o.items) && o.items.some(i => {
          const itemName = (i.menuItem?.name || i.name || '').toLowerCase();
          return itemName.includes(q);
        });
        return customerName.includes(q) || orderNum.includes(q) || itemsMatch;
      })
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }, [orders, searchQuery, statusFilter]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const statusColors: Record<string, string> = {
    PENDING: 'bg-amber-50 text-amber-700 border border-amber-200',
    CONFIRMED: 'bg-blue-50 text-blue-700 border border-blue-200',
    PREPARING: 'bg-blue-50 text-blue-700 border border-blue-200',
    READY: 'bg-purple-50 text-purple-700 border border-purple-200',
    COMPLETED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    DELIVERED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    CANCELLED: 'bg-red-50 text-red-700 border border-red-200',
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-[1400px] mx-auto pb-20"
    >
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4 mb-5 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-neutral-900">Order History</h1>
            <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">{filteredOrders.length} past orders found</p>
          </div>

          {/* Search */}
          <div className="ag-search-wrapper w-full sm:max-w-xs">
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
              <button onClick={() => { setSearchQuery(''); searchRef.current?.focus(); }} className="ag-search-clear">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
          {statusFilters.map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all capitalize whitespace-nowrap flex-shrink-0 ${
                statusFilter === filter
                  ? 'bg-gradient-to-r from-[#e23744] to-[#ff6b6b] text-white shadow-lg shadow-rose-200/40'
                  : 'bg-white/60 text-neutral-500 border border-neutral-200 hover:bg-white hover:border-neutral-300'
              }`}
            >
              {filter === 'all' ? 'All History' : filter.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <OrderHistorySkeleton />
          </motion.div>
        ) : filteredOrders.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 sm:py-20"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4 ag-float">
              <Package className="w-6 h-6 sm:w-8 sm:h-8 text-neutral-300" />
            </div>
            <h3 className="text-base sm:text-xl font-bold text-neutral-800">No orders found</h3>
            <p className="text-neutral-400 text-xs sm:text-sm mt-1">Try adjusting your search or filters</p>
          </motion.div>
        ) : (
          <motion.div
            key="orders"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            {filteredOrders.map((order) => (
              <motion.div
                key={order.id}
                variants={cardVariants}
                layout
                className="ag-card rounded-2xl overflow-hidden cursor-pointer"
                onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
              >
                {/* Basic Info */}
                <div className="p-3 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-full flex items-center justify-center font-extrabold text-neutral-400 text-xs sm:text-sm flex-shrink-0">
                      #{order.orderNumber.slice(-3)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-neutral-900 text-sm sm:text-base truncate">
                        {order.customer?.fullName || order.customerName || 'Customer'}
                      </p>
                      <span className="text-[10px] sm:text-xs text-neutral-400">#{order.orderNumber}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:gap-5 ml-auto">
                    <div className="text-right">
                      <p className="font-extrabold text-neutral-900 text-sm sm:text-lg">₹{(order.total ?? order.totalAmount ?? 0).toFixed(2)}</p>
                      <div className="flex items-center gap-1 text-[10px] sm:text-xs text-neutral-400">
                        <Clock className="w-3 h-3" />
                        <span className="truncate max-w-[120px] sm:max-w-none">{formatDate(order.createdAt)}</span>
                      </div>
                    </div>
                    <span className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[9px] sm:text-[10px] font-bold uppercase tracking-wider whitespace-nowrap flex-shrink-0 ${statusColors[order.status] || 'bg-neutral-50 text-neutral-700 border border-neutral-200'}`}>
                      {order.status}
                    </span>
                    <motion.div
                      animate={{ rotate: expandedOrderId === order.id ? 180 : 0 }}
                      transition={{ duration: 0.25 }}
                      className="text-neutral-400 hidden sm:block"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </motion.div>
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {expandedOrderId === order.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="border-t border-neutral-100 bg-neutral-50/50 overflow-hidden"
                    >
                      <div className="p-3 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        {/* Left: Items */}
                        <div className="space-y-3">
                          <h4 className="text-[10px] sm:text-xs font-bold text-neutral-500 uppercase tracking-wider">Order Items</h4>
                          <div className="space-y-2 bg-white p-3 sm:p-4 rounded-xl border border-neutral-100">
                            {Array.isArray(order.items) && order.items.map((item, i) => {
                              const name = item.menuItem?.name || item.name || 'Item';
                              const price = item.totalPrice ?? (item.unitPrice ? item.unitPrice * (item.quantity || 1) : item.price ?? 0);
                              return (
                                <div key={i} className="flex justify-between items-center text-xs sm:text-sm">
                                  <div className="flex items-center gap-2">
                                    <span className="w-5 h-5 sm:w-6 sm:h-6 bg-neutral-100 rounded flex items-center justify-center font-bold text-[10px] sm:text-xs text-neutral-500 flex-shrink-0">{item.quantity || 1}</span>
                                    <span className="text-neutral-700 font-medium truncate">{name}</span>
                                  </div>
                                  <span className="font-bold text-neutral-900 flex-shrink-0 ml-2">₹{Number(price).toFixed(2)}</span>
                                </div>
                              );
                            })}
                          </div>

                          {order.specialNotes && (
                            <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                              <p className="text-xs text-amber-800">
                                <span className="font-bold block mb-0.5">Note:</span> {order.specialNotes}
                              </p>
                            </div>
                          )}
                          
                          {order.rejectionReason && (
                            <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                              <p className="text-xs text-red-800">
                                <span className="font-bold block mb-0.5">Rejection:</span> {order.rejectionReason}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Right: Customer & Delivery */}
                        <div className="space-y-3 sm:space-y-4">
                          <div className="bg-white p-3 sm:p-4 rounded-xl border border-neutral-100 space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-neutral-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Phone className="w-4 h-4 text-neutral-400" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[10px] text-neutral-400 font-bold uppercase">Phone</p>
                                <p className="text-xs sm:text-sm text-neutral-900 font-medium truncate">
                                  {order.customer?.mobile || order.customerPhone || 'N/A'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-neutral-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                <MapPin className="w-4 h-4 text-neutral-400" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[10px] text-neutral-400 font-bold uppercase">Location / Address</p>
                                <p className="text-xs sm:text-sm text-neutral-900 font-medium truncate">
                                  {order.canteen?.location || order.customerAddress || 'Campus Pickup'}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="bg-white p-3 sm:p-4 rounded-xl border border-neutral-100">
                            <p className="text-[10px] text-neutral-400 font-bold uppercase mb-1">Payment</p>
                            <p className={`font-bold text-sm ${order.isPaid ? 'text-emerald-600' : 'text-amber-600'}`}>
                              {(order.paymentMethod ?? 'CASH').toUpperCase()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
