import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, Users, DollarSign, ShoppingBag,
  Star, ArrowUp
} from 'lucide-react';
import api from '../../utils/api';
import { useOnDemandData } from '@/hooks/useOnDemandData';

interface DashboardStats {
  totalOrders: number;
  todayOrders: number;
  pendingOrders: number;
  preparingOrders: number;
  totalRevenue: number;
  todayRevenue: number;
  monthRevenue: number;
  uniqueCustomers: number;
  averageRating: number;
  completionRate: number;
  inProgress: number;
}

interface TopItem {
  name: string;
  orders: number;
  revenue: number;
}

interface SalesData {
  date: string;
  sales: number;
}

interface ReviewData {
  id: number;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export default function AnalyticsDashboard() {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  const fetchAnalyticsData = useCallback(async () => {
    const [statsRes, topRes, salesRes, reviewsRes] = await Promise.all([
      api.get('/analytics/dashboard'),
      api.get('/analytics/top-selling'),
      api.get(`/analytics/sales?period=${period}`),
      api.get('/analytics/reviews/latest')
    ]);
    return {
      stats: statsRes.data as DashboardStats,
      topItems: (topRes.data.items || []) as TopItem[],
      salesData: (salesRes.data.data || []) as SalesData[],
      reviews: (reviewsRes.data.reviews || []) as ReviewData[],
    };
  }, [period]);

  const { data: analytics, loading: isLoading } = useOnDemandData({
    key: `analytics_${period}`,
    fetcher: fetchAnalyticsData,
  });

  const stats = analytics?.stats || null;
  const topItems = analytics?.topItems || [];
  const salesData = analytics?.salesData || [];
  const reviews = analytics?.reviews || [];

  if (isLoading || !stats) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/2 mb-3"></div>
              <div className="h-8 bg-slate-100 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Analytics Dashboard</h1>
          <p className="text-slate-500">Welcome back! Here's your restaurant overview.</p>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-xl p-1 shadow-sm">
          {(['week', 'month', 'year'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                period === p 
                  ? 'bg-[#e23744] text-white' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Orders so far"
          value={stats.totalOrders.toLocaleString()}
          change={`+${stats.todayOrders} today`}
          positive
          icon={<ShoppingBag className="w-5 h-5" />}
          color="bg-[#e23744]"
        />
        <StatCard
          title="Revenue"
          value={`₹${(stats.monthRevenue / 1000).toFixed(1)}K`}
          change="This month"
          positive
          icon={<DollarSign className="w-5 h-5" />}
          color="bg-white"
          textColor="text-slate-700"
        />
        <StatCard
          title="Unique Customers"
          value={stats.uniqueCustomers.toLocaleString()}
          change="All time"
          positive
          icon={<Users className="w-5 h-5" />}
          color="bg-white"
          textColor="text-slate-700"
        />
        <StatCard
          title="Completion Rate"
          value={`${stats.completionRate}%`}
          change="Orders completed"
          positive
          icon={<TrendingUp className="w-5 h-5" />}
          color="bg-white"
          textColor="text-slate-700"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="col-span-2 bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">OVERVIEW</p>
              <h3 className="text-lg font-semibold text-slate-800">Sales Value</h3>
            </div>
          </div>
          <div className="h-64 flex items-end gap-1">
            {salesData.slice(-14).map((day, idx) => {
              const maxSales = Math.max(...salesData.map(d => d.sales), 1);
              const height = (day.sales / maxSales) * 100;
              return (
                <div 
                  key={idx} 
                  className="flex-1 bg-[#e23744]/10 rounded-t-lg hover:bg-[#e23744]/20 transition-colors relative group"
                  style={{ height: `${Math.max(height, 5)}%` }}
                >
                  <div 
                    className="absolute bottom-0 left-0 right-0 bg-[#e23744] rounded-t-lg transition-all"
                    style={{ height: `${height}%` }}
                  />
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    ₹{day.sales}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Goal Overview */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Goal Overview</h3>
          <div className="flex items-center justify-center mb-6">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50" cy="50" r="40"
                  stroke="#f1f5f9" strokeWidth="8" fill="none"
                />
                <circle
                  cx="50" cy="50" r="40"
                  stroke="#e23744" strokeWidth="8" fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${stats.completionRate * 2.51} 251`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold text-slate-800">{stats.completionRate}%</span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Completed</span>
              <span className="font-medium text-slate-800">{stats.totalOrders - stats.inProgress}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">In Progress</span>
              <span className="font-medium text-slate-800">{stats.inProgress}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-3 gap-6 mt-6">
        {/* Latest Reviews */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Latest Reviews</h3>
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <p className="text-slate-500 text-sm">No reviews yet</p>
            ) : (
              reviews.slice(0, 4).map((review) => (
                <div key={review.id} className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-slate-600">
                      {review.customerName.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-slate-800 truncate">
                      {review.customerName}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{review.comment || 'No comment'}</p>
                  </div>
                  <div className="flex items-center gap-1 text-[#e23744]">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="font-medium text-sm">{review.rating}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Selling */}
        <div className="col-span-2 bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Top Selling Dishes</h3>
          <div className="space-y-3">
            {topItems.slice(0, 5).map((item, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-[#e23744]/10 to-[#e23744]/5 rounded-xl flex items-center justify-center">
                  <span className="font-bold text-[#e23744]">#{idx + 1}</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-800">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.orders} orders</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-800">₹{item.revenue}</p>
                  <p className="text-xs text-green-500 flex items-center gap-0.5 justify-end">
                    <ArrowUp className="w-3 h-3" /> profit
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ 
  title, value, change, positive, icon, color, textColor 
}: {
  title: string;
  value: string;
  change: string;
  positive: boolean;
  icon: React.ReactNode;
  color: string;
  textColor?: string;
}) {
  const isRed = color === 'bg-[#e23744]';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${color} rounded-2xl p-5 ${isRed ? 'text-white' : ''} shadow-sm ${
        isRed ? 'shadow-[#e23744]/20' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <p className={`text-sm ${isRed ? 'text-white/80' : 'text-slate-500'}`}>{title}</p>
        <div className={`p-2 rounded-lg ${isRed ? 'bg-white/20' : 'bg-slate-100'}`}>
          {icon}
        </div>
      </div>
      <p className={`text-2xl font-bold ${textColor || ''}`}>{value}</p>
      <p className={`text-xs mt-1 flex items-center gap-1 ${
        isRed ? 'text-white/70' : positive ? 'text-green-500' : 'text-slate-500'
      }`}>
        {positive && !isRed && <ArrowUp className="w-3 h-3" />}
        {change}
      </p>
    </motion.div>
  );
}
