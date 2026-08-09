import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { TrendingUp, ShoppingBag, IndianRupee, Clock, Users, Award, Download } from 'lucide-react';
import { getOrders, Order, OrderItem } from '../utils/canteenStore';
import api from '@/utils/api';
import { toast } from '@/utils/toast';
import { useWebSocket } from '@/hooks/useWebSocket';

// ─── Colour Tokens ────────────────────────────────────────────────────────────
const BRAND_RED   = '#E23744';
const VENDOR_BLUE = '#3D6EEE';
const VEG_GREEN   = '#1BA672';
const GOLD        = '#F5A623';
const SLATE_500   = '#64748b';

const STATUS_COLOURS: Record<string, string> = {
  COMPLETED:  VEG_GREEN,
  PENDING:    GOLD,
  PREPARING:  VENDOR_BLUE,
  CANCELLED:  '#EF4444',
  READY:      '#8B5CF6',
  CONFIRMED:  '#06B6D4',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * formatCurrency
 *
 * Formats a numeric value as a short Indian-locale currency string.
 * Values >= 1 lakh are displayed as "X.XXL"; >= 1000 as "X.XXK"; below as "₹X".
 *
 * @param  value {number} - Raw rupee amount.
 * @returns      {string} - Formatted display string.
 */
function formatCurrency(value: number): string {
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000)   return `₹${(value / 1000).toFixed(1)}K`;
  return `₹${Math.round(value)}`;
}

/**
 * getLast7Days
 *
 * Returns an array of 7 date strings in "DD Mon" format starting from
 * 6 days ago up to and including today, used as X-axis labels for the
 * revenue trend chart.
 *
 * @returns {string[]} - Array of 7 formatted date labels.
 */
/**
 * getDaysForPeriod
 *
 * Returns an array of date strings formatted as "DD Mon" covering the requested period:
 * 7 days for '7d', 30 days for '30d' or 'all'.
 *
 * @param  period {'7d' | '30d' | 'all'} - Selected time window.
 * @returns       {string[]}             - Array of formatted date labels.
 */
function getDaysForPeriod(period: '7d' | '30d' | 'all'): string[] {
  const days = period === '7d' ? 7 : 30;
  return Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  });
}

/**
 * buildDailyRevenue
 *
 * Aggregates COMPLETED/DELIVERED orders into daily revenue buckets over the active period.
 * Returns an array suitable for Recharts AreaChart.
 *
 * @param  orders {Order[]}                 - Full order list.
 * @param  period {'7d' | '30d' | 'all'}     - Active timeframe selection.
 * @returns       {Array}                   - [{day, revenue, orders}].
 */
function buildDailyRevenue(orders: Order[], period: '7d' | '30d' | 'all'): { day: string; revenue: number; orders: number }[] {
  const labels = getDaysForPeriod(period);
  return labels.map(label => {
    const dayOrders = orders.filter(o => {
      if (!o.createdAt) return false;
      const isCompleted = o.status === 'COMPLETED' || (o.status as string) === 'DELIVERED';
      if (!isCompleted) return false;
      const d = new Date(o.createdAt);
      const formatted = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      return formatted === label;
    });
    return {
      day: label,
      revenue: dayOrders.reduce((sum, o) => sum + (o.totalAmount || o.total || 0), 0),
      orders: dayOrders.length,
    };
  });
}

/**
 * buildTopItems
 *
 * Extracts item-level sales counts from completed orders, aggregates totals,
 * and returns the top N items sorted by quantity sold.
 *
 * @param  orders {Order[]} - Full order list.
 * @param  n      {number}  - Number of top items to return (default 5).
 * @returns       {Array}   - [{name, qty, revenue}] sorted descending by qty.
 */
function buildTopItems(orders: Order[], n = 5): { name: string; qty: number; revenue: number }[] {
  const map: Record<string, { qty: number; revenue: number }> = {};
  orders.forEach(order => {
    const isCompleted = order.status === 'COMPLETED' || (order.status as string) === 'DELIVERED';
    if (!isCompleted) return;
    (order.items || []).forEach((item: OrderItem) => {
      const itemName = item.menuItem?.name || item.name || 'Unknown';
      const itemPrice = item.totalPrice ? (item.totalPrice / (item.quantity || 1)) : (item.price || 0);
      const itemQty = item.quantity || 1;
      if (!map[itemName]) map[itemName] = { qty: 0, revenue: 0 };
      map[itemName].qty += itemQty;
      map[itemName].revenue += item.totalPrice || (itemPrice * itemQty);
    });
  });
  return Object.entries(map)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, n);
}

/**
 * buildStatusBreakdown
 *
 * Counts orders grouped by their status string, returning the data format
 * required by Recharts PieChart.
 *
 * @param  orders {Order[]} - Full order list.
 * @returns       {Array}   - [{name, value, color}] per status.
 */
function buildStatusBreakdown(orders: Order[]): { name: string; value: number; color: string }[] {
  const map: Record<string, number> = {};
  orders.forEach(o => { map[o.status] = (map[o.status] || 0) + 1; });
  return Object.entries(map).map(([status, count]) => ({
    name: status,
    value: count,
    color: STATUS_COLOURS[status] || SLATE_500,
  }));
}

