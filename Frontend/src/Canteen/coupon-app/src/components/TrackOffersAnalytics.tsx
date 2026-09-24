/**
 * TrackOffersAnalytics — Real-time coupon performance dashboard.
 *
 * Renders only data that actually comes from the backend — no hardcoded fake
 * metrics, no static percentage trends. Shows a per-type performance table,
 * sales-vs-discount sparkline chart, and a period-range selector.
 *
 * Data source: GET /api/coupons/analytics?period=WEEKLY|MONTHLY
 * Refreshes automatically whenever the user changes the time range.
 *
 * @param coupons  {Coupon[]}  — full coupon list (used to enrich table rows)
 */
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getCouponAnalytics, type CouponAnalytics, type Coupon } from '../../../utils/canteenStore';

interface TrackOffersAnalyticsProps {
    coupons: Coupon[];
}

const TYPE_COLOR: Record<string, string> = {
    GENERAL:      '#E23744',
    BOGO:         '#3D6EEE',
    ITEM_SPECIFIC:'#F97316',
    COMBO:        '#8B5CF6',
    RUSH_HOUR:    '#10B981',
    NEW_DISH:     '#F59E0B',
};

const TYPE_LABEL: Record<string, string> = {
    GENERAL:      'General',
    BOGO:         'BOGO',
    ITEM_SPECIFIC:'Item-Specific',
    COMBO:        'Combo',
    RUSH_HOUR:    'Rush Hour',
    NEW_DISH:     'New Dish',
};

/**
 * Renders a small inline sparkline as an SVG polyline.
 * @param data   {number[]} — values to plot
 * @param color  {string}   — stroke color
 */
const Sparkline: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
    if (!data.length) return null;
    const max = Math.max(...data, 1);
    const w = 80; const h = 28;
    const pts = data
        .map((v, i) => `${(i / Math.max(data.length - 1, 1)) * w},${h - (v / max) * h}`)
        .join(' ');
    return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
            <polyline
                points={pts}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
            />
        </svg>
    );
};

