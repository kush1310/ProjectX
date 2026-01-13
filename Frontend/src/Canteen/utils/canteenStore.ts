/**
 * Canteen Store - LocalStorage Persistence
 * 
 * Manages:
 * - Menu items (CRUD)
 * - Categories (CRUD)
 * - Orders (mock data for demo)
 */

// Types
export interface DietaryInfo {
  vegetarian: boolean;
  vegan: boolean;
  glutenFree: boolean;
  spicy: boolean;
  containsNuts: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  isAvailable: boolean;
  visibleInMenu: boolean;
  dietary: DietaryInfo;
  rating: number;
  salesCount: number;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  itemCount?: number;
}

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  orderNumber: number;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: OrderItem[];
  specialNotes?: string;
  total: number;
  status: 'new' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  createdAt: string;
  acceptedAt?: string;
  completedAt?: string;
  estimatedTime?: number; // minutes
  paymentMethod: 'cash' | 'upi' | 'card';
  isPaid: boolean;
  // Payment transaction details
  transactionId?: string;
  upiId?: string; // e.g. customer@paytm
  cardLast4?: string; // last 4 digits of card
  merchantName?: string;
  paidAt?: string;
}

// Storage Keys
const MENU_ITEMS_KEY = 'charusatneeds_menu_items';
const CATEGORIES_KEY = 'charusatneeds_categories';
const ORDERS_KEY = 'charusatneeds_orders';

// Default Categories
const DEFAULT_CATEGORIES: Category[] = [
  { id: 'hot-meals', name: 'Hot Meals', color: '#ef4444' },
  { id: 'snacks', name: 'Snacks', color: '#f59e0b' },
  { id: 'beverages', name: 'Beverages', color: '#3b82f6' },
  { id: 'desserts', name: 'Desserts', color: '#ec4899' },
  { id: 'breakfast', name: 'Breakfast', color: '#10b981' },
];

// Default Menu Items
const DEFAULT_MENU_ITEMS: MenuItem[] = [
  {
    id: '1',
    name: 'Paneer Butter Masala',
    description: 'Rich creamy tomato gravy with cottage cheese cubes. Best seller!',
    price: 120,
    category: 'Hot Meals',
    image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400',
    isAvailable: true,
    visibleInMenu: true,
    dietary: { vegetarian: true, vegan: false, glutenFree: true, spicy: false, containsNuts: true },
    rating: 4.8,
    salesCount: 1250,
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Veg Hakka Noodles',
    description: 'Wok-tossed noodles with crunchy vegetables and soy sauce.',
    price: 90,
    category: 'Hot Meals',
    image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400',
    isAvailable: true,
    visibleInMenu: true,
    dietary: { vegetarian: true, vegan: true, glutenFree: false, spicy: true, containsNuts: false },
    rating: 4.5,
    salesCount: 890,
    createdAt: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Cold Coffee',
    description: 'Thick hazelnut cold coffee topped with vanilla ice cream.',
    price: 60,
    category: 'Beverages',
    image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400',
    isAvailable: true,
    visibleInMenu: true,
    dietary: { vegetarian: true, vegan: false, glutenFree: true, spicy: false, containsNuts: true },
    rating: 4.9,
    salesCount: 2100,
    createdAt: new Date().toISOString()
  },
  {
    id: '4',
    name: 'Masala Dosa',
    description: 'Crispy rice crepe filled with spiced potato masala, served with sambar.',
    price: 75,
    category: 'Breakfast',
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400',
    isAvailable: true,
    visibleInMenu: true,
    dietary: { vegetarian: true, vegan: true, glutenFree: true, spicy: true, containsNuts: false },
    rating: 4.7,
    salesCount: 1500,
    createdAt: new Date().toISOString()
  },
  {
    id: '5',
    name: 'Cheese Grilled Sandwich',
    description: 'Triple layer sandwich loaded with mozzarella and cheddar blend.',
    price: 85,
    category: 'Snacks',
    image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400',
    isAvailable: false,
    visibleInMenu: true,
    dietary: { vegetarian: true, vegan: false, glutenFree: false, spicy: false, containsNuts: false },
    rating: 4.4,
    salesCount: 600,
    createdAt: new Date().toISOString()
  }
];

