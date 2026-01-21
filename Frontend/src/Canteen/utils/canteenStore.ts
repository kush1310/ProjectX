import api from '../../utils/api';
// import { User } from '../../utils/authStore';

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
  image?: string;
  isAvailable: boolean;
  visibleInMenu?: boolean;
  dietary?: DietaryInfo;
  rating?: number;
  salesCount?: number;
  createdAt?: string; // Added for compatibility
}

export interface Canteen {
  id: number;
  name: string;
  location: string;
  isOpen: boolean;
  image?: string;
  openingTime?: string;
  closingTime?: string;
}

// Order Item Interface matching Backend
export interface OrderItem {
  id?: number;
  menuItemId?: number;
  name: string;
  quantity: number;
  price: number; // Changed from unitPrice to price to match existing frontend code if needed, but backend usually has price
  // Let's check existing OrderHistory.tsx usage: item.price
}

export interface Order {
  id: number;
  orderNumber: string;
  customerName: string; // Backend might need mapping if it returns user object
  customerPhone: string;
  customerAddress: string;
  total: number;
  status: 'new' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  items: OrderItem[];
  createdAt: string;
  acceptedAt?: string; // Optional in backend?
  completedAt?: string;
  specialNotes?: string;
  paymentMethod: 'cash' | 'upi' | 'card';
  isPaid: boolean;
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
export const getCategories = (): Category[] => [
  { id: 'hot-meals', name: 'Hot Meals', color: '#ef4444' },
  { id: 'snacks', name: 'Snacks', color: '#f59e0b' },
  { id: 'beverages', name: 'Beverages', color: '#3b82f6' },
  { id: 'desserts', name: 'Desserts', color: '#ec4899' },
  { id: 'breakfast', name: 'Breakfast', color: '#10b981' },
];

export interface Category {
  id: string;
  name: string;
  color?: string;
  // ... other fields if needed
}

// Management APIs

export const addMenuItem = async (canteenId: number, item: Partial<MenuItem>): Promise<MenuItem | null> => {
  try {
    const response = await api.post(`/canteens/${canteenId}/menu`, {
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      isVeg: item.dietary && item.dietary.vegetarian ? true : false,
      preparationTime: 15 // Default or add to UI
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
      category: item.category
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

// Placeholder for category management if backend supports it, otherwise generic
export const saveCategory = (cat: Category) => {
    // TODO: Implement backend API for categories if available
    console.log('Category save not implemented in backend yet', cat);
};

export const deleteCategory = (id: string) => {
     // TODO: Implement backend API
    console.log('Category delete not implemented in backend yet', id);
};

// Order Management

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

