/**
 * Order Entity - Domain Model
 * Represents a complete order with real-time tracking capabilities
 * Follows Clean Architecture principles
 */

export interface OrderItem {
  id: string;
  itemId: string;
  itemName: string;
  itemPrice: number;
  quantity: number;
  specialInstructions?: string;
  totalPrice: number; // quantity * itemPrice
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export type OrderStatus = 
  | 'pending'          // Order submitted, waiting for confirmation
  | 'confirmed'        // Order confirmed by restaurant
  | 'preparing'        // Order is being prepared
  | 'ready'           // Order is ready for pickup/delivery
  | 'completed'       // Order completed successfully
  | 'cancelled';      // Order was cancelled

export type OrderType = 'dine_in' | 'takeout' | 'delivery' | 'pickup';

export interface OrderPayment {
  method: 'cash' | 'card' | 'digital_wallet' | 'online';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  amount: number;
  transactionId?: string;
  processedAt?: Date;
}

export interface OrderCustomer {
  id?: string; // If registered customer
  name: string;
  phone?: string;
  email?: string;
  isGuest: boolean;
}

export interface Order {
  id: string;
  orderNumber: string; // Human-readable order number (e.g., "ORD-001", "ORD-002")
  placeId: string;
  branchId?: string; // Branch ID for filtering orders by branch
  customer: OrderCustomer;
  items: OrderItem[];
  status: OrderStatus;
  type: OrderType;
  
  // Table information (for dine-in orders)
  tableId?: string; // Table ID for dine-in orders
  notes?: string; // Additional notes (e.g., "Table: 1")
  
  // Pricing
  subtotal: number;
  tax: number;
  serviceFee?: number;
  deliveryFee?: number;
  discount?: number;
  total: number;
  
  // Real-time tracking
  lastUpdatedBy: string; // User ID who made the last update
  lastUpdatedAt: Date;
  
  // Metadata
  source: 'pos' | 'online' | 'mobile_app' | 'phone';
  version: number; // For optimistic locking
  createdAt: Date;
  updatedAt: Date;
}

// Command DTOs for creating orders
export interface CreateOrderCommand {
  placeId: string;
  customer: OrderCustomer;
  items: Omit<OrderItem, 'id' | 'totalPrice' | 'status' | 'createdAt' | 'updatedAt'>[];
  type: OrderType;
  payment: Omit<OrderPayment, 'status' | 'processedAt'>;
  source: 'pos' | 'online' | 'mobile_app' | 'phone';
  lastUpdatedBy: string;
  tableId?: string; // Table ID for dine-in orders
  notes?: string; // Additional notes
}

export interface UpdateOrderCommand {
  id: string;
  status?: OrderStatus;
  lastUpdatedBy: string;
}

// Query interfaces
export interface OrderQuery {
  placeId?: string;
  branchId?: string;
  status?: OrderStatus;
  type?: OrderType;
  customerId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  orderNumber?: string;
  source?: 'pos' | 'online' | 'mobile_app' | 'phone';
}

// Real-time subscription interfaces
export interface OrderSubscription {
  orderId?: string;
  placeId?: string;
  userId?: string;
  status?: OrderStatus[];
}
