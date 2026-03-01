/**
 * Order History Page
 * 
 * Shows complete order history with expandable cards
 * Same layout as dashboard but focused on historical data
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getOrders, Order } from '../utils/canteenStore';

import { Search, MapPin, Phone, Clock } from 'lucide-react';
import { PlaceholdersAndVanishInput } from '@/components/ui/placeholders-and-vanish-input';
import { useWebSocket } from '@/hooks/useWebSocket';
import { toast } from '@/utils/toast';

const statusFilters = ['all', 'completed', 'cancelled'] as const;
type StatusFilter = typeof statusFilters[number];

export default function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
        try {
            const data = await getOrders();
            setOrders(data);
        } catch (error) {
            console.error(error);
        }
    };
    fetchOrders();
  }, []);

  // Real-Time Updates
  const { isConnected, subscribe } = useWebSocket();
  
  useEffect(() => {
    if (isConnected) {
        subscribe('/topic/order-updates', (updatedOrder: Order) => {
            setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
            
            // Notify user if their order is ready
            if (updatedOrder.status === 'ready') {
                toast.success(`Your Order #${updatedOrder.orderNumber} is Ready!`);
            }
        });
    }
  }, [isConnected, subscribe]);

  // Filter orders
  const filteredOrders = useMemo(() => {
    return orders
      .filter(o => {
        if (statusFilter === 'all') return o.status === 'completed' || o.status === 'cancelled';
        return o.status === statusFilter;
      })
      .filter(o => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          o.customerName.toLowerCase().includes(q) ||
          o.orderNumber.toString().includes(q) ||
          o.items.some(i => i.name.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, searchQuery, statusFilter]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const statusColors: Record<Order['status'], string> = {
    new: 'bg-orange-100 text-orange-700',
    preparing: 'bg-blue-100 text-blue-700',
    ready: 'bg-purple-100 text-purple-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-[1600px] mx-auto pb-20"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-display font-bold text-gray-900">Order History</h1>
              <p className="text-gray-500 mt-1">{filteredOrders.length} past orders found</p>
            </div>
  
            <div className="relative w-full md:w-80 h-14">
              <PlaceholdersAndVanishInput
                placeholders={["Search orders...", "Order #123", "Search by customer..."]}
                onChange={(e) => setSearchQuery(e.target.value)}
                onSubmit={(e) => e.preventDefault()}
              />
            </div>
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-xl p-2 rounded-2xl border border-white/50 shadow-sm mb-8 inline-flex gap-2">
          {statusFilters.map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all capitalize ${
                statusFilter === filter
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {filter === 'all' ? 'All History' : filter}
            </button>
          ))}
        </div>

        {/* Orders List */}
        <div>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-20 bg-white/50 rounded-3xl border border-dashed border-gray-200">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5 text-gray-400">
                   <Search className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">No orders found</h3>
              <p className="text-gray-500 mt-2">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer"
                    onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                  >
                    {/* Basic Info */}
                    <div className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-500">
                            #{order.orderNumber.slice(-3)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-lg">{order.customerName}</p>
                          <span className="text-sm text-gray-500">#{order.orderNumber}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 ml-auto">
                         <div className="text-right">
                              <p className="font-bold text-gray-900 text-lg">₹{order.total.toFixed(2)}</p>
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                   <Clock className="w-3 h-3" />
                                   {formatDate(order.createdAt)}
                              </div>
                         </div>
                         <span className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider ${statusColors[order.status]}`}>
                            {order.status}
                         </span>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    <AnimatePresence>
                      {expandedOrderId === order.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-gray-100 bg-gray-50/50"
                        >
                          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Left: Items and Notes */}
                            <div className="space-y-4">
                              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Order Items</h4>
                              <div className="space-y-3 bg-white p-4 rounded-xl border border-gray-100">
                                {order.items.map((item, i) => (
                                  <div key={i} className="flex justify-between items-center text-sm">
                                    <div className="flex items-center gap-3">
                                        <span className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center font-bold text-xs">{item.quantity}</span>
                                        <span className="text-gray-700 font-medium">{item.name}</span>
                                    </div>
                                    <span className="font-bold text-gray-900">₹{item.price.toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>

                              {order.specialNotes && (
                                <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                                  <p className="text-sm text-yellow-800">
                                    <span className="font-bold block mb-1">Note from Customer:</span> {order.specialNotes}
                                  </p>
                                </div>
                              )}
                              
                              {order.rejectionReason && (
                                <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                                  <p className="text-sm text-red-800">
                                    <span className="font-bold block mb-1">Rejection Reason:</span> {order.rejectionReason}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Right: Customer & Delivery */}
                            <div className="space-y-6">
                               <div className="bg-white p-4 rounded-xl border border-gray-100 space-y-4">
                                  <div className="flex items-center gap-3">
                                      <Phone className="w-5 h-5 text-gray-400" />
                                      <div>
                                          <p className="text-xs text-gray-500 font-bold uppercase">Phone</p>
                                          <p className="text-gray-900 font-medium">{order.customerPhone}</p>
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                      <MapPin className="w-5 h-5 text-gray-400" />
                                      <div>
                                          <p className="text-xs text-gray-500 font-bold uppercase">Address</p>
                                          <p className="text-gray-900 font-medium">{order.customerAddress}</p>
                                      </div>
                                  </div>
                               </div>

                               <div className="grid grid-cols-2 gap-4">
                                   <div className="bg-white p-4 rounded-xl border border-gray-100">
                                       <p className="text-xs text-gray-500 font-bold uppercase mb-1">Payment</p>
                                       <p className={`font-bold ${order.isPaid ? 'text-emerald-600' : 'text-orange-600'}`}>
                                           {order.paymentMethod.toUpperCase()}
                                       </p>
                                   </div>
                               </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}
