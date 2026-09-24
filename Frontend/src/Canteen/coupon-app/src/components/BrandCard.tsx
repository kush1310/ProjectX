import React from 'react';
import { CalendarDays, Clock } from 'lucide-react';

export const BrandCard: React.FC = () => {
    const date = new Date();
    const hour = date.getHours();

    let greeting = "Good Morning";
    if (hour >= 12 && hour < 17) greeting = "Good Afternoon";
    else if (hour >= 17) greeting = "Good Evening";

    const dateString = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    return (
        <div className="bg-[#0f172a] text-white rounded-xl p-8 h-full flex flex-col justify-between relative overflow-hidden shadow-lg">
            {/* Subtle background accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-[100px] opacity-20 -translate-y-1/2 translate-x-1/2"></div>

            <div className="relative z-10">
                <h2 className="text-3xl font-bold tracking-tight mb-2">
                    {greeting},<br />
                    <span className="text-indigo-400">Admin!</span>
                </h2>
                <p className="text-slate-400 text-sm font-medium">Ready to manage some deals today?</p>
            </div>

            <div className="relative z-10 mt-8 space-y-3">
                <div className="flex items-center gap-3 bg-white/5 p-3 rounded-lg border border-white/10 backdrop-blur-sm">
                    <CalendarDays size={18} className="text-indigo-400" />
                    <span className="text-sm font-medium opacity-90">{dateString}</span>
                </div>
                <div className="flex items-center gap-3 bg-white/5 p-3 rounded-lg border border-white/10 backdrop-blur-sm">
                    <Clock size={18} className="text-indigo-400" />
                    <span className="text-sm font-medium opacity-90">
                        {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            </div>
        </div>
    );
};
