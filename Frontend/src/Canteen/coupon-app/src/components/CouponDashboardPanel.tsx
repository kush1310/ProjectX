import React, { useEffect, useState } from 'react';
import type { CouponDashboard, Coupon, RushHourTimerInfo } from '../../../utils/canteenStore';
import { Ticket, CheckCircle2, Timer, BarChart3, Flame } from 'lucide-react';

interface Props {
    dashboard: CouponDashboard | null;
    coupons: Coupon[];
}

const CouponDashboardPanel: React.FC<Props> = ({ dashboard, coupons }) => {
    const [timers, setTimers] = useState<RushHourTimerInfo[]>([]);

    // Live countdown timer
    useEffect(() => {
        if (dashboard?.liveTimers) {
            setTimers(dashboard.liveTimers);
        }
    }, [dashboard]);

    useEffect(() => {
        const interval = setInterval(() => {
            setTimers(prev =>
                prev.map(t => ({
                    ...t,
                    remainingSeconds: Math.max(t.remainingSeconds - 1, 0),
                    isCurrentlyActive: t.remainingSeconds > 0,
                }))
            );
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const formatTime = (seconds: number): string => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const stats = [
        {
            label: 'Total Coupons',
            value: dashboard?.totalCoupons ?? coupons.length,
            icon: Ticket,
            color: 'text-indigo-600',
            bg: 'bg-indigo-50',
        },
        {
            label: 'Active Coupons',
            value: dashboard?.activeCoupons ?? coupons.filter(c => c.isActive).length,
            icon: CheckCircle2,
            color: 'text-green-600',
            bg: 'bg-green-50',
        },
        {
            label: 'Expired',
            value: dashboard?.expiredCoupons ?? 0,
            icon: Timer,
            color: 'text-orange-600',
            bg: 'bg-orange-50',
        },
        {
            label: 'Total Usages',
            value: dashboard?.totalUsageCount ?? 0,
            icon: BarChart3,
            color: 'text-cyan-600',
            bg: 'bg-cyan-50',
        },
    ];

    return (
        <div>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                                <h3 className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</h3>
                            </div>
                            <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                                <stat.icon size={20} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Rush Hour Live Timers - Clean Version */}
            {timers.length > 0 && (
                <div className="bg-white rounded-xl border border-red-100 shadow-sm overflow-hidden mb-8">
                    <div className="px-6 py-4 border-b border-red-50 bg-red-50/30 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-red-700 flex items-center gap-2">
                            <Flame size={16} className="text-red-500" />
                            LIVE RUSH HOURS
                        </h3>
                        <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded-full animate-pulse">
                            Active Issues
                        </span>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {timers.map(timer => (
                            <div
                                key={timer.couponId}
                                className={`
                                    rounded-lg p-4 border transition-all
                                    ${timer.isCurrentlyActive
                                        ? 'border-red-200 bg-red-50/20'
                                        : 'border-gray-200 bg-gray-50 opacity-60'}
                                `}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-semibold text-gray-900 text-sm">
                                        {timer.title || timer.couponCode}
                                    </span>
                                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${timer.isCurrentlyActive ? 'bg-red-100 text-red-600' : 'bg-gray-200 text-gray-500'}`}>
                                        {timer.isCurrentlyActive ? 'LIVE' : 'ENDED'}
                                    </span>
                                </div>
                                <div className="font-mono text-xl font-bold text-gray-800">
                                    {formatTime(timer.remainingSeconds)}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    {timer.rushHourStart} — {timer.rushHourEnd}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CouponDashboardPanel;
