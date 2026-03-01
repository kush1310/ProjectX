import api from '../../utils/api';
import { MenuVariant, AddonGroup } from '../types/menu';

export interface DietaryInfo {
  vegetarian: boolean;
  vegan: boolean;
  glutenFree: boolean;
  spicy: boolean;
  containsNuts: boolean;
}

export interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  subCategory?: string;
  image?: string;
  isAvailable: boolean;
  visibleInMenu?: boolean; // Legacy
  dietary?: DietaryInfo;
  isVegetarian?: boolean; // For compat
  rating?: number;
  salesCount?: number;
  createdAt?: string;

  // Advanced Features
  preparationTime?: number;
  isRecommended?: boolean;
  displayOrder?: number;
  availableFrom?: string;
  availableTo?: string;
  hasVariants?: boolean;
  variants?: MenuVariant[];
  hasAddons?: boolean;
  addonGroups?: AddonGroup[];
}

export interface Canteen {
  id: number;
  name: string;
  location: string;
  isOpen: boolean;
  image?: string;
  imageUrl?: string;
  openingTime?: string;
  closingTime?: string;
  fssaiNumber?: string;
  gstNo?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  accountHolderName?: string;
  kycDocumentUrl?: string;
  // UI Display Properties
  rating?: number;
  hasOffer?: boolean;
  isPureVeg?: boolean;
}

// Order Item Interface matching Backend
export interface OrderItem {
  id?: number;
  menuItemId?: number;
  name: string;
  quantity: number;
  price: number;
  totalPrice?: number; // Backend returns this
  menuItem?: {
    id: number;
    name: string;
    price: number;
    isVeg?: boolean;
  };
}

// Customer info from backend
export interface Customer {
  id: number;
  fullName: string;
  email: string;
  mobile?: string;
}

// Order status matching backend enum (uppercase)
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface Order {
  id: number;
  orderNumber: string;
  customer?: Customer; // Backend returns customer object
  customerName?: string; // Legacy support
  customerPhone?: string;
  customerAddress?: string;
  total?: number;
  totalAmount?: number; // Backend uses this
  status: OrderStatus;
  paymentStatus?: PaymentStatus;
  items: OrderItem[];
  createdAt: string;
  acceptedAt?: string;
  rejectionReason?: string;
  completedAt?: string;
  specialInstructions?: string;
  specialNotes?: string;
  paymentMethod?: 'cash' | 'upi' | 'card' | 'CASH' | 'UPI' | 'CARD';
  isPaid?: boolean;
  // Payment transaction details
  transactionId?: string;
  upiId?: string;
  cardLast4?: string;
  merchantName?: string;
  paidAt?: string;
}

/**
 * Fetch all canteens
 */
export const fetchCanteens = async (): Promise<Canteen[]> => {
  try {
    const response = await api.get('/canteens');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch canteens', error);
    return [];
  }
};

/**
 * Update canteen details
 */
export const updateCanteenDetails = async (id: number, canteen: Partial<Canteen>): Promise<Canteen | null> => {
  try {
    const response = await api.put(`/canteens/${id}`, {
      name: canteen.name,
      location: canteen.location,
      isOpen: canteen.isOpen,
      rushHourEnabled: false,
      openingTime: canteen.openingTime,
      closingTime: canteen.closingTime,
      fssaiNumber: canteen.fssaiNumber,
      gstNo: canteen.gstNo,
      bankName: canteen.bankName,
      accountNumber: canteen.accountNumber,
      ifscCode: canteen.ifscCode,
      accountHolderName: canteen.accountHolderName,
      kycDocumentUrl: canteen.kycDocumentUrl
    });
    if (response.data.success) {
      return response.data.canteen;
    }
    return null;
  } catch (error) {
    console.error('Failed to update canteen details', error);
    return null;
  }
};

/**
 * Fetch menu for a canteen
 */
