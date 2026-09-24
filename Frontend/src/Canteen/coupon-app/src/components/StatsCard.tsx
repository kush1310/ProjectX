import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: string;
    color?: string; // Kept for interface compatibility but used subtly
    variant?: 'success' | 'warning' | 'info';
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: Icon, trend }) => {
    return (
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">{title}</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
                    <Icon size={20} />
                </div>
            </div>

            {trend && (
                <div className="flex items-center gap-1 text-xs font-medium">
                    <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        {trend}
                    </span>
                </div>
            )}
        </div>
    );
};
