import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Label } from 'recharts';
import { customerMatrixData } from '../../utils/AnalyticsData';

export const CustomerMatrixChart: React.FC = () => {
    return (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900">Persuadable Matrix</h3>
                <p className="text-sm text-gray-500">Organic Intent vs. Coupon Sensitivity</p>
            </div>
            <div className="h-[350px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            type="number"
                            dataKey="x"
                            name="Organic Intent"
                            unit="%"
                            domain={[0, 100]}
                            label={{ value: 'Organic Purchase Intent →', position: 'bottom', offset: 0, fill: '#6b7280' }}
                        />
                        <YAxis
                            type="number"
                            dataKey="y"
                            name="Coupon Sensitivity"
                            unit="%"
                            domain={[0, 100]}
                            label={{ value: 'Coupon Sensitivity →', angle: -90, position: 'insideLeft', fill: '#6b7280' }}
                        />
                        <ZAxis type="number" dataKey="z" range={[50, 400]} name="LTV" />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} />

                        {/* Quadrant Lines */}
                        <ReferenceLine x={50} stroke="#9ca3af" strokeDasharray="3 3" />
                        <ReferenceLine y={50} stroke="#9ca3af" strokeDasharray="3 3" />

                        {/* Quadrant Labels */}
                        <Label value="Sure Things" position="insideTopRight" offset={10} />

                        <Scatter name="Customers" data={customerMatrixData} fill="#8884d8" fillOpacity={0.6} />
                    </ScatterChart>
                </ResponsiveContainer>

                {/* Quadrant Text Overlays (Absolute positioning for better control) */}
                <div className="absolute top-[15%] right-[10%] text-xs font-bold text-green-600 bg-white/80 px-2 py-1 rounded border border-green-100">
                    Sure Things
                </div>
                <div className="absolute top-[15%] left-[15%] text-xs font-bold text-blue-600 bg-white/80 px-2 py-1 rounded border border-blue-100">
                    Persuadables
                </div>
                <div className="absolute bottom-[20%] left-[15%] text-xs font-bold text-red-600 bg-white/80 px-2 py-1 rounded border border-red-100">
                    Lost Causes
                </div>
                <div className="absolute bottom-[20%] right-[10%] text-xs font-bold text-orange-600 bg-white/80 px-2 py-1 rounded border border-orange-100">
                    Do Not Disturb
                </div>
            </div>
        </div>
    );
};
