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
<<<<<<< HEAD
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
=======
  createdAt?: string;

  // 📦 Variants (Single-select)
  variantType?: 'Size' | 'Quantity' | 'Type' | 'Crust' | 'None';
  variants?: Variant[];

  // ➕ Add-Ons (Multi-select)
  addOns?: AddOn[];

  // ⚙️ Custom Preferences
  spiceLevel?: 'Low' | 'Medium' | 'High';
  sugarLevel?: 'No Sugar' | 'Less Sugar' | 'Normal Sugar';
  cookingStyle?: 'Fried' | 'Grilled' | 'Steamed';

  // 🟢 Availability & Pricing
  isCouponApplicable?: boolean;
  discount?: number; // Percentage
  preparationTime?: number; // Minutes

  // 🏷️ Tags & Control
  isPopular?: boolean;
  isRecommended?: boolean;
  isLimitedTime?: boolean;
  maxQuantityPerOrder?: number;

  // 🕒 Time Control
  availabilityTime?: 'Breakfast' | 'Lunch' | 'Evening' | 'All Day';
>>>>>>> e0f05a3391a3ba932f6d8ad95e89983709a6dde9
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
<<<<<<< HEAD
  totalPrice?: number; // Backend returns this
  menuItem?: {
    id: number;
    name: string;
    price: number;
    isVeg?: boolean;
  };
=======
  selectedVariant?: string;
  selectedAddOns?: string[];
  // Changed from unitPrice to price to match existing frontend code if needed, but backend usually has price
  // Let's check existing OrderHistory.tsx usage: item.price
>>>>>>> e0f05a3391a3ba932f6d8ad95e89983709a6dde9
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

// Export these for backward compatibility if needed, or remove if fully refactoring
<<<<<<< HEAD
// Legacy getCategories removed to prefer fetchCategories API

// Menu Management APIs
=======

export interface Category {
  id: string;
  name: string;
  color?: string;
}

// In-memory category storage (persists for session)
let categoriesData: Category[] = [
  { id: 'pizza', name: 'Pizza', color: '#ef4444' },
  { id: 'burgers', name: 'Burgers', color: '#f97316' },
  { id: 'sandwiches', name: 'Sandwiches', color: '#f59e0b' },
  { id: 'snacks', name: 'Snacks', color: '#84cc16' },
  { id: 'street-food', name: 'Street Food', color: '#10b981' },
  { id: 'hot-meals', name: 'Hot Meals', color: '#06b6d4' },
  { id: 'indian-meals-thali', name: 'Indian Meals (Thali)', color: '#3b82f6' },
  { id: 'south-indian', name: 'South Indian', color: '#6366f1' },
  { id: 'chinese', name: 'Chinese', color: '#8b5cf6' },
  { id: 'rice-biryani', name: 'Rice & Biryani', color: '#d946ef' },
  { id: 'pasta-noodles', name: 'Pasta & Noodles', color: '#f43f5e' },
  { id: 'wraps-rolls', name: 'Wraps & Rolls', color: '#ec4899' },
  { id: 'breakfast', name: 'Breakfast', color: '#fbbf24' },
  { id: 'evening-snacks', name: 'Evening Snacks', color: '#a3e635' },
  { id: 'beverages', name: 'Beverages', color: '#22d3ee' },
  { id: 'tea-coffee', name: 'Tea & Coffee', color: '#a855f7' },
  { id: 'milkshakes-juices', name: 'Milkshakes & Juices', color: '#ec4899' },
  { id: 'desserts', name: 'Desserts', color: '#f472b6' },
  { id: 'combos-meal-deals', name: 'Combos / Meal Deals', color: '#fb923c' },
];

export const getCategories = (): Category[] => [...categoriesData];

// Management APIs
>>>>>>> e0f05a3391a3ba932f6d8ad95e89983709a6dde9

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

<<<<<<< HEAD
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
=======
export const saveCategory = (cat: Category) => {
  if (!categoriesData.find(c => c.id === cat.id)) {
    categoriesData.push(cat);
  }
};

export const deleteCategory = (id: string) => {
  categoriesData = categoriesData.filter(c => c.id !== id);
>>>>>>> e0f05a3391a3ba932f6d8ad95e89983709a6dde9
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

<<<<<<< HEAD
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
=======
export const updateOrderStatus = async (orderId: number, status: string): Promise<Order | null> => {
  try {
    const response = await api.put(`/orders/${orderId}/status`, { status: status.toUpperCase() });
    return response.data.order;
  } catch (error) {
    console.error('Failed to update order status', error);
    return null;
  }
};

export const getOrderStats = (orders: Order[]) => {
  // Determine active vs completed based on status
  const activeOrders = orders.filter(o => ['new', 'preparing', 'ready'].includes(o.status.toLowerCase()));
>>>>>>> e0f05a3391a3ba932f6d8ad95e89983709a6dde9

  // Calculate stats
  const activeCount = activeOrders.length;

  // Average time (mock or calc from completedAt - createdAt)
  // Simple mock calculation logic for now if data insufficient
  const avgTime = 12;

  // Today's revenue
  const today = new Date().toDateString();
  const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today && o.status !== 'cancelled');
  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);

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
        const response = await api.get('/api/vendor/coupons');
        return response.data;
    } catch (error) {
        console.error('Failed to fetch coupons', error);
        return [];
    }
};

export const createCoupon = async (coupon: Partial<Coupon>): Promise<Coupon | null> => {
    try {
        const response = await api.post('/api/vendor/coupons', coupon);
        return response.data;
    } catch (error) {
        console.error('Failed to create coupon', error);
        return null; // or throw
    }
};

export const deleteCoupon = async (id: string | number): Promise<boolean> => {
    try {
        await api.delete(`/api/vendor/coupons/${id}`);
        return true;
    } catch (error) {
        console.error('Failed to delete coupon', error);
        return false;
    }
};

export const toggleCoupon = async (id: string | number): Promise<Coupon | null> => {
    try {
        const response = await api.put(`/api/vendor/coupons/${id}/toggle`);
        return response.data;
    } catch (error) {
        console.error('Failed to toggle coupon', error);
        return null;
    }
};
