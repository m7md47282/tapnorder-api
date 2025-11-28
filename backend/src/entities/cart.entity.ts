/**
 * Cart Entity - Domain Model
 * Represents a shopping cart with real-time capabilities
 * Follows Clean Architecture principles
 */

export interface CartItem {
  id: string;
  itemId: string;
  itemName: string;
  itemPrice: number;
  quantity: number;
  specialInstructions?: string;
  totalPrice: number; // quantity * itemPrice
  addedAt: Date;
  updatedAt: Date;
}

export type CartStatus = 
  | 'active'        // Cart is being used
  | 'abandoned'     // Cart was abandoned by customer
  | 'converted';    // Cart was converted to order

export interface Cart {
  id: string;
  placeId: string;
  customerId?: string; // Optional for registered customers
  sessionId?: string;  // For anonymous/guest carts
  items: CartItem[];
  status: CartStatus;
  
  // Pricing
  subtotal: number;
  tax: number;
  serviceFee?: number;
  deliveryFee?: number;
  discount?: number;
  total: number;
  
  // Cart lifecycle
  expiresAt: Date; // Cart expiration time
  lastActivityAt: Date; // Last activity timestamp
  
  // Metadata
  source: 'pos' | 'online' | 'mobile_app' | 'phone';
  version: number; // For optimistic locking
  createdAt: Date;
  updatedAt: Date;
}

// Command DTOs for cart operations
export interface CreateCartCommand {
  placeId: string;
  customerId?: string;
  sessionId?: string;
  source: 'pos' | 'online' | 'mobile_app' | 'phone';
}

export interface AddItemToCartCommand {
  cartId: string;
  itemId: string;
  itemName: string;
  itemPrice: number;
  quantity: number;
  specialInstructions?: string;
}

export interface UpdateCartItemCommand {
  cartId: string;
  itemId: string;
  quantity: number;
  specialInstructions?: string;
}

export interface RemoveItemFromCartCommand {
  cartId: string;
  itemId: string;
}

export interface ApplyDiscountCommand {
  cartId: string;
  discountCode: string;
  discountAmount?: number;
  discountType: 'percentage' | 'fixed';
}

export interface ConvertCartToOrderCommand {
  cartId: string;
  customer: {
    id?: string;
    name: string;
    phone?: string;
    email?: string;
    isGuest: boolean;
  };
  payment: {
    method: 'cash' | 'card' | 'digital_wallet' | 'online';
    amount: number;
    transactionId?: string;
  };
  orderType: 'dine_in' | 'takeout' | 'delivery' | 'pickup';
  lastUpdatedBy: string;
}

export interface UpdateCartCommand {
  id: string;
  status?: CartStatus;
  lastActivityAt?: Date;
}

// Query interfaces
export interface CartQuery {
  placeId?: string;
  customerId?: string;
  sessionId?: string;
  status?: CartStatus;
  source?: 'pos' | 'online' | 'mobile_app' | 'phone';
  dateFrom?: Date;
  dateTo?: Date;
}

// Real-time subscription interfaces
export interface CartSubscription {
  cartId?: string;
  placeId?: string;
  customerId?: string;
  sessionId?: string;
}