export const TrackOffersAnalytics: React.FC<TrackOffersAnalyticsProps> = ({ coupons }) => {
    const [timeRange, setTimeRange] = useState<'7d' | '30d'>('7d');
    const [analytics, setAnalytics]   = useState<CouponAnalytics | null>(null);
    const [isLoading, setIsLoading]   = useState(true);
    const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

    /**
     * loadAnalytics
     *
     * Fetches analytics from GET /api/coupons/analytics with the current
     * period parameter. Sets isLoading during the request so the UI shows
     * a loading indicator without hiding existing data.
     *
     * @param period  'WEEKLY' | 'MONTHLY'
     */
    const loadAnalytics = (period: 'WEEKLY' | 'MONTHLY') => {
        setIsLoading(true);
        getCouponAnalytics(period)
            .then(data => {
                setAnalytics(data);
                setLastRefreshed(new Date());
                setIsLoading(false);
            })
            .catch(() => setIsLoading(false));
    };

    useEffect(() => {
        loadAnalytics(timeRange === '7d' ? 'WEEKLY' : 'MONTHLY');
    }, [timeRange]);

    // ── Derived chart data ──────────────────────────────────────────────────

    const salesPoints  = (analytics?.salesVsDiscount ?? []).map(p => p.totalSales);
    const discPoints   = (analytics?.salesVsDiscount ?? []).map(p => p.totalDiscount);
    const chartLabels  = (analytics?.salesVsDiscount ?? []).map(p => p.period.substring(0, 3));
    const maxLine      = Math.max(...salesPoints, ...discPoints, 1);

    // Total summary row
    const totalUsed    = (analytics?.typePerformance ?? []).reduce((s, t) => s + (t.timesUsed || 0), 0);
    const totalDisc    = (analytics?.typePerformance ?? []).reduce((s, t) => s + (t.totalDiscount || 0), 0);
    const totalRevenue = (analytics?.typePerformance ?? []).reduce(
        (s, t) => s + (t.timesUsed || 0) * (typeof t.avgOrderValue === 'number' ? t.avgOrderValue : parseFloat(String(t.avgOrderValue || 0))),
        0
    );

    const hasData = (analytics?.typePerformance?.length ?? 0) > 0;

    // ── Rendering ───────────────────────────────────────────────────────────

    return (
        <div style={{ position: 'relative' }}>

            {/* Progress bar shown during data fetch */}
            {isLoading && (
                <div style={{
                    position: 'absolute', top: -6, left: 0, right: 0,
                    height: 3, background: '#f3f4f6', borderRadius: 2, overflow: 'hidden', zIndex: 10,
                }}>
                    <div style={{
                        height: '100%', width: '45%',
                        background: 'linear-gradient(90deg, #E23744, #F97316)',
                        borderRadius: 2,
                        animation: 'analyticsBarSlide 1.1s ease-in-out infinite',
                    }} />
                    <style>{`
                        @keyframes analyticsBarSlide {
                            0%   { transform: translateX(-120%); }
                            100% { transform: translateX(350%);  }
                        }
                    `}</style>
                </div>
            )}

            {/* Header — title + range toggle + refresh */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 12, flexWrap: 'wrap' }}>
                <div>
                    <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111827', marginBottom: 4 }}>
                        Coupon Performance
                    </h2>
                    <p style={{ fontSize: 12, color: '#9ca3af' }}>
                        {isLoading
                            ? 'Fetching latest data...'
                            : `Last updated ${lastRefreshed.toLocaleTimeString()}`}
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {/* Time range pill toggle */}
                    <div style={{ display: 'flex', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
                        {(['7d', '30d'] as const).map((r, i) => (
                            <button
                                key={r}
                                onClick={() => setTimeRange(r)}
                                style={{
                                    padding: '7px 14px', fontSize: 13, fontWeight: 600,
                                    border: 'none', cursor: 'pointer',
                                    borderLeft: i > 0 ? '1px solid #e5e7eb' : 'none',
                                    background: timeRange === r ? '#1e293b' : '#fff',
                                    color:      timeRange === r ? '#fff'    : '#6b7280',
                                    transition: 'all 0.15s',
                                }}
                            >
                                {r === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
                            </button>
                        ))}
                    </div>
                    {/* Manual refresh button */}
                    <button
                        onClick={() => loadAnalytics(timeRange === '7d' ? 'WEEKLY' : 'MONTHLY')}
                        title="Refresh data"
                        style={{
                            width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff',
                            cursor: 'pointer', color: '#6b7280',
                        }}
                    >
                        <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Summary Totals Row — only rendered when actual data exists */}
            {hasData && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}
                >
                    {[
                        { label: 'Total Redemptions', value: totalUsed.toLocaleString() },
                        { label: 'Discount Given',    value: `Rs.${totalDisc.toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
                        { label: 'Est. Order Revenue',value: `Rs.${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
                    ].map((s) => (
                        <div
                            key={s.label}
                            style={{
                                flex: '1 1 160px', background: '#fff',
                                border: '1px solid #f3f4f6', borderRadius: 12,
                                padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                            }}
                        >
                            <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                                {s.label}
                            </p>
                            <p style={{ fontSize: 24, fontWeight: 800, color: '#111827' }}>
                                {s.value}
                            </p>
                        </div>
                    ))}
                </motion.div>
            )}

            {/* Per-Type Performance Table */}
            <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                style={{
                    background: '#fff', border: '1px solid #f3f4f6',
                    borderRadius: 14, overflow: 'hidden',
                    boxShadow: '0 1px 6px rgba(0,0,0,0.06)', marginBottom: 20,
                }}
            >
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Offer Type Breakdown</div>
                        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Live redemption data from the database</div>
                    </div>
                </div>

                {isLoading && !hasData ? (
                    /* Skeleton rows while loading for the first time */
                    <div style={{ padding: '0 20px' }}>
                        {[1, 2, 3].map(i => (
                            <div key={i} style={{ display: 'flex', gap: 12, padding: '14px 0', borderBottom: '1px solid #f9fafb', alignItems: 'center' }}>
                                <div style={{ width: 90, height: 10, background: '#f3f4f6', borderRadius: 5 }} />
                                <div style={{ flex: 1, height: 10, background: '#f3f4f6', borderRadius: 5 }} />
                                <div style={{ width: 60, height: 10, background: '#f3f4f6', borderRadius: 5 }} />
                                <div style={{ width: 60, height: 10, background: '#f3f4f6', borderRadius: 5 }} />
                            </div>
                        ))}
                    </div>
                ) : !hasData ? (
                    /* Empty state — no redemptions yet */
                    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                        <div style={{ fontSize: 36, marginBottom: 8 }}>--</div>
                        <p style={{ fontSize: 14, color: '#6b7280', fontWeight: 600 }}>No redemption data for this period</p>
                        <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                            When a customer uses a coupon, it will appear here in real time.
                        </p>
                    </div>
                ) : (
                    /* Data table */
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead>
                                <tr style={{ background: '#f9fafb' }}>
                                    {['Offer Type', 'Redemptions', 'Discount Given', 'Avg. Order', 'Trend'].map(h => (
                                        <th key={h} style={{
                                            padding: '10px 16px', textAlign: 'left',
                                            fontWeight: 700, color: '#6b7280',
                                            fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em',
                                            whiteSpace: 'nowrap',
                                        }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {analytics!.typePerformance.map((t, idx) => {
                                    const color   = TYPE_COLOR[t.couponType] ?? '#6b7280';
                                    const label   = TYPE_LABEL[t.couponType] ?? t.couponType;
                                    const disc    = typeof t.totalDiscount === 'string' ? parseFloat(t.totalDiscount) : (t.totalDiscount ?? 0);
                                    const avg     = typeof t.avgOrderValue  === 'string' ? parseFloat(t.avgOrderValue)  : (t.avgOrderValue  ?? 0);
                                    // Determine trend direction from sales data
                                    const last2   = salesPoints.slice(-2);
                                    const trending = last2.length < 2
                                        ? 'neutral'
                                        : last2[1] > last2[0] ? 'up' : last2[1] < last2[0] ? 'down' : 'neutral';

                                    return (
                                        <tr key={t.couponType} style={{ borderTop: idx > 0 ? '1px solid #f9fafb' : 'none' }}>
                                            <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <span style={{
                                                        display: 'inline-block', width: 10, height: 10,
                                                        borderRadius: '50%', background: color, flexShrink: 0,
                                                    }} />
                                                    <span style={{ fontWeight: 700, color: '#111827' }}>{label}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px 16px', fontWeight: 600, color: '#374151' }}>
                                                {(t.timesUsed ?? 0).toLocaleString()}
                                            </td>
                                            <td style={{ padding: '12px 16px', fontWeight: 600, color: '#E23744' }}>
                                                Rs.{disc.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                            </td>
                                            <td style={{ padding: '12px 16px', color: '#6b7280' }}>
                                                Rs.{avg.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                            </td>
                                            <td style={{ padding: '12px 16px' }}>
                                                {trending === 'up'   && <TrendingUp size={16} style={{ color: '#10b981' }} />}
                                                {trending === 'down' && <TrendingDown size={16} style={{ color: '#ef4444' }} />}
                                                {trending === 'neutral' && <Minus size={16} style={{ color: '#9ca3af' }} />}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </motion.div>

            {/* Sales vs Discount sparkline chart — only when data is available */}
            {salesPoints.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    style={{
                        background: '#fff', border: '1px solid #f3f4f6',
                        borderRadius: 14, padding: '16px 20px',
                        boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Sales vs Discount Over Time</div>
                            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Total order value vs total discount given</div>
                        </div>
                        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#6b7280' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ width: 12, height: 3, borderRadius: 2, background: '#3b82f6', display: 'inline-block' }} />
                                Order Value
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ width: 12, height: 3, borderRadius: 2, background: '#E23744', display: 'inline-block' }} />
                                Discount
                            </span>
                        </div>
                    </div>

                    {/* SVG Line Chart */}
                    <svg viewBox="0 0 500 160" style={{ width: '100%', height: 160 }} preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
                                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                            </linearGradient>
                            <linearGradient id="discGrad2" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#E23744" stopOpacity="0.12" />
                                <stop offset="100%" stopColor="#E23744" stopOpacity="0" />
                            </linearGradient>
                        </defs>

                        {/* Horizontal grid lines */}
                        {[0, 1, 2, 3].map(i => (
                            <line key={i} x1="0" y1={10 + i * 38} x2="500" y2={10 + i * 38} stroke="#f3f4f6" strokeWidth="1" />
                        ))}

                        {/* Sales area fill */}
                        <path
                            d={`M${salesPoints.map((v, i) => `${(i / Math.max(salesPoints.length - 1, 1)) * 490 + 5},${140 - (v / maxLine) * 120}`).join(' L')} L${495},140 L5,140 Z`}
                            fill="url(#salesGrad)"
                        />
                        {/* Sales line */}
                        <polyline
                            points={salesPoints.map((v, i) => `${(i / Math.max(salesPoints.length - 1, 1)) * 490 + 5},${140 - (v / maxLine) * 120}`).join(' ')}
                            fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"
                        />

                        {/* Discount area fill */}
                        <path
                            d={`M${discPoints.map((v, i) => `${(i / Math.max(discPoints.length - 1, 1)) * 490 + 5},${140 - (v / maxLine) * 120}`).join(' L')} L${495},140 L5,140 Z`}
                            fill="url(#discGrad2)"
                        />
                        {/* Discount line */}
                        <polyline
                            points={discPoints.map((v, i) => `${(i / Math.max(discPoints.length - 1, 1)) * 490 + 5},${140 - (v / maxLine) * 120}`).join(' ')}
                            fill="none" stroke="#E23744" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" strokeDasharray="4 3"
                        />

                        {/* X-axis labels */}
                        {chartLabels.map((d, i) => (
                            <text
                                key={i}
                                x={(i / Math.max(chartLabels.length - 1, 1)) * 490 + 5}
                                y="158"
                                fontSize="9"
                                fill="#9ca3af"
                                textAnchor="middle"
                            >
                                {d}
                            </text>
                        ))}
                    </svg>
                </motion.div>
            )}
        </div>
    );
};
