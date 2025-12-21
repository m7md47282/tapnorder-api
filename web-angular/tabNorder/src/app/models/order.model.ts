export interface OrderItem {
  id: string;
  menuItemId?: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  comments?: string;
  customizations?: {
    [key: string]: {
      name: string;
      price: number;
    }[];
  };
  totalPrice?: number; // price * quantity + customizations
}

export interface CreateOrderData {
  placeId?: string;
  tableId?: string;
  items: OrderItem[];
  userId?: string;
  userName?: string;
  customerNotes?: string;
  estimatedTime?: number; // in minutes
}

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type PaymentMethod = 'cash' | 'card' | 'digital_wallet' | 'qr_code';

export interface Order {
  id: string;
  placeId: string;
  tableId?: string;
  items: OrderItem[];
  status: OrderStatus;
  statusHistory?: Array<{
    status: OrderStatus;
    timestamp: Date;
    notes?: string;
  }>;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  total: number;
  totalAmount?: number;
  taxAmount?: number;
  finalAmount?: number;
  createdAt: Date;
  updatedAt: Date;
  userId?: string;
  userName?: string;
  customerNotes?: string;
  estimatedTime?: number;
  actualDeliveryTime?: Date;
  kitchenNotes?: string;
  cashierNotes?: string;
  paid?: boolean;
}

export interface OrderFilters {
  status?: OrderStatus[];
  paymentStatus?: PaymentStatus[];
  tableId?: string;
  userId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  minAmount?: number;
  maxAmount?: number;
}

export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  preparingOrders: number;
  readyOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  averagePreparationTime: number;
}

export interface TableOrder {
  tableId: string;
  tableNumber: string;
  orders: Order[];
  totalAmount: number;
  status: 'active' | 'empty' | 'needs_attention';
  lastOrderTime?: Date;
}

export interface OrderUpdate {
  orderId: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  kitchenNotes?: string;
  cashierNotes?: string;
  estimatedTime?: number;
  actualDeliveryTime?: Date;
}
