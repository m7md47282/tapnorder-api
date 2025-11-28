/**
 * Cart Repository Types
 * Type definitions for cart repository operations
 * Follows existing repository patterns
 */

import { Cart } from '../../entities/cart.entity';

// Cart statistics interface
export interface CartStatistics {
  totalCarts: number;
  activeCarts: number;
  abandonedCarts: number;
  convertedCarts: number;
  averageCartValue: number;
  totalCartValue: number;
}

// Popular cart items interface
export interface PopularCartItem {
  itemId: string;
  itemName: string;
  totalQuantity: number;
  totalValue: number;
  cartCount: number;
}

// Cart expiration settings
export interface CartExpirationSettings {
  defaultExpirationMinutes: number;
  abandonedCartHours: number;
  cleanupIntervalHours: number;
}

// Cart search filters
export interface CartSearchFilters {
  placeId?: string;
  customerId?: string;
  sessionId?: string;
  status?: Cart['status'];
  source?: Cart['source'];
  dateFrom?: Date;
  dateTo?: Date;
  minValue?: number;
  maxValue?: number;
  hasItems?: boolean;
}

// Cart update operations
export interface CartUpdateOperation {
  type: 'add_item' | 'update_item' | 'remove_item' | 'clear_items' | 'update_status' | 'apply_discount' | 'remove_discount';
  data: any;
  timestamp: Date;
}

// Cart real-time events
export interface CartRealtimeEvent {
  type: 'cart_created' | 'cart_updated' | 'cart_deleted' | 'item_added' | 'item_updated' | 'item_removed' | 'cart_abandoned' | 'cart_converted';
  cartId: string;
  placeId: string;
  data: Partial<Cart>;
  timestamp: Date;
}

// Cart validation result
export interface CartValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Cart conversion result
export interface CartConversionResult {
  success: boolean;
  orderId?: string;
  cartId: string;
  errors?: string[];
}