// Mock Orders for Demo
const MOCK_ORDERS: Order[] = [
  {
    id: 'ord-1',
    orderNumber: 402,
    customerName: 'Sarah J.',
    customerPhone: '+91 98765 43210',
    customerAddress: 'DEPSTAR Block, Room 301',
    items: [
      { name: 'Classic Burger', quantity: 2, price: 24.00 },
      { name: 'Truffle Fries', quantity: 1, price: 6.50 }
    ],
    specialNotes: 'No pickles on burgers please.',
    total: 30.50,
    status: 'new',
    createdAt: new Date(Date.now() - 8 * 60000).toISOString(),
    estimatedTime: 15,
    paymentMethod: 'upi',
    isPaid: true,
    transactionId: 'TXN402983746589',
    upiId: 'sarah.j@paytm',
    merchantName: 'CharusatNeeds Canteen',
    paidAt: new Date(Date.now() - 9 * 60000).toISOString()
  },
  {
    id: 'ord-2',
    orderNumber: 405,
    customerName: 'Mike T.',
    customerPhone: '+91 87654 32109',
    customerAddress: 'CSPIT Main Building, Lab 5',
    items: [
      { name: 'Pepperoni Pizza (L)', quantity: 1, price: 18.00 },
      { name: 'Coke Zero', quantity: 2, price: 5.00 }
    ],
    total: 23.00,
    status: 'new',
    createdAt: new Date(Date.now() - 2 * 60000).toISOString(),
    estimatedTime: 20,
    paymentMethod: 'cash',
    isPaid: false
  },
  {
    id: 'ord-3',
    orderNumber: 406,
    customerName: 'Alex R.',
    customerPhone: '+91 76543 21098',
    customerAddress: 'Library, Floor 2',
    items: [
      { name: 'Vegan Bowl', quantity: 1, price: 14.50 }
    ],
    total: 14.50,
    status: 'new',
    createdAt: new Date(Date.now() - 1 * 60000).toISOString(),
    estimatedTime: 10,
    paymentMethod: 'card',
    isPaid: true,
    transactionId: 'TXN406127349875',
    cardLast4: '4521',
    merchantName: 'CharusatNeeds Canteen',
    paidAt: new Date(Date.now() - 1.5 * 60000).toISOString()
  },
  {
    id: 'ord-4',
    orderNumber: 407,
    customerName: 'Corporate Order',
    customerPhone: '+91 65432 10987',
    customerAddress: 'Admin Block, Conference Room A',
    items: [
      { name: 'Coffee Combo', quantity: 5, price: 45.00 },
      { name: 'Bagel (Cream Cheese)', quantity: 5, price: 25.00 }
    ],
    total: 70.00,
    status: 'new',
    createdAt: new Date(Date.now() - 2.5 * 60000).toISOString(),
    estimatedTime: 25,
    paymentMethod: 'upi',
    isPaid: true,
    transactionId: 'TXN407582947612',
    upiId: 'corporate@ybl',
    merchantName: 'CharusatNeeds Canteen',
    paidAt: new Date(Date.now() - 3 * 60000).toISOString()
  },
  {
    id: 'ord-5',
    orderNumber: 398,
    customerName: 'Priya S.',
    customerPhone: '+91 54321 09876',
    customerAddress: 'Hostel C, Room 205',
    items: [
      { name: 'Paneer Tikka', quantity: 2, price: 35.00 }
    ],
    total: 35.00,
    status: 'preparing',
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
    acceptedAt: new Date(Date.now() - 12 * 60000).toISOString(),
    estimatedTime: 20,
    paymentMethod: 'cash',
    isPaid: false
  },
  {
    id: 'ord-6',
    orderNumber: 395,
    customerName: 'Rahul K.',
    customerPhone: '+91 43210 98765',
    customerAddress: 'Sports Complex',
    items: [
      { name: 'Protein Shake', quantity: 3, price: 27.00 },
      { name: 'Energy Bar', quantity: 2, price: 10.00 }
    ],
    total: 37.00,
    status: 'ready',
    createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
    acceptedAt: new Date(Date.now() - 22 * 60000).toISOString(),
    estimatedTime: 12,
    paymentMethod: 'upi',
    isPaid: true,
    transactionId: 'TXN395837461952',
    upiId: 'rahul.fitness@gpay',
    merchantName: 'CharusatNeeds Canteen',
    paidAt: new Date(Date.now() - 26 * 60000).toISOString()
  },
  {
    id: 'ord-7',
    orderNumber: 390,
    customerName: 'Amit P.',
    customerPhone: '+91 32109 87654',
    customerAddress: 'PDPIAS, Ground Floor',
    items: [
      { name: 'Thali Meal', quantity: 1, price: 85.00 }
    ],
    total: 85.00,
    status: 'completed',
    createdAt: new Date(Date.now() - 60 * 60000).toISOString(),
    acceptedAt: new Date(Date.now() - 55 * 60000).toISOString(),
    completedAt: new Date(Date.now() - 35 * 60000).toISOString(),
    estimatedTime: 25,
    paymentMethod: 'card',
    isPaid: true,
    transactionId: 'TXN390938475621',
    cardLast4: '7823',
    merchantName: 'CharusatNeeds Canteen',
    paidAt: new Date(Date.now() - 61 * 60000).toISOString()
  }
];

