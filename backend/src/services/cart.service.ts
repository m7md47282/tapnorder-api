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
} from '../entities/cart.entity';
import { ICartRepository } from '../repositories/interfaces/cart.repository.interface';
import { CartRepository } from '../repositories/cart/cart.repository';
import { ICartService } from './interfaces/cart.service.interface';

/**
 * Cart Service - Contains ALL business logic and validation
 * Follows SOLID principles and Clean Architecture
 * Uses repository for data access ONLY
 * Implements comprehensive business rules and validation
 */
export class CartService implements ICartService {
  private readonly cartRepository: ICartRepository;

  constructor(cartRepository?: ICartRepository) {
    this.cartRepository = cartRepository ?? new CartRepository();
  }

  // Cart lifecycle management
  async createCart(command: CreateCartCommand): Promise<Cart> {
    // Business validation
    this.validateCreateCartCommand(command);

    // Check for existing active cart
    let existingCart: Cart | null = null;
    if (command.customerId) {
      existingCart = await this.cartRepository.getActiveCartByCustomerId(command.customerId, command.placeId);
    } else if (command.sessionId) {
      existingCart = await this.cartRepository.getActiveCartBySessionId(command.sessionId, command.placeId);
    }

    if (existingCart) {
      // Extend expiration of existing cart
      await this.extendCartExpiration(existingCart.id);
      return existingCart;
    }

    // Create new cart
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30); // 30 minutes expiration

    const cartData: Omit<Cart, 'id' | 'createdAt' | 'updatedAt'> = {
      placeId: command.placeId,
      customerId: command.customerId,
      sessionId: command.sessionId,
      items: [],
      status: 'active',
      subtotal: 0,
      tax: 0,
      total: 0,
      expiresAt,
      lastActivityAt: new Date(),
      source: command.source,
      version: 1
    };

    const cartId = await this.cartRepository.create(cartData);
    const cart = await this.cartRepository.getById(cartId);
    
    if (!cart) {
      throw new Error('Failed to create cart');
    }

