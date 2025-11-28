import { 
  Cart, 
  CreateCartCommand, 
  AddItemToCartCommand, 
  UpdateCartItemCommand, 
  RemoveItemFromCartCommand,
  ApplyDiscountCommand,
  ConvertCartToOrderCommand,
  UpdateCartCommand,
  CartQuery 
} from '../../entities/cart.entity';

/**
 * Cart Service Interface - MANDATORY
 * Defines business logic contracts for cart operations
 * Follows SOLID principles and Clean Architecture
 * Contains ALL business logic and validation
 */
export interface ICartService {
  // Cart lifecycle management
  createCart(command: CreateCartCommand): Promise<Cart>;
  getCartById(cartId: string): Promise<Cart | null>;
  updateCart(command: UpdateCartCommand): Promise<Cart>;
  deleteCart(cartId: string): Promise<void>;
  
  // Cart queries
  getCartsByPlaceId(placeId: string, query?: CartQuery): Promise<Cart[]>;
  getCartsByCustomerId(customerId: string, query?: CartQuery): Promise<Cart[]>;
  getCartsBySessionId(sessionId: string, query?: CartQuery): Promise<Cart[]>;
  getActiveCartByCustomerId(customerId: string, placeId: string): Promise<Cart | null>;
  getActiveCartBySessionId(sessionId: string, placeId: string): Promise<Cart | null>;
  getAbandonedCarts(placeId: string, hoursAgo?: number): Promise<Cart[]>;
  
  // Cart item operations
  addItemToCart(command: AddItemToCartCommand): Promise<Cart>;
  updateCartItem(command: UpdateCartItemCommand): Promise<Cart>;
  removeItemFromCart(command: RemoveItemFromCartCommand): Promise<Cart>;
  clearCartItems(cartId: string): Promise<Cart>;
  
  // Cart operations
  applyDiscount(command: ApplyDiscountCommand): Promise<Cart>;
  removeDiscount(cartId: string): Promise<Cart>;
  convertCartToOrder(command: ConvertCartToOrderCommand): Promise<{ orderId: string; cartId: string }>;
  
  // Cart status management
  markCartAsAbandoned(cartId: string): Promise<void>;
  markCartAsConverted(cartId: string): Promise<void>;
  updateCartActivity(cartId: string): Promise<void>;
  
  // Cart expiration management
  getExpiredCarts(placeId?: string): Promise<Cart[]>;
  deleteExpiredCarts(placeId?: string): Promise<number>;
  extendCartExpiration(cartId: string, minutes?: number): Promise<Cart>;
  
  // Real-time subscriptions
  subscribeToCartsByPlaceId(placeId: string, callback: (carts: Cart[]) => void): () => void;
  subscribeToCartUpdates(cartId: string, callback: (cart: Cart | null) => void): () => void;
  subscribeToCartsByCustomerId(customerId: string, callback: (carts: Cart[]) => void): () => void;
  subscribeToCartsBySessionId(sessionId: string, callback: (carts: Cart[]) => void): () => void;
  
  // Analytics and reporting
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
  
  // Business validation methods
  validateCartItem(item: AddItemToCartCommand): Promise<boolean>;
  validateCartConversion(command: ConvertCartToOrderCommand): Promise<boolean>;
  validateDiscountCode(discountCode: string, cartId: string): Promise<boolean>;
  
  // Cart cleanup and maintenance
  cleanupAbandonedCarts(placeId?: string): Promise<number>;
  processCartExpiration(): Promise<number>;
}




