import React from 'react';
import { motion } from 'framer-motion';

// Mock data generator for the graph
const generateGraphData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map(day => ({
        day,
        value: Math.floor(Math.random() * 50) + 10 // Random value between 10 and 60
    }));
};

export const AnalyticsGraph: React.FC = () => {
    const data = generateGraphData();
    const maxValue = Math.max(...data.map(d => d.value));

    return (
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm h-full">
            <div className="mb-6">
                <h3 className="text-gray-900 text-lg font-bold">Weekly Performance</h3>
                <p className="text-gray-500 text-sm mt-1">Coupon redemptions over the last 7 days</p>
            </div>

            <div className="flex items-end justify-between h-48 gap-4 pt-4">
                {data.map((item, index) => (
                    <div key={item.day} className="flex flex-col items-center gap-2 flex-1 h-full">
                        <div className="w-full flex-1 flex items-end justify-center rounded-lg bg-gray-50 relative overflow-hidden">
                            {/* Grid lines */}
                            <div className="absolute inset-0 flex flex-col justify-between p-2 opacity-10">
                                <div className="border-t border-gray-400 w-full"></div>
                                <div className="border-t border-gray-400 w-full"></div>
                                <div className="border-t border-gray-400 w-full"></div>
                            </div>

                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${(item.value / maxValue) * 100}%` }}
                                transition={{ duration: 0.6, delay: index * 0.05, ease: "easeOut" }}
                                className="w-full max-w-[32px] rounded-t-lg bg-indigo-600 opacity-90 hover:opacity-100 transition-opacity"
                            />
                        </div>
                        <span className="text-xs font-semibold text-gray-500">
                            {item.day}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};
