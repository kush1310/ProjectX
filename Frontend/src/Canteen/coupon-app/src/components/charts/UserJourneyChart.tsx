import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { funnelData } from '../../utils/AnalyticsData';

export const UserJourneyChart: React.FC = () => {
    // Recharts doesn't have a native Sankey or Funnel in the core free set that is easy to style perfectly without heavy customization.
    // We will use a stepped Area Chart or Bar Chart to represent the Funnel/Journey drop-off which is standard for "User Journey".

    return (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900">User Journey Funnel</h3>
                <p className="text-sm text-gray-500">Conversion from View to Checkout</p>
            </div>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={funnelData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="colorFunnel" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="name" tick={{ fill: '#4b5563', fontSize: 12 }} />
                        <YAxis hide />
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#8884d8"
                            fillOpacity={1}
                            fill="url(#colorFunnel)"
                            label={{ position: 'top', fill: '#8884d8', fontSize: 12, fontWeight: 'bold' }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
