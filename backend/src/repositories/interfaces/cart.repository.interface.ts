import { Cart, CartQuery, CartItem } from '../../entities/cart.entity';
import { IBaseRepository } from '../base.repository';

/**
 * Cart Repository Interface - MANDATORY
 * Extends IBaseRepository for basic CRUD operations
 * Defines cart-specific business queries
 * Follows SOLID principles and Clean Architecture
 */
export interface ICartRepository extends IBaseRepository<Cart> {
  // Cart-specific queries
  getCartsByPlaceId(placeId: string, query?: CartQuery): Promise<Cart[]>;
  getCartsByCustomerId(customerId: string, query?: CartQuery): Promise<Cart[]>;
  getCartsBySessionId(sessionId: string, query?: CartQuery): Promise<Cart[]>;
  getActiveCartByCustomerId(customerId: string, placeId: string): Promise<Cart | null>;
  getActiveCartBySessionId(sessionId: string, placeId: string): Promise<Cart | null>;
  getAbandonedCarts(placeId: string, hoursAgo?: number): Promise<Cart[]>;
  
  // Cart item operations
  addItemToCart(cartId: string, item: Omit<CartItem, 'id' | 'addedAt' | 'updatedAt' | 'totalPrice'>): Promise<void>;
  updateCartItem(cartId: string, itemId: string, updates: Partial<Pick<CartItem, 'quantity' | 'specialInstructions'>>): Promise<void>;
  removeItemFromCart(cartId: string, itemId: string): Promise<void>;
  clearCartItems(cartId: string): Promise<void>;
  
  // Cart status operations
  updateCartStatus(cartId: string, status: Cart['status'], lastActivityAt?: Date): Promise<void>;
  markCartAsAbandoned(cartId: string): Promise<void>;
  markCartAsConverted(cartId: string): Promise<void>;
  
  // Cart expiration
  getExpiredCarts(placeId?: string): Promise<Cart[]>;
  deleteExpiredCarts(placeId?: string): Promise<number>;
  
  // Real-time subscriptions
  subscribeToCartsByPlaceId(placeId: string, callback: (carts: Cart[]) => void): () => void;
  subscribeToCartUpdates(cartId: string, callback: (cart: Cart | null) => void): () => void;
  subscribeToCartsByCustomerId(customerId: string, callback: (carts: Cart[]) => void): () => void;
  subscribeToCartsBySessionId(sessionId: string, callback: (carts: Cart[]) => void): () => void;
  
  // Analytics queries
  getCartStatistics(placeId: string, dateFrom?: Date, dateTo?: Date): Promise<{
    totalCarts: number;
    activeCarts: number;
    abandonedCarts: number;
    convertedCarts: number;
    averageCartValue: number;
    totalCartValue: number;
  }>;
  
  getPopularCartItems(placeId: string, limit?: number): Promise<Array<{
    itemId: string;
    itemName: string;
    totalQuantity: number;
    totalValue: number;
    cartCount: number;
  }>>;
}
