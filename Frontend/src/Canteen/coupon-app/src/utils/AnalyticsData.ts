export interface AnalyticsDataPoint {
    date: string;
    discountAmount: number;
    promotionAmount: number;
    orderCount: number;
    salesWithPromo: number;
    salesWithoutPromo: number;
}

export interface PlatformPerformance {
    platform: string;
    redemptionOrders: number;
    promoAmount: number;
}

export interface ChannelUsage {
    channel: string;
    count: number;
    amount: number;
}

export interface StorePerformance {
    store: string;
    orders: number;
    amount: number;
}

export interface JourneyStep {
    name: string;
    value: number;
}

export const generateTimeSeriesData = (days: number): AnalyticsDataPoint[] => {
    const data: AnalyticsDataPoint[] = [];
    const today = new Date();

    for (let i = days; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        // Random trends with some weekly seasonality
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        const multiplier = isWeekend ? 1.5 : 1.0;

        data.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            discountAmount: Math.floor((Math.random() * 2000 + 1000) * multiplier),
            promotionAmount: Math.floor((Math.random() * 1500 + 500) * multiplier),
            orderCount: Math.floor((Math.random() * 50 + 20) * multiplier),
            salesWithPromo: Math.floor((Math.random() * 5000 + 3000) * multiplier),
            salesWithoutPromo: Math.floor((Math.random() * 8000 + 5000) * multiplier),
        });
    }
    return data;
};

export const platformData: PlatformPerformance[] = [
    { platform: 'Uber Eats', redemptionOrders: 450, promoAmount: 12000 },
    { platform: 'DoorDash', redemptionOrders: 320, promoAmount: 8500 },
    { platform: 'In-House App', redemptionOrders: 680, promoAmount: 18500 },
    { platform: 'Web', redemptionOrders: 210, promoAmount: 5400 },
];

export const channelData: ChannelUsage[] = [
    { channel: 'Delivery', count: 850, amount: 25000 },
    { channel: 'Pick-Up', count: 420, amount: 12000 },
    { channel: 'Dine-In', count: 150, amount: 4500 },
];

export const storeData: StorePerformance[] = [
    { store: 'Downtown', orders: 420, amount: 15000 },
    { store: 'Westside', orders: 380, amount: 12500 },
    { store: 'Campus Hub', orders: 550, amount: 18000 },
    { store: 'Mall Plaza', orders: 290, amount: 9500 },
    { store: 'Airport', orders: 150, amount: 6200 },
];

// Waterfall Data
export const upliftData = [
    { name: 'Baseline Sales', value: 45000, type: 'base' },
    { name: 'Traffic Uplift', value: 8500, type: 'increase' },
    { name: 'Conversion Uplift', value: 5200, type: 'increase' },
    { name: 'Ticket Size Uplift', value: 3800, type: 'increase' },
    { name: 'Promo Cost', value: -12000, type: 'decrease' },
    { name: 'Net Revenue', value: 50500, type: 'total' },
];

// Matrix Plot Data
export const customerMatrixData = Array.from({ length: 40 }, () => ({
    x: Math.floor(Math.random() * 100), // Organic Intent
    y: Math.floor(Math.random() * 100), // Coupon Sensitivity
    z: Math.floor(Math.random() * 500 + 100), // LTV or Spend size
}));

// Sankey/Funnel Data
export const funnelData = [
    { name: 'Views', value: 12500, fill: '#8884d8' },
    { name: 'Clicks', value: 8400, fill: '#83a6ed' },
    { name: 'Added to Cart', value: 5200, fill: '#8dd1e1' },
    { name: 'Applied Coupon', value: 3800, fill: '#82ca9d' },
    { name: 'Checkout', value: 3100, fill: '#a4de6c' },
];
