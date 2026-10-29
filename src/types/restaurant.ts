/**
 * Restaurant System Shared Types
 */

export type DietaryType = 'veg' | 'non-veg' | 'vegan' | 'spicy' | 'gluten-free';

export interface ItemVariant {
  id: string; // e.g. 'half' | 'full' | 'regular' | 'large'
  name: string; // 'Half Plate' | 'Full Plate'
  price: number;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  basePrice: number;
  image: string;
  isAvailable: boolean;
  dietary: DietaryType[];
  prepTimeMinutes: number;
  variants: ItemVariant[];
  popular?: boolean;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  sortOrder: number;
}

export type OrderStatus = 'received' | 'preparing' | 'ready' | 'served' | 'cancelled';
export type OrderType = 'dine_in' | 'takeaway';

export interface OrderItem {
  itemId: string;
  name: string;
  variantId?: string;
  variantName?: string;
  unitPrice: number; // Set by server
  quantity: number;
  itemTotal: number; // Set by server
  notes?: string;
}

export interface StatusHistoryEntry {
  status: OrderStatus;
  timestamp: string;
  note?: string;
}

export interface OrderRating {
  rating: number; // 1 to 5
  aspects: string[];
  comment?: string;
  itemRatings?: Record<string, 'loved' | 'good' | 'could_improve'>;
  createdAt: string;
}

export interface CustomerUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

export interface Order {
  id: string;
  orderNumber: number;
  orderType: OrderType;
  tableNumber?: number;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  notes?: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  totalAmount: number;
  status: OrderStatus;
  statusHistory: StatusHistoryEntry[];
  rating?: OrderRating;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderPayload {
  orderType: OrderType;
  tableNumber?: number;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  notes?: string;
  items: {
    itemId: string;
    variantId?: string;
    quantity: number;
    notes?: string;
  }[];
}

export interface SubmitRatingPayload {
  rating: number; // 1 to 5
  aspects?: string[];
  comment?: string;
  itemRatings?: Record<string, 'loved' | 'good' | 'could_improve'>;
}

export interface ServerEvent {
  type: 'order:created' | 'order:updated' | 'order:rated' | 'menu:updated' | 'item:stock_changed' | 'ping';
  data: any;
  timestamp: string;
}

export interface RecentFeedbackEntry {
  orderId: string;
  orderNumber: number;
  rating: number;
  aspects: string[];
  comment?: string;
  createdAt: string;
}

export interface AnalyticsSummary {
  todayRevenue: number;
  todayOrdersCount: number;
  averageOrderValue: number;
  activeOrdersCount: number;
  statusBreakdown: Record<OrderStatus, number>;
  popularItems: { itemId: string; name: string; count: number; revenue: number }[];
  hourlySales: { hour: string; count: number; revenue: number }[];
  satisfactionSummary: {
    averageRating: number;
    totalRatings: number;
    ratingBreakdown: Record<number, number>; // 1 -> count, 2 -> count...
    recentFeedbacks: RecentFeedbackEntry[];
  };
}
