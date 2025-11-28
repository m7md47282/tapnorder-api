import { BaseRepository } from '../base.repository';
import { ICartRepository } from '../interfaces/cart.repository.interface';
import { Cart, CartQuery, CartItem } from '../../entities/cart.entity';
import { CartStatistics, PopularCartItem } from './types';
import { QueryFilter } from '../types';

/**
 * Cart Repository Implementation - MANDATORY
 * Extends BaseRepository for common CRUD operations
 * Implements cart-specific business queries
 * Follows SOLID principles and Clean Architecture
 * NO BUSINESS LOGIC - data access only
 */
export class CartRepository extends BaseRepository<Cart> implements ICartRepository {
  constructor() {
    super('carts');
  }

  // Cart-specific queries
  async getCartsByPlaceId(placeId: string, query?: CartQuery): Promise<Cart[]> {
    const filters: QueryFilter[] = [
      { field: 'placeId', operator: '==', value: placeId }
    ];

    if (query?.status) {
      filters.push({ field: 'status', operator: '==', value: query.status });
    }

    if (query?.customerId) {
      filters.push({ field: 'customerId', operator: '==', value: query.customerId });
    }

    if (query?.sessionId) {
      filters.push({ field: 'sessionId', operator: '==', value: query.sessionId });
    }

    if (query?.source) {
      filters.push({ field: 'source', operator: '==', value: query.source });
    }

    if (query?.dateFrom) {
      filters.push({ field: 'createdAt', operator: '>=', value: query.dateFrom });
    }

    if (query?.dateTo) {
      filters.push({ field: 'createdAt', operator: '<=', value: query.dateTo });
    }

    return await this.query(filters, { 
      orderBy: [{ field: 'lastActivityAt', direction: 'desc' }] 
    });
  }

  async getCartsByCustomerId(customerId: string, query?: CartQuery): Promise<Cart[]> {
    const filters: QueryFilter[] = [
      { field: 'customerId', operator: '==', value: customerId }
    ];

    if (query?.placeId) {
      filters.push({ field: 'placeId', operator: '==', value: query.placeId });
    }

    if (query?.status) {
      filters.push({ field: 'status', operator: '==', value: query.status });
    }

    if (query?.source) {
      filters.push({ field: 'source', operator: '==', value: query.source });
    }

    return await this.query(filters, { 
      orderBy: [{ field: 'lastActivityAt', direction: 'desc' }] 
    });
  }

  async getCartsBySessionId(sessionId: string, query?: CartQuery): Promise<Cart[]> {
    const filters: QueryFilter[] = [
      { field: 'sessionId', operator: '==', value: sessionId }
    ];

    if (query?.placeId) {
      filters.push({ field: 'placeId', operator: '==', value: query.placeId });
    }

    if (query?.status) {
      filters.push({ field: 'status', operator: '==', value: query.status });
    }

    if (query?.source) {
      filters.push({ field: 'source', operator: '==', value: query.source });
    }

    return await this.query(filters, { 
      orderBy: [{ field: 'lastActivityAt', direction: 'desc' }] 
    });
  }

  async getActiveCartByCustomerId(customerId: string, placeId: string): Promise<Cart | null> {
    const filters: QueryFilter[] = [
      { field: 'customerId', operator: '==', value: customerId },
      { field: 'placeId', operator: '==', value: placeId },
      { field: 'status', operator: '==', value: 'active' }
    ];

    return await this.queryOne(filters);
  }

  async getActiveCartBySessionId(sessionId: string, placeId: string): Promise<Cart | null> {
    const filters: QueryFilter[] = [
      { field: 'sessionId', operator: '==', value: sessionId },
      { field: 'placeId', operator: '==', value: placeId },
      { field: 'status', operator: '==', value: 'active' }
    ];

    return await this.queryOne(filters);
  }

  async getAbandonedCarts(placeId: string, hoursAgo: number = 24): Promise<Cart[]> {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hoursAgo);

    const filters: QueryFilter[] = [
      { field: 'placeId', operator: '==', value: placeId },
      { field: 'status', operator: '==', value: 'abandoned' },
      { field: 'lastActivityAt', operator: '<=', value: cutoffTime }
    ];

