import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { upliftData } from '../../utils/AnalyticsData';



export const UpliftWaterfallChart: React.FC = () => {
    // Process data for waterfall
    let currentTotal = 0;
    const processedData = upliftData.map(item => {
        const prevTotal = currentTotal;
        if (item.type === 'increase' || item.type === 'decrease') {
            currentTotal += item.value;
            // For waterfall bars, we need start and end points
            // Recharts doesn't have a native waterfall, so we use stacked bars with transparent placeholders
            return {
                ...item,
                uv: item.value > 0 ? item.value : -item.value, // Height of the bar
                pv: item.value > 0 ? prevTotal : currentTotal, // Floating height (transparent)
                fill: item.value > 0 ? '#10b981' : '#ef4444' // Green for up, Red for down
            };
        } else {
            // Base or Total columns start from 0
            currentTotal = item.value;
            return {
                ...item,
                uv: item.value,
                pv: 0,
                fill: '#3b82f6' // Blue for totals
            };
        }
    });

    return (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900">Promotional Uplift</h3>
                <p className="text-sm text-gray-500">Incremental value analysis (Waterfall)</p>
            </div>
            <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={processedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6b7280', fontSize: 11 }}
                            interval={0}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6b7280', fontSize: 12 }}
                            tickFormatter={(value) => `₹${value / 1000}k`}
                        />
                        <Tooltip
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                            formatter={(value: any, name: any) => [Math.abs(Number(value)).toLocaleString(), name === 'pv' ? 'Base' : 'Value']}
                        />
                        <Bar dataKey="pv" stackId="a" fill="transparent" />
                        <Bar dataKey="uv" stackId="a" radius={[4, 4, 4, 4]}>
                            {processedData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                            <ReferenceLine y={0} stroke="#000" />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
