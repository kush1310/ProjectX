import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { storeData } from '../../utils/AnalyticsData';

export const StoreLeaderboardChart: React.FC = () => {
    // Sort data to show top performers first
    const sortedData = [...storeData].sort((a, b) => b.amount - a.amount);

    return (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col h-full">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900">Top Locations</h3>
                <p className="text-sm text-gray-500">Highest performing outlets by promo value</p>
            </div>
            <div className="flex-1 min-h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={sortedData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                    >
                        <XAxis type="number" hide />
                        <YAxis
                            dataKey="store"
                            type="category"
                            width={100}
                            tick={{ fill: '#374151', fontSize: 13, fontWeight: 600 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                            formatter={((value: any) => [`₹${value.toLocaleString()}`, 'Revenue']) as any}
                        />
                        <Bar dataKey="amount" radius={[0, 4, 4, 0]} barSize={32} background={{ fill: '#f3f4f6' }}>
                            {sortedData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={index < 3 ? '#e23744' : '#9ca3af'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