/**
 * buildHourlyHeatmap
 *
 * Aggregates orders by their creation hour (0–23) and returns a 24-entry
 * array with order count per hour. Used to render the peak-hour bar chart.
 *
 * @param  orders {Order[]} - Full order list.
 * @returns       {Array}   - [{hour: string, orders: number}].
 */
function buildHourlyHeatmap(orders: Order[]): { hour: string; orders: number }[] {
  const buckets = Array.from({ length: 24 }, (_, h) => ({ hour: `${h}:00`, orders: 0 }));
  orders.forEach(o => {
    if (!o.createdAt) return;
    const h = new Date(o.createdAt).getHours();
    buckets[h].orders += 1;
  });
  return buckets;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  readonly label:     string;
  readonly value:     string;
  readonly delta?:    string;
  readonly positive?: boolean;
  readonly icon:      React.ReactNode;
  readonly accent:    string;
}

function StatCard({ label, value, delta, positive, icon, accent }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: accent + '18' }}>
          <span style={{ color: accent }}>{icon}</span>
        </div>
        {delta && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${positive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
            {delta}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 font-medium mt-1 uppercase tracking-wide">{label}</p>
    </motion.div>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function RevenueTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-lg text-sm">
      <p className="font-bold text-gray-800 mb-1">{label}</p>
      <p className="text-[#E23744] font-semibold">{formatCurrency(payload[0]?.value ?? 0)} revenue</p>
      <p className="text-gray-500">{payload[1]?.value ?? 0} orders</p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function VendorReporting() {
  const [orders, setOrders]   = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod]   = useState<'7d' | '30d' | 'all'>('7d');
  const [canteenId, setCanteenId] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const { isConnected, subscribe } = useWebSocket();

  const loadData = useCallback(() => {
    Promise.all([
      getOrders().catch(() => []),
      api.get('/canteens/my-canteen').catch(() => null)
    ]).then(([ordersData, canteenRes]) => {
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      if (canteenRes?.data?.canteen?.id) {
        setCanteenId(canteenRes.data.canteen.id);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time STOMP listener for sell reporting
  useEffect(() => {
    if (!isConnected) return;
    const handleWsOrder = () => {
      loadData();
    };
    const sub1 = subscribe('/topic/orders', handleWsOrder);
    const sub2 = subscribe('/topic/order-updates', handleWsOrder);
    const sub3 = canteenId ? subscribe(`/topic/restaurant/${canteenId}`, handleWsOrder) : null;
    return () => {
      sub1?.unsubscribe();
      sub2?.unsubscribe();
      sub3?.unsubscribe();
    };
  }, [isConnected, subscribe, canteenId, loadData]);

  const handleExportCSV = async () => {
    if (!canteenId) {
      toast.error('Canteen ID not found for export');
      return;
    }
    try {
      setIsExporting(true);
      const res = await api.get(`/vendor/${canteenId}/analytics/export?format=csv`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `analytics_canteen_${canteenId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('CSV report downloaded successfully');
    } catch (e) {
      toast.error('Failed to export CSV report');
    } finally {
      setIsExporting(false);
    }
  };

  // Filter by selected period
  const filteredOrders = useMemo(() => {
    if (period === 'all') return orders;
    const days = period === '7d' ? 7 : 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    cutoff.setHours(0, 0, 0, 0); // Include full start day
    return orders.filter(o => o.createdAt && new Date(o.createdAt) >= cutoff);
  }, [orders, period]);

  // Derived metrics - strictly count COMPLETED / DELIVERED orders for revenue
  const completedOrders = useMemo(() => filteredOrders.filter(o => o.status === 'COMPLETED' || (o.status as string) === 'DELIVERED'), [filteredOrders]);
  const totalRevenue   = useMemo(() => completedOrders.reduce((sum, o) => sum + (o.totalAmount || o.total || 0), 0), [completedOrders]);
  const completedCount = useMemo(() => completedOrders.length, [completedOrders]);
  const cancelRate     = useMemo(() => filteredOrders.length > 0 ? Math.round((filteredOrders.filter(o => o.status === 'CANCELLED').length / filteredOrders.length) * 100) : 0, [filteredOrders]);
  const avgOrderValue  = useMemo(() => completedCount > 0 ? totalRevenue / completedCount : 0, [totalRevenue, completedCount]);

  const dailyRevenue  = useMemo(() => buildDailyRevenue(filteredOrders, period), [filteredOrders, period]);
  const topItems      = useMemo(() => buildTopItems(filteredOrders), [filteredOrders]);
  const statusData    = useMemo(() => buildStatusBreakdown(filteredOrders), [filteredOrders]);
  const hourlyData    = useMemo(() => buildHourlyHeatmap(filteredOrders), [filteredOrders]);

  const maxHourlyOrders = useMemo(() => Math.max(...hourlyData.map(h => h.orders), 1), [hourlyData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-4 border-[#E23744] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 pb-24">

      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Reporting Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">Revenue, orders, and item performance at a glance</p>
        </div>
        {/* Actions & Period Selector */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            disabled={isExporting || !canteenId}
            className="px-4 py-2 rounded-xl bg-white border border-gray-200 hover:border-red-300 text-gray-700 hover:text-red-600 font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-red-600" />
            <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>

          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            {(['7d', '30d', 'all'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${period === p ? 'bg-white text-[#E23744] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {p === '7d' ? 'Last 7 days' : p === '30d' ? 'Last 30 days' : 'All time'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Revenue"    value={formatCurrency(totalRevenue)}      icon={<IndianRupee size={20} />} accent={BRAND_RED} />
        <StatCard label="Orders Completed" value={String(completedCount)}            icon={<ShoppingBag  size={20} />} accent={VENDOR_BLUE} />
        <StatCard label="Avg Order Value"  value={formatCurrency(avgOrderValue)}     icon={<TrendingUp   size={20} />} accent={VEG_GREEN} />
        <StatCard label="Cancellation Rate" value={`${cancelRate}%`}
          delta={cancelRate > 10 ? `+${cancelRate}%` : `${cancelRate}%`}
          positive={cancelRate <= 10}
          icon={<Users size={20} />} accent={GOLD} />
      </div>

      {/* ── Revenue Trend + Status Pie ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* Area Chart — Revenue Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm"
        >
          <p className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">Daily Revenue Trend</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={dailyRevenue} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={BRAND_RED} stopOpacity={0.18} />
                  <stop offset="95%" stopColor={BRAND_RED} stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: SLATE_500 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => formatCurrency(v)} tick={{ fontSize: 11, fill: SLATE_500 }} axisLine={false} tickLine={false} width={52} />
              <Tooltip content={<RevenueTooltip />} />
              <Area type="monotone" dataKey="revenue" stroke={BRAND_RED} strokeWidth={2.5} fill="url(#revenueGradient)" dot={{ fill: BRAND_RED, r: 3 }} activeDot={{ r: 5 }} />
              <Area type="monotone" dataKey="orders"  stroke={VENDOR_BLUE} strokeWidth={1.5} fill="transparent" strokeDasharray="4 2" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex gap-5 mt-3">
            <div className="flex items-center gap-1.5"><div className="w-3 h-1 bg-[#E23744] rounded-full" /><span className="text-xs text-gray-400">Revenue</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-1 bg-[#3D6EEE] rounded-full border border-dashed" /><span className="text-xs text-gray-400">Orders</span></div>
          </div>
        </motion.div>

        {/* Pie Chart — Order Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm"
        >
          <p className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">Order Status</p>
          {statusData.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No data</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%" cy="50%"
                    innerRadius={45} outerRadius={72}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number | string | undefined, name: string | undefined) => [`${v ?? 0} orders`, name ?? '']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-3">
                {statusData.map(s => (
                  <div key={s.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                      <span className="text-gray-600 font-medium">{s.name}</span>
                    </div>
                    <span className="font-bold text-gray-800">{s.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* ── Top Items + Peak Hours ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Horizontal Bar Chart — Top 5 Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-4">
            <Award size={16} className="text-[#F5A623]" />
            <p className="text-sm font-bold text-gray-700 uppercase tracking-wide">Top 5 Items by Sales</p>
          </div>
          {topItems.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No order data</div>
          ) : (
            <div className="space-y-3">
              {topItems.map((item, idx) => (
                <div key={item.name}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-bold text-gray-400 w-4">#{idx + 1}</span>
                      <span className="text-sm font-semibold text-gray-800 truncate">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                      <span className="text-xs text-gray-400">{item.qty} sold</span>
                      <span className="text-xs font-bold text-emerald-600">{formatCurrency(item.revenue)}</span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: idx === 0 ? GOLD : idx === 1 ? SLATE_500 : '#c084fc' }}
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.qty / topItems[0].qty) * 100}%` }}
                      transition={{ delay: 0.3 + idx * 0.05, duration: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Bar Chart — Peak Order Hours */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} className="text-[#3D6EEE]" />
            <p className="text-sm font-bold text-gray-700 uppercase tracking-wide">Peak Order Hours</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={hourlyData} margin={{ top: 0, right: 4, bottom: 0, left: 0 }} barSize={8}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 9, fill: SLATE_500 }}
                axisLine={false} tickLine={false}
                interval={3}
              />
              <YAxis hide />
              <Tooltip
                formatter={(v: number | undefined) => [`${v ?? 0} orders`, 'Orders']}
                cursor={{ fill: '#f8fafc' }}
              />
              <Bar
                dataKey="orders"
                radius={[3, 3, 0, 0]}
              >
                {hourlyData.map((entry, idx) => (
                  <Cell
                    key={idx}
                    fill={entry.orders === maxHourlyOrders ? BRAND_RED : entry.orders > maxHourlyOrders * 0.6 ? VENDOR_BLUE : '#e2e8f0'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-3">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[#E23744]" /><span className="text-xs text-gray-400">Peak hour</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[#3D6EEE]" /><span className="text-xs text-gray-400">High traffic</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-gray-200" /><span className="text-xs text-gray-400">Low traffic</span></div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
