import React from 'react';
import { DollarSign, ShoppingBag, Clock, Users } from 'lucide-react';

interface StatItemProps {
    label: string;
    value: string;
    subtext: string;
    trend: 'up' | 'down';
    icon: React.ElementType;
    isLast?: boolean;
}

const StatItem: React.FC<StatItemProps> = ({ label, value, subtext, trend, icon: Icon, isLast }) => {
    return (
        <div className={`flex items-center gap-4 px-6 flex-1 ${!isLast ? 'border-r border-gray-100' : ''}`}>
            <div className={`p-3 rounded-xl bg-gray-50 text-gray-600`}>
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-tight mb-0.5">{label}</p>
                <div className="flex items-baseline gap-2">
                    <h3 className="text-2xl font-display font-bold text-gray-900">{value}</h3>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                        trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                    }`}>
                        {subtext}
                    </span>
                </div>
            </div>
        </div>
    );
};

const DashboardStats = () => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6 py-4 flex flex-col md:flex-row divide-y md:divide-y-0">
        <StatItem 
            label="Total Revenue" 
            value="₹45,231" 
            subtext="+12%" 
            trend="up"
            icon={DollarSign} 
        />
        <StatItem 
            label="Active Orders" 
            value="24" 
            subtext="8 Pending" 
            trend="up"
            icon={ShoppingBag} 
        />
        <StatItem 
            label="Avg Prep Time" 
            value="18m" 
            subtext="-2m" 
            trend="up" // Improvement is 'up' in sentiment even if time goes down, but keeping simple
            icon={Clock} 
        />
        <StatItem 
            label="Customers" 
            value="1,205" 
            subtext="+45" 
            trend="up"
            icon={Users} 
            isLast
        />
    </div>
  );
};

export default DashboardStats;
