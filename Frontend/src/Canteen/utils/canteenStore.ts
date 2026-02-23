import api from '../../utils/api';
import { MenuVariant, AddonGroup } from '../types/menu';



export interface DietaryInfo {
  vegetarian: boolean;
  vegan: boolean;
  glutenFree: boolean;
  spicy: boolean;
  containsNuts: boolean;
}

export interface Variant {
  name: string; // e.g. "Small", "Large", "Cheese Burst"
  price: number;
}

export interface AddOn {
  name: string; // e.g. "Extra Cheese"
  price: number;
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
  totalPrice?: number;
  selectedVariant?: string;
  selectedAddOns?: string[];
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

/**
 * Fetch user orders
 */
export const getOrders = async (): Promise<Order[]> => {
  try {
    const response = await api.get('/orders/my-orders');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch orders', error);
    return [];
  }
};

// Export these for backward compatibility if needed
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

// Category Management
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
  const activeOrders = orders.filter(o => ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'].includes(o.status));

  const activeCount = activeOrders.length;
  const avgTime = 12;

  const today = new Date().toDateString();
  const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today && o.status !== 'CANCELLED');
  const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.totalAmount || o.total || 0), 0);

  return {
    activeCount,
    avgTime,
    todayRevenue
  };
};



// Coupon Interface & APIs
export interface Coupon {
  id?: string | number; 
  code: string;
  title: string; 
  description?: string;
  color?: string; // Hex code
  discountType: 'PERCENTAGE' | 'FLAT';
  discountValue: number;
  minOrderValue?: number;
  maxDiscountAmount?: number;
  validFrom?: string;
  validUntil?: string;
  usageLimit?: number;
  usageCount?: number;
  isActive: boolean;
  isCustom?: boolean;

  // Advanced Fields
  type?: 'DISCOUNT' | 'BOGO';
  scope?: 'GLOBAL' | 'CATEGORY' | 'ITEM';
  targetIds?: string; // Comma separated
  bogoBuyQty?: number;
  bogoGetQty?: number;
}

export const getCoupons = async (): Promise<Coupon[]> => {
    try {
        const response = await api.get('/vendor/coupons');
        return response.data;
    } catch (error) {
        console.error('Failed to fetch coupons', error);
        return [];
    }
};

export const createCoupon = async (coupon: Partial<Coupon>): Promise<Coupon | null> => {
    try {
        const response = await api.post('/vendor/coupons', coupon);
        return response.data;
    } catch (error) {
        console.error('Failed to create coupon', error);
        return null; // or throw
    }
};

export const deleteCoupon = async (id: string | number): Promise<boolean> => {
    try {
        await api.delete(`/vendor/coupons/${id}`);
        return true;
    } catch (error) {
        console.error('Failed to delete coupon', error);
        return false;
    }
};

export const toggleCoupon = async (id: string | number): Promise<Coupon | null> => {
    try {
        const response = await api.put(`/vendor/coupons/${id}/toggle`);
        return response.data;
    } catch (error) {
        console.error('Failed to toggle coupon', error);
        return null;
    }
};