    return await this.query(filters, { 
      orderBy: [{ field: 'lastActivityAt', direction: 'desc' }] 
    });
  }

  // Cart item operations
  async addItemToCart(cartId: string, item: Omit<CartItem, 'id' | 'addedAt' | 'updatedAt' | 'totalPrice'>): Promise<void> {
    const cart = await this.getById(cartId);
    if (!cart) {
      throw new Error('Cart not found');
    }

    const cartItem: CartItem = {
      id: this.generateId(),
      ...item,
      totalPrice: item.quantity * item.itemPrice,
      addedAt: new Date(),
      updatedAt: new Date()
    };

    const updatedItems = [...cart.items, cartItem];
    const totals = this.calculateCartTotals(updatedItems);

    await this.update(cartId, {
      items: updatedItems,
      subtotal: totals.subtotal,
      tax: totals.tax,
      serviceFee: totals.serviceFee,
      deliveryFee: totals.deliveryFee,
      discount: totals.discount,
      total: totals.total,
      lastActivityAt: new Date(),
      version: cart.version + 1
    });
  }

  async updateCartItem(cartId: string, itemId: string, updates: Partial<Pick<CartItem, 'quantity' | 'specialInstructions'>>): Promise<void> {
    const cart = await this.getById(cartId);
    if (!cart) {
      throw new Error('Cart not found');
    }

    const updatedItems = cart.items.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, ...updates };
        updatedItem.totalPrice = updatedItem.quantity * updatedItem.itemPrice;
        updatedItem.updatedAt = new Date();
        return updatedItem;
      }
      return item;
    });

    const totals = this.calculateCartTotals(updatedItems);

    await this.update(cartId, {
      items: updatedItems,
      subtotal: totals.subtotal,
      tax: totals.tax,
      serviceFee: totals.serviceFee,
      deliveryFee: totals.deliveryFee,
      discount: totals.discount,
      total: totals.total,
      lastActivityAt: new Date(),
      version: cart.version + 1
    });
  }

  async removeItemFromCart(cartId: string, itemId: string): Promise<void> {
    const cart = await this.getById(cartId);
    if (!cart) {
      throw new Error('Cart not found');
    }

    const updatedItems = cart.items.filter(item => item.id !== itemId);
    const totals = this.calculateCartTotals(updatedItems);

    await this.update(cartId, {
      items: updatedItems,
      subtotal: totals.subtotal,
      tax: totals.tax,
      serviceFee: totals.serviceFee,
      deliveryFee: totals.deliveryFee,
      discount: totals.discount,
      total: totals.total,
      lastActivityAt: new Date(),
      version: cart.version + 1
    });
  }

  async clearCartItems(cartId: string): Promise<void> {
    const cart = await this.getById(cartId);
    if (!cart) {
      throw new Error('Cart not found');
    }

    await this.update(cartId, {
      items: [],
      subtotal: 0,
      tax: 0,
      serviceFee: 0,
      deliveryFee: 0,
      discount: 0,
      total: 0,
      lastActivityAt: new Date(),
      version: cart.version + 1
    });
  }

  // Cart status operations
  async updateCartStatus(cartId: string, status: Cart['status'], lastActivityAt?: Date): Promise<void> {
    await this.update(cartId, {
      status,
      lastActivityAt: lastActivityAt || new Date(),
      version: (await this.getById(cartId))?.version ? (await this.getById(cartId))!.version + 1 : 1
    });
  }

  async markCartAsAbandoned(cartId: string): Promise<void> {
    await this.updateCartStatus(cartId, 'abandoned');
  }

  async markCartAsConverted(cartId: string): Promise<void> {
    await this.updateCartStatus(cartId, 'converted');
  }

  // Cart expiration
  async getExpiredCarts(placeId?: string): Promise<Cart[]> {
    const now = new Date();
    const filters: QueryFilter[] = [
      { field: 'expiresAt', operator: '<=', value: now },
      { field: 'status', operator: '==', value: 'active' }
    ];

    if (placeId) {
      filters.push({ field: 'placeId', operator: '==', value: placeId });
    }

    return await this.query(filters);
  }

  async deleteExpiredCarts(placeId?: string): Promise<number> {
    const expiredCarts = await this.getExpiredCarts(placeId);
    const cartIds = expiredCarts.map(cart => cart.id);
    
    if (cartIds.length > 0) {
      await this.deleteBatch(cartIds);
    }
    
    return cartIds.length;
  }

  // Real-time subscriptions
  subscribeToCartsByPlaceId(placeId: string, callback: (carts: Cart[]) => void): () => void {
    const q = this.db.collection(this.collectionName)
      .where('placeId', '==', placeId)
      .orderBy('lastActivityAt', 'desc');
    
    return q.onSnapshot((snapshot) => {
      const carts = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Cart));
      callback(carts);
    });
  }

  subscribeToCartUpdates(cartId: string, callback: (cart: Cart | null) => void): () => void {
    return this.subscribeToDocument(cartId, callback);
  }

  subscribeToCartsByCustomerId(customerId: string, callback: (carts: Cart[]) => void): () => void {
    const q = this.db.collection(this.collectionName)
      .where('customerId', '==', customerId)
      .orderBy('lastActivityAt', 'desc');
    
    return q.onSnapshot((snapshot) => {
      const carts = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Cart));
      callback(carts);
    });
  }

  subscribeToCartsBySessionId(sessionId: string, callback: (carts: Cart[]) => void): () => void {
    const q = this.db.collection(this.collectionName)
      .where('sessionId', '==', sessionId)
      .orderBy('lastActivityAt', 'desc');
    
    return q.onSnapshot((snapshot) => {
      const carts = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Cart));
      callback(carts);
    });
  }

  // Analytics queries
  async getCartStatistics(placeId: string, dateFrom?: Date, dateTo?: Date): Promise<CartStatistics> {
    const filters: QueryFilter[] = [
      { field: 'placeId', operator: '==', value: placeId }
    ];

    if (dateFrom) {
      filters.push({ field: 'createdAt', operator: '>=', value: dateFrom });
    }

    if (dateTo) {
      filters.push({ field: 'createdAt', operator: '<=', value: dateTo });
    }

    const carts = await this.query(filters);

    const totalCarts = carts.length;
    const activeCarts = carts.filter(cart => cart.status === 'active').length;
    const abandonedCarts = carts.filter(cart => cart.status === 'abandoned').length;
    const convertedCarts = carts.filter(cart => cart.status === 'converted').length;
    const totalCartValue = carts.reduce((sum, cart) => sum + cart.total, 0);
    const averageCartValue = totalCarts > 0 ? totalCartValue / totalCarts : 0;

    return {
      totalCarts,
      activeCarts,
      abandonedCarts,
      convertedCarts,
      averageCartValue,
      totalCartValue
    };
  }

  async getPopularCartItems(placeId: string, limit: number = 10): Promise<PopularCartItem[]> {
    const filters: QueryFilter[] = [
      { field: 'placeId', operator: '==', value: placeId },
      { field: 'status', operator: '==', value: 'active' }
    ];

    const carts = await this.query(filters);
    const itemMap = new Map<string, PopularCartItem>();

    carts.forEach(cart => {
      cart.items.forEach(item => {
        const existing = itemMap.get(item.itemId);
        if (existing) {
          existing.totalQuantity += item.quantity;
          existing.totalValue += item.totalPrice;
          existing.cartCount += 1;
        } else {
          itemMap.set(item.itemId, {
            itemId: item.itemId,
            itemName: item.itemName,
            totalQuantity: item.quantity,
            totalValue: item.totalPrice,
            cartCount: 1
          });
        }
      });
    });

    return Array.from(itemMap.values())
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, limit);
  }

  // Helper methods
  private calculateCartTotals(items: CartItem[]): {
    subtotal: number;
    tax: number;
    serviceFee?: number;
    deliveryFee?: number;
    discount?: number;
    total: number;
  } {
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const tax = subtotal * 0.08; // 8% default tax
    const serviceFee = subtotal * 0.02; // 2% service fee
    const deliveryFee = 0; // No delivery fee by default
    const discount = 0; // No discount by default
    const total = subtotal + tax + serviceFee + deliveryFee - discount;

    return {
      subtotal,
      tax,
      serviceFee: serviceFee > 0 ? serviceFee : undefined,
      deliveryFee: deliveryFee > 0 ? deliveryFee : undefined,
      discount: discount > 0 ? discount : undefined,
      total
    };
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }
}