    return cart;
  }

  async getCartById(cartId: string): Promise<Cart | null> {
    return await this.cartRepository.getById(cartId);
  }

  async updateCart(command: UpdateCartCommand): Promise<Cart> {
    // Business validation
    this.validateUpdateCartCommand(command);

    const existingCart = await this.cartRepository.getById(command.id);
    if (!existingCart) {
      throw new Error('Cart not found');
    }

    // Check if cart is still active
    if (existingCart.status !== 'active') {
      throw new Error('Cannot update inactive cart');
    }

    // Update cart
    const updateData: Partial<Cart> = {
      lastActivityAt: new Date(),
      version: existingCart.version + 1
    };

    if (command.status) {
      updateData.status = command.status;
    }

    if (command.lastActivityAt) {
      updateData.lastActivityAt = command.lastActivityAt;
    }

    await this.cartRepository.update(command.id, updateData);

    const updatedCart = await this.cartRepository.getById(command.id);
    if (!updatedCart) {
      throw new Error('Failed to retrieve updated cart');
    }

    return updatedCart;
  }

  async deleteCart(cartId: string): Promise<void> {
    const cart = await this.cartRepository.getById(cartId);
    if (!cart) {
      throw new Error('Cart not found');
    }

    // Business rule: Only allow deletion of active or abandoned carts
    if (cart.status === 'converted') {
      throw new Error('Cannot delete converted cart');
    }

    await this.cartRepository.delete(cartId);
  }

  // Cart queries
  async getCartsByPlaceId(placeId: string, query?: CartQuery): Promise<Cart[]> {
    return await this.cartRepository.getCartsByPlaceId(placeId, query);
  }

  async getCartsByCustomerId(customerId: string, query?: CartQuery): Promise<Cart[]> {
    return await this.cartRepository.getCartsByCustomerId(customerId, query);
  }

  async getCartsBySessionId(sessionId: string, query?: CartQuery): Promise<Cart[]> {
    return await this.cartRepository.getCartsBySessionId(sessionId, query);
  }

  async getActiveCartByCustomerId(customerId: string, placeId: string): Promise<Cart | null> {
    return await this.cartRepository.getActiveCartByCustomerId(customerId, placeId);
  }

  async getActiveCartBySessionId(sessionId: string, placeId: string): Promise<Cart | null> {
    return await this.cartRepository.getActiveCartBySessionId(sessionId, placeId);
  }

  async getAbandonedCarts(placeId: string, hoursAgo: number = 24): Promise<Cart[]> {
    return await this.cartRepository.getAbandonedCarts(placeId, hoursAgo);
  }

  // Cart item operations
  async addItemToCart(command: AddItemToCartCommand): Promise<Cart> {
    // Business validation
    await this.validateCartItem(command);

    const cart = await this.cartRepository.getById(command.cartId);
    if (!cart) {
      throw new Error('Cart not found');
    }

    // Check if cart is still active
    if (cart.status !== 'active') {
      throw new Error('Cannot add items to inactive cart');
    }

    // Check if cart has expired
    if (cart.expiresAt < new Date()) {
      throw new Error('Cart has expired');
    }

    // Check if item already exists in cart
    const existingItem = cart.items.find(item => item.itemId === command.itemId);
    if (existingItem) {
      // Update quantity instead of adding new item
      await this.cartRepository.updateCartItem(command.cartId, existingItem.id, {
        quantity: existingItem.quantity + command.quantity,
        specialInstructions: command.specialInstructions || existingItem.specialInstructions
      });
    } else {
      // Add new item
      await this.cartRepository.addItemToCart(command.cartId, {
        itemId: command.itemId,
        itemName: command.itemName,
        itemPrice: command.itemPrice,
        quantity: command.quantity,
        specialInstructions: command.specialInstructions
      });
    }

    // Extend cart expiration
    await this.extendCartExpiration(command.cartId);

    const updatedCart = await this.cartRepository.getById(command.cartId);
    if (!updatedCart) {
      throw new Error('Failed to retrieve updated cart');
    }

    return updatedCart;
  }

  async updateCartItem(command: UpdateCartItemCommand): Promise<Cart> {
    // Business validation
    this.validateUpdateCartItemCommand(command);

    const cart = await this.cartRepository.getById(command.cartId);
    if (!cart) {
      throw new Error('Cart not found');
    }

    // Check if cart is still active
    if (cart.status !== 'active') {
      throw new Error('Cannot update items in inactive cart');
    }

    // Check if cart has expired
    if (cart.expiresAt < new Date()) {
      throw new Error('Cart has expired');
    }

    // Check if item exists in cart
    const existingItem = cart.items.find(item => item.id === command.itemId);
    if (!existingItem) {
      throw new Error('Item not found in cart');
    }

    // Business rule: Quantity must be positive
    if (command.quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    await this.cartRepository.updateCartItem(command.cartId, command.itemId, {
      quantity: command.quantity,
      specialInstructions: command.specialInstructions
    });

    // Extend cart expiration
    await this.extendCartExpiration(command.cartId);

    const updatedCart = await this.cartRepository.getById(command.cartId);
    if (!updatedCart) {
      throw new Error('Failed to retrieve updated cart');
    }

    return updatedCart;
  }

  async removeItemFromCart(command: RemoveItemFromCartCommand): Promise<Cart> {
    // Business validation
    this.validateRemoveItemFromCartCommand(command);

    const cart = await this.cartRepository.getById(command.cartId);
    if (!cart) {
      throw new Error('Cart not found');
    }

    // Check if cart is still active
    if (cart.status !== 'active') {
      throw new Error('Cannot remove items from inactive cart');
    }

    // Check if item exists in cart
    const existingItem = cart.items.find(item => item.id === command.itemId);
    if (!existingItem) {
      throw new Error('Item not found in cart');
    }

    await this.cartRepository.removeItemFromCart(command.cartId, command.itemId);

    // Extend cart expiration
    await this.extendCartExpiration(command.cartId);

    const updatedCart = await this.cartRepository.getById(command.cartId);
    if (!updatedCart) {
      throw new Error('Failed to retrieve updated cart');
    }

    return updatedCart;
  }

  async clearCartItems(cartId: string): Promise<Cart> {
    const cart = await this.cartRepository.getById(cartId);
    if (!cart) {
      throw new Error('Cart not found');
    }

    // Check if cart is still active
    if (cart.status !== 'active') {
      throw new Error('Cannot clear items from inactive cart');
    }

    await this.cartRepository.clearCartItems(cartId);

    // Extend cart expiration
    await this.extendCartExpiration(cartId);

    const updatedCart = await this.cartRepository.getById(cartId);
    if (!updatedCart) {
      throw new Error('Failed to retrieve updated cart');
    }

    return updatedCart;
  }

  // Cart operations
  async applyDiscount(command: ApplyDiscountCommand): Promise<Cart> {
    // Business validation
    await this.validateDiscountCode(command.discountCode, command.cartId);

    const cart = await this.cartRepository.getById(command.cartId);
    if (!cart) {
      throw new Error('Cart not found');
    }

    // Check if cart is still active
    if (cart.status !== 'active') {
      throw new Error('Cannot apply discount to inactive cart');
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (command.discountType === 'percentage') {
      discountAmount = cart.subtotal * (command.discountAmount || 0) / 100;
    } else {
      discountAmount = command.discountAmount || 0;
    }

    // Business rule: Discount cannot exceed subtotal
    discountAmount = Math.min(discountAmount, cart.subtotal);

    const newTotal = cart.subtotal + cart.tax + (cart.serviceFee || 0) + (cart.deliveryFee || 0) - discountAmount;

    await this.cartRepository.update(command.cartId, {
      discount: discountAmount,
      total: newTotal,
      lastActivityAt: new Date(),
      version: cart.version + 1
    });

    const updatedCart = await this.cartRepository.getById(command.cartId);
    if (!updatedCart) {
      throw new Error('Failed to retrieve updated cart');
    }

    return updatedCart;
  }

  async removeDiscount(cartId: string): Promise<Cart> {
    const cart = await this.cartRepository.getById(cartId);
    if (!cart) {
      throw new Error('Cart not found');
    }

    // Check if cart is still active
    if (cart.status !== 'active') {
      throw new Error('Cannot remove discount from inactive cart');
    }

    const newTotal = cart.subtotal + cart.tax + (cart.serviceFee || 0) + (cart.deliveryFee || 0);

    await this.cartRepository.update(cartId, {
      discount: 0,
      total: newTotal,
      lastActivityAt: new Date(),
      version: cart.version + 1
    });

    const updatedCart = await this.cartRepository.getById(cartId);
    if (!updatedCart) {
      throw new Error('Failed to retrieve updated cart');
    }

    return updatedCart;
  }

  async convertCartToOrder(command: ConvertCartToOrderCommand): Promise<{ orderId: string; cartId: string }> {
    // Business validation
    await this.validateCartConversion(command);

    const cart = await this.cartRepository.getById(command.cartId);
    if (!cart) {
      throw new Error('Cart not found');
    }

    // Check if cart is still active
    if (cart.status !== 'active') {
      throw new Error('Cannot convert inactive cart');
    }

    // Check if cart has items
    if (cart.items.length === 0) {
      throw new Error('Cannot convert empty cart');
    }

    // Check if cart has expired
    if (cart.expiresAt < new Date()) {
      throw new Error('Cart has expired');
    }

    // Mark cart as converted
    await this.cartRepository.markCartAsConverted(command.cartId);

    // TODO: Create order using OrderService
    // This would integrate with the existing order system
    const orderId = 'ORDER_' + Date.now(); // Placeholder

    return { orderId, cartId: command.cartId };
  }

  // Cart status management
  async markCartAsAbandoned(cartId: string): Promise<void> {
    const cart = await this.cartRepository.getById(cartId);
    if (!cart) {
      throw new Error('Cart not found');
    }

    if (cart.status !== 'active') {
      throw new Error('Cannot mark non-active cart as abandoned');
    }

    await this.cartRepository.markCartAsAbandoned(cartId);
  }

  async markCartAsConverted(cartId: string): Promise<void> {
    const cart = await this.cartRepository.getById(cartId);
    if (!cart) {
      throw new Error('Cart not found');
    }

    if (cart.status !== 'active') {
      throw new Error('Cannot mark non-active cart as converted');
    }

    await this.cartRepository.markCartAsConverted(cartId);
  }

  async updateCartActivity(cartId: string): Promise<void> {
    const cart = await this.cartRepository.getById(cartId);
    if (!cart) {
      throw new Error('Cart not found');
    }

    if (cart.status !== 'active') {
      throw new Error('Cannot update activity for inactive cart');
    }

    await this.cartRepository.updateCartStatus(cartId, 'active', new Date());
  }

  // Cart expiration management
  async getExpiredCarts(placeId?: string): Promise<Cart[]> {
    return await this.cartRepository.getExpiredCarts(placeId);
  }

  async deleteExpiredCarts(placeId?: string): Promise<number> {
    return await this.cartRepository.deleteExpiredCarts(placeId);
  }

  async extendCartExpiration(cartId: string, minutes: number = 30): Promise<Cart> {
    const cart = await this.cartRepository.getById(cartId);
    if (!cart) {
      throw new Error('Cart not found');
    }

    const newExpiration = new Date();
    newExpiration.setMinutes(newExpiration.getMinutes() + minutes);

    await this.cartRepository.update(cartId, {
      expiresAt: newExpiration,
      lastActivityAt: new Date(),
      version: cart.version + 1
    });

    const updatedCart = await this.cartRepository.getById(cartId);
    if (!updatedCart) {
      throw new Error('Failed to retrieve updated cart');
    }

    return updatedCart;
  }

  // Real-time subscriptions
  subscribeToCartsByPlaceId(placeId: string, callback: (carts: Cart[]) => void): () => void {
    return this.cartRepository.subscribeToCartsByPlaceId(placeId, callback);
  }

  subscribeToCartUpdates(cartId: string, callback: (cart: Cart | null) => void): () => void {
    return this.cartRepository.subscribeToCartUpdates(cartId, callback);
  }

  subscribeToCartsByCustomerId(customerId: string, callback: (carts: Cart[]) => void): () => void {
    return this.cartRepository.subscribeToCartsByCustomerId(customerId, callback);
  }

  subscribeToCartsBySessionId(sessionId: string, callback: (carts: Cart[]) => void): () => void {
    return this.cartRepository.subscribeToCartsBySessionId(sessionId, callback);
  }

  // Analytics and reporting
  async getCartStatistics(placeId: string, dateFrom?: Date, dateTo?: Date): Promise<{
    totalCarts: number;
    activeCarts: number;
    abandonedCarts: number;
    convertedCarts: number;
    averageCartValue: number;
    totalCartValue: number;
  }> {
    return await this.cartRepository.getCartStatistics(placeId, dateFrom, dateTo);
  }

  async getPopularCartItems(placeId: string, limit: number = 10): Promise<Array<{
    itemId: string;
    itemName: string;
    totalQuantity: number;
    totalValue: number;
    cartCount: number;
  }>> {
    return await this.cartRepository.getPopularCartItems(placeId, limit);
  }

  // Business validation methods
  async validateCartItem(command: AddItemToCartCommand): Promise<boolean> {
    if (!command.cartId) {
      throw new Error('Cart ID is required');
    }

    if (!command.itemId) {
      throw new Error('Item ID is required');
    }

    if (!command.itemName) {
      throw new Error('Item name is required');
    }

    if (command.itemPrice <= 0) {
      throw new Error('Item price must be greater than 0');
    }

    if (command.quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    // TODO: Validate item availability with MenuService
    // TODO: Validate item price with current menu price

    return true;
  }

  async validateCartConversion(command: ConvertCartToOrderCommand): Promise<boolean> {
    if (!command.cartId) {
      throw new Error('Cart ID is required');
    }

    if (!command.customer || !command.customer.name) {
      throw new Error('Customer name is required');
    }

    if (!command.payment) {
      throw new Error('Payment information is required');
    }

    if (!command.orderType) {
      throw new Error('Order type is required');
    }

    if (!command.lastUpdatedBy) {
      throw new Error('Last updated by is required');
    }

    // TODO: Validate payment method
    // TODO: Validate customer information
    // TODO: Validate order type

    return true;
  }

  async validateDiscountCode(discountCode: string, _cartId: string): Promise<boolean> {
    if (!discountCode) {
      throw new Error('Discount code is required');
    }

    // TODO: Validate discount code with discount service
    // TODO: Check if discount is still valid
    // TODO: Check if discount applies to this cart

    return true;
  }

  // Cart cleanup and maintenance
  async cleanupAbandonedCarts(placeId?: string): Promise<number> {
    const abandonedCarts = await this.cartRepository.getAbandonedCarts(placeId || '', 24);
    let cleanedCount = 0;

    for (const cart of abandonedCarts) {
      try {
        await this.cartRepository.delete(cart.id);
        cleanedCount++;
      } catch (error) {
        console.error(`Failed to clean up abandoned cart ${cart.id}:`, error);
      }
    }

    return cleanedCount;
  }

  async processCartExpiration(): Promise<number> {
    const expiredCarts = await this.cartRepository.getExpiredCarts();
    let processedCount = 0;

    for (const cart of expiredCarts) {
      try {
        await this.cartRepository.markCartAsAbandoned(cart.id);
        processedCount++;
      } catch (error) {
        console.error(`Failed to process expired cart ${cart.id}:`, error);
      }
    }

    return processedCount;
  }

  // Private validation methods
  private validateCreateCartCommand(command: CreateCartCommand): boolean {
    if (!command.placeId) {
      throw new Error('Place ID is required');
    }

    if (!command.source) {
      throw new Error('Source is required');
    }

    if (!command.customerId && !command.sessionId) {
      throw new Error('Either customer ID or session ID is required');
    }

    return true;
  }

  private validateUpdateCartCommand(command: UpdateCartCommand): boolean {
    if (!command.id) {
      throw new Error('Cart ID is required');
    }

    return true;
  }

  private validateUpdateCartItemCommand(command: UpdateCartItemCommand): boolean {
    if (!command.cartId) {
      throw new Error('Cart ID is required');
    }

    if (!command.itemId) {
      throw new Error('Item ID is required');
    }

    if (command.quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    return true;
  }

  private validateRemoveItemFromCartCommand(command: RemoveItemFromCartCommand): boolean {
    if (!command.cartId) {
      throw new Error('Cart ID is required');
    }

    if (!command.itemId) {
      throw new Error('Item ID is required');
    }

    return true;
  }
}




