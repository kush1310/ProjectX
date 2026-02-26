import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Bell, ChevronDown,
  Check, X, Clock, RefreshCw, User
} from 'lucide-react';
import { getOrders, updateOrderStatus, type Order } from '../utils/canteenStore';
import { useWebSocket } from '../../hooks/useWebSocket';
import { toast } from '../../utils/toast';

type TabType = 'preparing' | 'ready' | 'completed';

export default function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('preparing');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { isConnected, subscribe } = useWebSocket();

  // Fetch orders
  useEffect(() => {
    fetchOrders();
  }, []);

  // WebSocket subscription
  useEffect(() => {
    if (!isConnected) return;

    const sub1 = subscribe('/topic/orders', (newOrder) => {
      setOrders(prev => [newOrder, ...prev]);
      toast.success('New order received!');
    });

    const sub2 = subscribe('/topic/order-updates', (updated) => {
      setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
    });

    return () => {
      sub1?.unsubscribe();
      sub2?.unsubscribe();
    };
  }, [isConnected, subscribe]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const data = await getOrders();
      // Ensure data is always an array to prevent .filter errors
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error('Failed to load orders');
      setOrders([]); // Reset to empty array on error
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

  // Filter orders by tab
  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchQuery === '' || 
      order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer?.fullName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTab = 
      (activeTab === 'preparing' && ['PENDING', 'CONFIRMED', 'PREPARING'].includes(order.status)) ||
      (activeTab === 'ready' && order.status === 'READY') ||
      (activeTab === 'completed' && ['COMPLETED', 'CANCELLED'].includes(order.status));
    
    return matchesSearch && matchesTab;
  });

  const tabCounts = {
    preparing: orders.filter(o => ['PENDING', 'CONFIRMED', 'PREPARING'].includes(o.status)).length,
    ready: orders.filter(o => o.status === 'READY').length,
    completed: orders.filter(o => ['COMPLETED', 'CANCELLED'].includes(o.status)).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-[#e23744]">CharusatNeeds</h1>
            <span className="hidden sm:inline text-xs text-slate-500">— vendor partner —</span>
          </div>

          {/* Search Bar */}
          <div className="hidden md:block flex-1 max-w-xl mx-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Look for orders by ID, food item or customer name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#e23744]/20 focus:border-[#e23744] transition-all"
              />
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="hidden sm:inline text-green-600 font-medium">online</span>
              <span className="hidden sm:inline text-slate-400">|</span>
              <span className="hidden sm:inline text-slate-500">1 offline</span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </div>
            <button className="relative p-2 hover:bg-slate-100 rounded-full transition-colors">
              <Bell className="w-5 h-5 text-slate-600" />
              {tabCounts.preparing > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#e23744] text-white text-xs rounded-full flex items-center justify-center">
                  {tabCounts.preparing}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-4 sm:px-6 pb-4 overflow-x-auto no-scrollbar">
          {(['preparing', 'ready', 'completed'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2
                ${activeTab === tab 
                  ? 'bg-[#e23744] text-white shadow-lg shadow-[#e23744]/25' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === tab ? 'bg-white/20' : 'bg-slate-200'
              }`}>
                {tabCounts[tab]}
              </span>
            </button>
          ))}
          
          <button 
            onClick={fetchOrders}
            className="ml-auto p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <RefreshCw className={`w-5 h-5 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* Orders Grid */}
      <main className="p-4 sm:p-6">
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-1/3 mb-4"></div>
                <div className="h-3 bg-slate-100 rounded w-2/3 mb-2"></div>
                <div className="h-3 bg-slate-100 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
              <Clock className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-700">No orders in {activeTab}</h3>
            <p className="text-slate-500 mt-1">Orders will appear here when received</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 kiosk:grid-cols-4 tv:grid-cols-5">
              {filteredOrders.map((order) => (
                <OrderCard 
                  key={order.id} 
                  order={order} 
                  onStatusUpdate={handleStatusUpdate}
                />
              ))}
            </div>
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}

// Order Card Component
function OrderCard({ order, onStatusUpdate }: { 
  order: Order; 
  onStatusUpdate: (id: number, status: string) => void;
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-100 text-amber-700';
      case 'CONFIRMED': return 'bg-blue-100 text-blue-700';
      case 'PREPARING': return 'bg-blue-100 text-blue-700';
      case 'READY': return 'bg-green-100 text-green-700';
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-700';
      case 'CANCELLED': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getNextAction = (status: string) => {
    switch (status) {
      case 'PENDING': return { label: 'Accept Order', next: 'CONFIRMED', color: 'bg-blue-500' };
      case 'CONFIRMED': return { label: 'Start Preparing', next: 'PREPARING', color: 'bg-blue-500' };
      case 'PREPARING': return { label: 'Mark Ready', next: 'READY', color: 'bg-green-500' };
      case 'READY': return { label: 'Complete Order', next: 'COMPLETED', color: 'bg-emerald-500' };
      default: return null;
    }
  };

  const action = getNextAction(order.status);
  const paymentPaid = order.paymentStatus === 'PAID';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-lg transition-shadow"
    >
      {/* Header with delivery type */}
      <div className={`px-4 py-2 text-xs font-semibold ${
        order.paymentMethod === 'upi' ? 'bg-[#e23744] text-white' : 'bg-slate-100 text-slate-600'
      }`}>
        {order.paymentMethod === 'upi' ? 'ONLINE PAYMENT' : 'SELF PICKUP'}
      </div>

      <div className="p-4">
        {/* Order Info */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-semibold text-slate-800">
              ID: {order.orderNumber}
            </h3>
            <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
              <User className="w-3.5 h-3.5" />
              {order.customer?.fullName || 'Customer'}
            </p>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
            {order.status}
          </span>
        </div>

        {/* Items */}
        <div className="space-y-2 mb-4 border-t border-b border-slate-100 py-3">
          {order.items?.slice(0, 3).map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-sm border ${
                  item.menuItem?.isVeg ? 'border-green-500 bg-green-500' : 'border-red-500 bg-red-500'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full bg-white block m-[2px]`}></span>
                </span>
                {item.quantity} x {item.menuItem?.name}
              </span>
              <span className="text-slate-600">₹{item.totalPrice}</span>
            </div>
          ))}
          {(order.items?.length || 0) > 3 && (
            <p className="text-xs text-slate-400">+{(order.items?.length || 0) - 3} more items</p>
          )}
        </div>

        {/* Total & Payment */}
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm text-slate-600">Total bill</span>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 text-xs rounded ${
              paymentPaid ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
            }`}>
              {paymentPaid ? 'PAID' : 'UNPAID'}
            </span>
            <span className="font-bold text-lg">₹{order.totalAmount}</span>
          </div>
        </div>

        {/* Timeline */}
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
          <Clock className="w-3.5 h-3.5" />
          <span>
            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Actions */}
        {action && (
          <div className="flex gap-2">
            <button
              onClick={() => onStatusUpdate(order.id, action.next)}
              className={`flex-1 py-3 rounded-xl text-white font-medium ${action.color} hover:opacity-90 transition-opacity flex items-center justify-center gap-2`}
            >
              {action.label}
            </button>
            {order.status === 'PENDING' && (
              <button
                onClick={() => onStatusUpdate(order.id, 'CANCELLED')}
                className="px-4 py-3 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {order.status === 'COMPLETED' && (
          <div className="flex items-center justify-center gap-2 py-3 bg-emerald-50 rounded-xl text-emerald-600">
            <Check className="w-5 h-5" />
            <span className="font-medium">Order Completed</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}