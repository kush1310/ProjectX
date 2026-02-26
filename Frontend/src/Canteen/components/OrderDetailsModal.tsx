/**
 * Order Details Modal
 * 
 * Shows complete order information in a centered popup.
 * Uses Portal-like fixed positioning to ensure it appears above all other content.
 * Features background blur and animations.
 */

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '@/components/Icons';
import { ScrollTimeline } from './ScrollTimeline';
import { Order, OrderStatus } from '../utils/canteenStore';

interface OrderDetailsModalProps {
  order: Order | null;
  onClose: () => void;
}

export default function OrderDetailsModal({ order, onClose }: OrderDetailsModalProps) {
  if (!order) return null;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Format date for payment details
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + 
           ', ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const statusColors: Record<OrderStatus, string> = {
    PENDING: 'border-orange-200 text-orange-700 bg-orange-50',
    CONFIRMED: 'border-blue-200 text-blue-700 bg-blue-50',
    PREPARING: 'border-blue-200 text-blue-700 bg-blue-50',
    READY: 'border-purple-200 text-purple-700 bg-purple-50',
    COMPLETED: 'border-emerald-200 text-emerald-700 bg-emerald-50',
    CANCELLED: 'border-red-200 text-red-700 bg-red-50',
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        onWheel={(e) => e.stopPropagation()}
      >
        {/* Backdrop - Blur increased for better focus */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col z-10"
          onWheel={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-2xl font-bold">Order #{order.orderNumber}</h2>
              <p className="text-emerald-100 text-sm mt-1">{order.customerName}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
            >
              <Icons.X />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5" onWheel={(e) => e.stopPropagation()}>
            {/* Status Banner */}
            <div className={`p-3 rounded-xl border flex items-center justify-between ${statusColors[order.status]}`}>
              <span className="text-sm font-semibold">Status</span>
              <span className="text-sm font-bold uppercase tracking-wider">{order.status}</span>
            </div>

            {/* Items */}
            <div className="space-y-3">
              <h3 className="font-bold text-gray-900">Order Items</h3>
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-gray-700">
                    <span className="font-bold text-emerald-600">{item.quantity}x</span> {item.name}
                  </span>
                  <span className="font-bold text-gray-900">₹{item.price.toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Special Notes */}
            {order.specialNotes && (
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                <h4 className="font-bold text-amber-800 text-sm mb-1">Special Instructions</h4>
                <p className="text-amber-700 text-sm">{order.specialNotes}</p>
              </div>
            )}

            {/* Customer Info */}
            <div className="space-y-3">
              <h3 className="font-bold text-gray-900">Customer Details</h3>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                    <Icons.Phone />
                  </div>
                  <span>{order.customerPhone}</span>
                </div>
                <div className="flex items-start gap-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 shrink-0">
                    <Icons.MapPin />
                  </div>
                  <span>{order.customerAddress}</span>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="space-y-3">
              <h3 className="font-bold text-gray-900">Payment Details</h3>
              <div className="p-4 bg-gray-50 rounded-xl space-y-3 border border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm">Method</span>
                  <span className={`font-bold text-sm ${order.isPaid ? 'text-emerald-600' : 'text-orange-600'}`}>
                    {(order.paymentMethod || 'CASH').toUpperCase()} {order.isPaid ? '(Paid)' : '(Pending)'}
                  </span>
                </div>
                {order.isPaid && (
                  <>
                    <div className="h-px bg-gray-200 my-2" />
                    {order.transactionId && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 text-sm">Transaction ID</span>
                        <span className="font-mono text-xs text-gray-800 bg-white border border-gray-200 px-2 py-1 rounded shadow-sm">{order.transactionId}</span>
                      </div>
                    )}
                    {order.paymentMethod === 'upi' && order.upiId && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 text-sm">UPI ID</span>
                        <span className="text-gray-800 text-sm font-medium">{order.upiId}</span>
                      </div>
                    )}
                    {order.paymentMethod === 'card' && order.cardLast4 && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 text-sm">Card</span>
                        <span className="text-gray-800 text-sm font-medium">•••• •••• •••• {order.cardLast4}</span>
                      </div>
                    )}
                    {order.paidAt && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 text-sm">Paid At</span>
                        <span className="text-gray-800 text-sm font-medium">{formatDate(order.paidAt)}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Order Journey Timeline */}
            <div className="pt-6 border-t border-gray-100">
               <h3 className="font-bold text-gray-900 mb-4">Order Journey</h3>
               <div className="relative h-[600px] w-full bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="absolute inset-0 overflow-y-auto custom-scrollbar">
                      <ScrollTimeline 
                        events={[
                          { year: formatDate(order.createdAt).split(',')[1] || 'Now', title: 'Order Placed', description: 'Order received successfully.', icon: <Icons.Grid /> },
                          { year: 'Kitchen', title: 'Preparing', description: 'Chefs are working magic.', icon: <Icons.Clock /> },
                          { year: 'Counter', title: 'Ready', description: 'Head to the counter!', icon: <Icons.Check /> },
                          { year: 'Enjoy', title: 'Completed', description: 'Order picked up.', icon: <Icons.Star /> },
                        ]}
                        title="Track Status"
                        subtitle="Scroll to follow the process"
                        className="bg-transparent min-h-[150%]"
                        cardVariant="elevated"
                        lineColor="bg-gray-200"
                        activeColor="bg-emerald-500"
                      />
                  </div>
               </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between shrink-0">
            <div>
              <span className="text-sm text-gray-500">Total Amount</span>
              <p className="text-3xl font-bold text-gray-900">₹{(order.total || order.totalAmount || 0).toFixed(2)}</p>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 hover:from-emerald-600 hover:to-emerald-700 transition-all active:scale-95"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