// ==================== MENU ITEMS ====================
export function getMenuItems(): MenuItem[] {
  try {
    const stored = localStorage.getItem(MENU_ITEMS_KEY);
    if (stored) return JSON.parse(stored);
    // Initialize with defaults
    localStorage.setItem(MENU_ITEMS_KEY, JSON.stringify(DEFAULT_MENU_ITEMS));
    return DEFAULT_MENU_ITEMS;
  } catch {
    return DEFAULT_MENU_ITEMS;
  }
}

export function saveMenuItem(item: MenuItem): void {
  const items = getMenuItems();
  const existingIndex = items.findIndex(i => i.id === item.id);
  if (existingIndex >= 0) {
    items[existingIndex] = item;
  } else {
    items.unshift(item);
  }
  localStorage.setItem(MENU_ITEMS_KEY, JSON.stringify(items));
}

export function deleteMenuItem(id: string): void {
  const items = getMenuItems().filter(i => i.id !== id);
  localStorage.setItem(MENU_ITEMS_KEY, JSON.stringify(items));
}

export function toggleItemAvailability(id: string): MenuItem | null {
  const items = getMenuItems();
  const item = items.find(i => i.id === id);
  if (item) {
    item.isAvailable = !item.isAvailable;
    localStorage.setItem(MENU_ITEMS_KEY, JSON.stringify(items));
    return item;
  }
  return null;
}

// ==================== CATEGORIES ====================
export function getCategories(): Category[] {
  try {
    const stored = localStorage.getItem(CATEGORIES_KEY);
    if (stored) return JSON.parse(stored);
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(DEFAULT_CATEGORIES));
    return DEFAULT_CATEGORIES;
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

export function saveCategory(category: Category): void {
  const categories = getCategories();
  const existingIndex = categories.findIndex(c => c.id === category.id);
  if (existingIndex >= 0) {
    categories[existingIndex] = category;
  } else {
    categories.push(category);
  }
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
}

export function deleteCategory(id: string): void {
  const categories = getCategories().filter(c => c.id !== id);
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
}

// ==================== ORDERS ====================
export function getOrders(): Order[] {
  try {
    const stored = localStorage.getItem(ORDERS_KEY);
    if (stored) return JSON.parse(stored);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(MOCK_ORDERS));
    return MOCK_ORDERS;
  } catch {
    return MOCK_ORDERS;
  }
}

export function updateOrderStatus(id: string, status: Order['status']): Order | null {
  const orders = getOrders();
  const order = orders.find(o => o.id === id);
  if (order) {
    order.status = status;
    if (status === 'preparing') order.acceptedAt = new Date().toISOString();
    if (status === 'completed') order.completedAt = new Date().toISOString();
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    return order;
  }
  return null;
}

export function getOrdersByStatus(status: Order['status']): Order[] {
  return getOrders().filter(o => o.status === status);
}

export function getRecentOrders(count: number = 5): Order[] {
  return getOrders()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, count);
}

export function getOrderHistory(): Order[] {
  return getOrders()
    .filter(o => o.status === 'completed' || o.status === 'cancelled')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// Stats
export function getOrderStats() {
  const orders = getOrders();
  const activeOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
  const completedToday = orders.filter(o => {
    if (o.status !== 'completed') return false;
    const today = new Date().toDateString();
    return new Date(o.completedAt || o.createdAt).toDateString() === today;
  });
  
  const avgTime = activeOrders.length > 0 
    ? Math.round(activeOrders.reduce((acc, o) => acc + (o.estimatedTime || 15), 0) / activeOrders.length)
    : 0;
  
  const todayRevenue = completedToday.reduce((acc, o) => acc + o.total, 0);

  return {
    activeCount: activeOrders.length,
    avgTime,
    todayRevenue: todayRevenue.toFixed(2)
  };
}