export const fetchMenu = async (canteenId: number): Promise<MenuItem[]> => {
  try {
    const response = await api.get(`/canteens/${canteenId}/menu`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch menu', error);
    return [];
  }
};
export const getMenuItems = fetchMenu;

/**
 * Fetch user orders
 */
export const getOrders = async (): Promise<Order[]> => {
  try {
    const response = await api.get('/orders/my-orders');
    // Assuming /my-orders is the endpoint for user orders, 
    // or just /orders if the backend filters by authenticated user.
    // I need to be careful about the backend endpoint.
    // Based on standard REST, it might be GET /orders (which returns all for admin/owner? or just mine?)
    // Let's assume GET /orders returns the user's orders based on token.
    return response.data;
  } catch (error) {
    console.error('Failed to fetch orders', error);
    return [];
  }
};

// Export these for backward compatibility if needed, or remove if fully refactoring
// Legacy getCategories removed to prefer fetchCategories API

// Menu Management APIs

export const addMenuItem = async (canteenId: number, item: Partial<MenuItem>): Promise<MenuItem | null> => {
  try {
    const response = await api.post(`/canteens/${canteenId}/menu`, {
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      subCategory: item.subCategory || '',
      displayOrder: item.displayOrder || 0,
      availableFrom: item.availableFrom || '',
      availableTo: item.availableTo || '',
      isVeg: item.isVegetarian || (item.dietary && item.dietary.vegetarian) || false,
      preparationTime: item.preparationTime || 15,
      isRecommended: item.isRecommended || false,
      hasVariants: item.hasVariants || false,
      variants: item.variants || [],
      hasAddons: item.hasAddons || false,
      addonGroups: item.addonGroups || []
    });
    return response.data.item;
  } catch (error) {
    console.error('Failed to add menu item', error);
    return null;
  }
};

export const updateMenuItem = async (itemId: number, item: Partial<MenuItem>): Promise<MenuItem | null> => {
  try {
    const response = await api.put(`/canteens/menu/${itemId}`, {
      name: item.name,
      description: item.description,
      price: item.price,
      isAvailable: item.isAvailable,
      category: item.category,
      subCategory: item.subCategory,
      displayOrder: item.displayOrder,
      availableFrom: item.availableFrom,
      availableTo: item.availableTo,
      preparationTime: item.preparationTime,
      isRecommended: item.isRecommended,
      hasVariants: item.hasVariants,
      variants: item.variants,
      hasAddons: item.hasAddons,
      addonGroups: item.addonGroups
    });
    return response.data.item;
  } catch (error) {
    console.error('Failed to update menu item', error);
    return null;
  }
};

export const deleteMenuItem = async (itemId: number): Promise<boolean> => {
  try {
    await api.delete(`/canteens/menu/${itemId}`);
    return true;
  } catch (error) {
    console.error('Failed to delete menu item', error);
    return false;
  }
};

export const toggleItemAvailability = async (itemId: number, isAvailable: boolean): Promise<boolean> => {
  try {
    await api.post(`/canteens/menu/${itemId}/toggle`, { available: isAvailable });
    return true;
  } catch (error) {
    console.error('Failed to toggle availability', error);
    return false;
  }
};

export interface Category {
  id: number;
  name: string;
  canteenId?: number;
}


export const fetchCategories = async (canteenId: number): Promise<Category[]> => {
  try {
    const response = await api.get(`/categories/canteen/${canteenId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch categories', error);
    return [];
  }
};

export const createCategory = async (canteenId: number, name: string): Promise<Category | null> => {
  try {
    const response = await api.post(`/categories/canteen/${canteenId}`, { name });
    return response.data;
  } catch (error) {
    console.error('Failed to create category', error);
    return null;
  }
};

export const deleteCategory = async (id: number): Promise<boolean> => {
  try {
    await api.delete(`/categories/${id}`);
    return true;
  } catch (error) {
    console.error('Failed to delete category', error);
    return false;
  }
};

// Legacy Aliases
export const getCategories = fetchCategories;
export const saveCategory = createCategory;

// Order Management

export const updateOrderStatus = async (orderId: number, status: string, rejectionReason?: string): Promise<Order | null> => {
  try {
    const payload: any = { status: status.toUpperCase() };
    if (rejectionReason) payload.rejectionReason = rejectionReason;
    const response = await api.put(`/orders/${orderId}/status`, payload);
    return response.data.order;
  } catch (error) {
    console.error('Failed to update order status', error);
    return null;
  }
};

export const getOrderStats = (orders: Order[]) => {
  // Determine active vs completed based on status (using uppercase backend status)
  const activeOrders = orders.filter(o => ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'].includes(o.status));

  // Calculate stats
  const activeCount = activeOrders.length;

  // Average time (mock or calc from completedAt - createdAt)
  // Simple mock calculation logic for now if data insufficient
  const avgTime = 12;

  // Today's revenue (use totalAmount from backend, fallback to total)
  const today = new Date().toDateString();
  const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today && o.status !== 'CANCELLED');
  const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.totalAmount || o.total || 0), 0);

  return {
    activeCount,
    avgTime,
    todayRevenue
  };
};



// ===== COUPON TYPES & API =====

export type CouponType = 'GENERAL' | 'BOGO' | 'ITEM_SPECIFIC' | 'COMBO' | 'NEW_DISH' | 'RUSH_HOUR';
export type DiscountType = 'PERCENTAGE' | 'FLAT' | 'BOGO';
export type OfferCategory = 'OFFER' | 'COUPON' | 'PROMO';
export type CouponTrackStatus = 'ALL' | 'ACTIVE' | 'INACTIVE' | 'SCHEDULED';

export interface ApplicableItemInfo {
  menuItemId: number;
  itemName: string;
  itemPrice: number;
  requiredQty: number;
}

export interface Coupon {
  id?: string;
  couponCode: string;
  title: string;
  description?: string;
  color?: string;
  couponType: CouponType;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountCap?: number;
  minOrderValue?: number;
  usageLimitTotal?: number;
  usageLimitPerUser?: number;
  currentUsageCount?: number;
  startTime?: string;
  endTime?: string;
  rushHourFlag?: boolean;
  rushHourStart?: string; // "HH:mm"
  rushHourEnd?: string;
  bogoBuyQty?: number;
  bogoGetQty?: number;
  bogoFreeItemId?: number;
  comboItems?: string;
  newCustomerOnly?: boolean;
  newDishFlag?: boolean;
  isActive: boolean;
  isCustom?: boolean;
  offerCategory?: OfferCategory;
  isArchived?: boolean;
  archivedAt?: string;
  originalEndTime?: string;
  canteenId?: number;
  canteenName?: string;
  applicableItems?: ApplicableItemInfo[];
  applicableItemIds?: number[];
  createdAt?: string;
  updatedAt?: string;
  isExpired?: boolean;
  isCurrentlyInRushHour?: boolean;
  remainingSeconds?: number;
}

export interface ValidationResult {
  valid: boolean;
  message: string;
  discountAmount: number;
  finalTotal: number;
  couponCode?: string;
  couponTitle?: string;
  couponType?: CouponType;
  discountType?: DiscountType;
}

export interface CartItemInfo {
  menuItemId: number;
  itemName: string;
  quantity: number;
  price: number;
}

export interface RushHourTimerInfo {
  couponId: string;
  couponCode: string;
  title: string;
  rushHourStart: string;
  rushHourEnd: string;
  remainingSeconds: number;
  isCurrentlyActive: boolean;
}

export interface CouponDashboard {
  totalCoupons: number;
  activeCoupons: number;
  expiredCoupons: number;
  rushHourRunning: number;
  totalUsageCount: number;
  totalDiscountGiven: number;
  liveTimers: RushHourTimerInfo[];
}

export interface SalesVsDiscountPoint {
  period: string;
  totalSales: number;
  totalDiscount: number;
  netRevenue: number;
}

export interface VendorImpact {
  canteenId: number;
  canteenName: string;
  totalRevenue: number;
  totalDiscount: number;
  netIncome: number;
}

export interface TypePerformance {
  couponType: CouponType;
  timesUsed: number;
  totalDiscount: number;
  avgOrderValue: number;
}

export interface CustomerAnalytics {
  newCustomersViaCoupon: number;
  repeatCustomers: number;
  retentionRate: number;
  totalCustomerGrowth: number;
}

export interface CouponAnalytics {
  salesVsDiscount: SalesVsDiscountPoint[];
  vendorImpact: VendorImpact[];
  typePerformance: TypePerformance[];
  customerAnalytics: CustomerAnalytics;
  itemAnalytics: any[];
}

export interface CalendarCouponInfo {
  couponId: string;
  couponCode: string;
  title: string;
  couponType: CouponType;
  color: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface CalendarEntry {
  date: string;
  coupons: CalendarCouponInfo[];
}

export interface CalendarResponse {
  entries: CalendarEntry[];
}

export interface TrackCouponFilters {
  canteenId?: number;
  status?: CouponTrackStatus;
  couponType?: CouponType;
  offerCategory?: OfferCategory;
}

// ===== COUPON API FUNCTIONS =====

export const getCoupons = async (): Promise<Coupon[]> => {
  try {
    const response = await api.get('/coupons/all');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch coupons', error);
    return [];
  }
};

export const getTrackCoupons = async (filters?: {
  canteenId?: number;
  status?: 'ALL' | 'ACTIVE' | 'INACTIVE' | 'SCHEDULED';
  couponType?: CouponType;
  offerCategory?: string;
}): Promise<Coupon[]> => {
  try {
    const params: any = {};
    if (filters?.canteenId) params.canteenId = filters.canteenId;
    if (filters?.status) params.status = filters.status;
    if (filters?.couponType) params.couponType = filters.couponType;
    if (filters?.offerCategory) params.offerCategory = filters.offerCategory;

    const response = await api.get('/coupons/track', { params });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch track coupons', error);
    return [];
  }
};

export const getActiveCoupons = async (canteenId?: number): Promise<Coupon[]> => {
  try {
    const params = canteenId ? { canteenId } : {};
    const response = await api.get('/coupons/active', { params });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch active coupons', error);
    return [];
  }
};



export const createCoupon = async (coupon: Partial<Coupon>): Promise<Coupon> => {
  try {
    const response = await api.post('/coupons/create', coupon);
    return response.data;
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      'Failed to create coupon';
    console.error('Failed to create coupon', error);
    throw new Error(message);
  }
};

export const updateCoupon = async (id: string, coupon: Partial<Coupon>): Promise<Coupon | null> => {
  try {
    const response = await api.put(`/coupons/${id}/update`, coupon);
    return response.data;
  } catch (error) {
    console.error('Failed to update coupon', error);
    return null;
  }
};

export const deleteCoupon = async (id: string | number): Promise<boolean> => {
  try {
    await api.delete(`/coupons/${id}`);
    return true;
  } catch (error) {
    console.error('Failed to delete coupon', error);
    return false;
  }
};

export const toggleCoupon = async (id: string | number): Promise<Coupon | null> => {
  try {
    const response = await api.put(`/coupons/${id}/toggle`);
    return response.data;
  } catch (error) {
    console.error('Failed to toggle coupon', error);
    return null;
  }
};

export const validateCoupon = async (
  couponCode: string, orderTotal: number, userId: number, cartItems?: CartItemInfo[]
): Promise<ValidationResult> => {
  try {
    const response = await api.post('/coupons/validate', {
      couponCode, orderTotal, userId, cartItems
    });
    return response.data;
  } catch (error) {
    console.error('Failed to validate coupon', error);
    return { valid: false, message: 'Validation failed', discountAmount: 0, finalTotal: orderTotal };
  }
};

export const getCouponDashboard = async (): Promise<CouponDashboard | null> => {
  try {
    const response = await api.get('/coupons/dashboard');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch coupon dashboard', error);
    return null;
  }
};

export const getCouponAnalytics = async (
  period?: string, startDate?: string, endDate?: string
): Promise<CouponAnalytics | null> => {
  try {
    const params: any = {};
    if (period) params.period = period;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await api.get('/coupons/analytics', { params });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch coupon analytics', error);
    return null;
  }
};

export const getCouponCalendar = async (
  startDate?: string, endDate?: string
): Promise<CalendarResponse | null> => {
  try {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await api.get('/coupons/calendar', { params });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch coupon calendar', error);
    return null;
  }
};

export const applyCouponToCart = async (couponCode: string): Promise<{ success: boolean; message: string; cart?: any; discount?: number }> => {
  try {
    const response = await api.post('/cart/apply-coupon', { couponCode });
    return response.data;
  } catch (error: any) {
    console.error('Failed to apply coupon to cart', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to apply coupon'
    };
  }
};

export const removeCouponFromCart = async (): Promise<{ success: boolean; message: string; cart?: any }> => {
  try {
    const response = await api.delete('/cart/remove-coupon');
    return response.data;
  } catch (error: any) {
    console.error('Failed to remove coupon from cart', error);
    return {
      success: false,
      message: error.response?.data?.error || 'Failed to remove coupon'
    };
  }
};

// ===== NEW: SYSTEM OFFERS, HISTORY, RESTORE, ARCHIVE =====

export const getSystemOffers = async (): Promise<Coupon[]> => {
  try {
    const response = await api.get('/coupons/system-offers');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch system offers', error);
    return [];
  }
};

export const getCouponHistory = async (): Promise<Coupon[]> => {
  try {
    const response = await api.get('/coupons/history');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch coupon history', error);
    return [];
  }
};

export const restoreCoupon = async (
  id: string, newStartTime: string, newEndTime: string
): Promise<Coupon | null> => {
  try {
    const response = await api.put(`/coupons/${id}/restore`, { newStartTime, newEndTime });
    return response.data;
  } catch (error) {
    console.error('Failed to restore coupon', error);
    return null;
  }
};

export const archiveCoupon = async (id: string): Promise<boolean> => {
  try {
    await api.put(`/coupons/${id}/archive`);
    return true;
  } catch (error) {
    console.error('Failed to archive coupon', error);
    return false;
  }
};
