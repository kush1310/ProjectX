/**
 * Order History Page
 * 
 * Shows complete order history with expandable cards
 * Same layout as dashboard but focused on historical data
 */

import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getOrders, Order } from '../utils/canteenStore';

// Icons
const Icons = {
  Back: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>,
  Search: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
  MapPin: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>,
  Phone: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" /></svg>,
  Clock: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
};

const statusFilters = ['all', 'completed', 'cancelled'] as const;
type StatusFilter = typeof statusFilters[number];

export default function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    setOrders(getOrders());
  }, []);

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
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="p-2 -ml-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <Icons.Back />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Order History</h1>
              <p className="text-sm text-gray-500">{filteredOrders.length} orders found</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <input
              type="text"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition-all text-sm"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Icons.Search />
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex gap-2">
          {statusFilters.map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all capitalize ${
                statusFilter === filter
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {filter === 'all' ? 'All History' : filter}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-8">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
            <h3 className="font-bold text-gray-900">No orders found</h3>
            <p className="text-sm text-gray-500 mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="space-y-3">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer"
                  onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                >
                  {/* Basic Info */}
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <span className="text-lg font-bold text-gray-900">#{order.orderNumber}</span>
                        <p className="text-sm text-gray-500">{order.customerName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">₹{order.total.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${statusColors[order.status]}`}>
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
                        className="border-t border-gray-100 overflow-hidden"
                      >
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Left: Items and Notes */}
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-bold text-gray-900 mb-2">Items</h4>
                              <div className="space-y-2">
                                {order.items.map((item, i) => (
                                  <div key={i} className="flex justify-between text-sm">
                                    <span className="text-gray-600">
                                      <span className="font-semibold text-gray-900">{item.quantity}x</span> {item.name}
                                    </span>
                                    <span className="font-medium text-gray-900">₹{item.price.toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {order.specialNotes && (
                              <div className="p-3 bg-yellow-50 rounded-xl border border-yellow-100">
                                <p className="text-xs text-yellow-700">
                                  <span className="font-bold">Special Notes:</span> {order.specialNotes}
                                </p>
                              </div>
                            )}

                            {/* Customer Info */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Icons.Phone />
                                <span>{order.customerPhone}</span>
                              </div>
                              <div className="flex items-start gap-2 text-sm text-gray-600">
                                <Icons.MapPin />
                                <span>{order.customerAddress}</span>
                              </div>
                            </div>

                            {/* Payment */}
                            <div className="flex items-center justify-between text-sm p-3 bg-gray-50 rounded-xl">
                              <span className="text-gray-500">Payment Method</span>
                              <span className={`font-semibold ${order.isPaid ? 'text-green-600' : 'text-orange-600'}`}>
                                {order.paymentMethod.toUpperCase()} {order.isPaid ? '(Paid)' : '(Pending)'}
                              </span>
                            </div>
                          </div>

                          {/* Right: Map Placeholder */}
                          <div className="space-y-3">
                            <h4 className="text-sm font-bold text-gray-900">Delivery Location</h4>
                            <div className="h-48 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden border border-gray-200">
                              <img 
                                src="https://maps.googleapis.com/maps/api/staticmap?center=22.5937,72.9629&zoom=15&size=400x300&maptype=roadmap"
                                alt="Map location"
                                className="w-full h-full object-cover opacity-60"
                                onError={(e) => {
                                  e.currentTarget.src = 'https://via.placeholder.com/400x300/e5e7eb/9ca3af?text=📍+Map+Location';
                                }}
                              />
                            </div>

                            {/* Timeline */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-3 text-xs">
                                <div className="w-2 h-2 bg-green-500 rounded-full" />
                                <span className="text-gray-600">Created: {formatDate(order.createdAt)}</span>
                              </div>
                              {order.acceptedAt && (
                                <div className="flex items-center gap-3 text-xs">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                  <span className="text-gray-600">Accepted: {formatDate(order.acceptedAt)}</span>
                                </div>
                              )}
                              {order.completedAt && (
                                <div className="flex items-center gap-3 text-xs">
                                  <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                                  <span className="text-gray-600">Completed: {formatDate(order.completedAt)}</span>
                                </div>
                              )}
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
    </div>
  );
}
