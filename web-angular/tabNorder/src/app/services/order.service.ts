import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { OrderRepository } from '../repositories/order.repository';
import { 
  Order, 
  OrderItem, 
  CreateOrderData, 
  OrderFilters, 
  OrderStats, 
  TableOrder, 
  OrderUpdate,
  OrderStatus,
  PaymentStatus,
  PaymentMethod
} from '../models/order.model';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private ordersSubject = new BehaviorSubject<Order[]>([]);
  private activeOrdersSubject = new BehaviorSubject<Order[]>([]);
  private tableOrdersSubject = new BehaviorSubject<TableOrder[]>([]);
  private orderStatsSubject = new BehaviorSubject<OrderStats | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  // Public observables
  public orders$ = this.ordersSubject.asObservable();
  public activeOrders$ = this.activeOrdersSubject.asObservable();
  public tableOrders$ = this.tableOrdersSubject.asObservable();
  public orderStats$ = this.orderStatsSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public error$ = this.errorSubject.asObservable();

  // Computed observables
  public pendingOrders$ = this.activeOrders$.pipe(
    map(orders => orders.filter(order => order.status === 'pending'))
  );

  public preparingOrders$ = this.activeOrders$.pipe(
    map(orders => orders.filter(order => order.status === 'preparing'))
  );

  public readyOrders$ = this.activeOrders$.pipe(
    map(orders => orders.filter(order => order.status === 'ready'))
  );

  public totalRevenue$ = this.orderStats$.pipe(
    map(stats => stats?.totalRevenue || 0)
  );

  constructor(private orderRepository: OrderRepository) {}

  /**
   * Create a new order
   */
  async createOrder(orderData: CreateOrderData): Promise<string> {
    try {
      this.loadingSubject.next(true);
      this.errorSubject.next(null);

      // Validate order data
      if (!orderData.items || orderData.items.length === 0) {
        throw new Error('Order must contain at least one item');
      }

      // Calculate item totals
      const itemsWithTotals = orderData.items.map(item => ({
        ...item,
        totalPrice: item.price * item.quantity
      }));

      const orderDataWithTotals = {
        ...orderData,
        items: itemsWithTotals
      };

      const orderId = await this.orderRepository.createOrder(orderDataWithTotals);
      
      // Refresh active orders
      await this.loadActiveOrders(orderData.placeId || this.getCurrentPlaceId());
      
      return orderId;
    } catch (error) {
      this.errorSubject.next('Failed to create order');
      console.error('Error creating order:', error);
      throw error;
    } finally {
      this.loadingSubject.next(false);
    }
  }

  /**
   * Get order by ID
   */
  async getOrderById(id: string): Promise<Order | null> {
    try {
      this.loadingSubject.next(true);
      this.errorSubject.next(null);

      const order = await this.orderRepository.getOrderById(id);
      return order;
    } catch (error) {
      this.errorSubject.next('Failed to fetch order');
      console.error('Error fetching order by ID:', error);
      throw error;
    } finally {
      this.loadingSubject.next(false);
    }
  }

  /**
   * Get orders by table
   */
  async getOrdersByTable(tableId: string, placeId: string): Promise<Order[]> {
    try {
      this.loadingSubject.next(true);
      this.errorSubject.next(null);

      const orders = await this.orderRepository.getOrdersByTable(tableId, placeId);
      this.ordersSubject.next(orders);
      
      return orders;
    } catch (error) {
      this.errorSubject.next('Failed to fetch table orders');
      console.error('Error fetching orders by table:', error);
      throw error;
    } finally {
      this.loadingSubject.next(false);
    }
  }

  /**
   * Get user orders
   */
  async getUserOrders(tableId: string, placeId: string, userId: string): Promise<Order[]> {
    try {
      this.loadingSubject.next(true);
      this.errorSubject.next(null);

      const orders = await this.orderRepository.getUserOrders(tableId, placeId, userId);
      this.ordersSubject.next(orders);
      
      return orders;
    } catch (error) {
      this.errorSubject.next('Failed to fetch user orders');
      console.error('Error fetching user orders:', error);
      throw error;
    } finally {
      this.loadingSubject.next(false);
    }
  }

  /**
   * Get orders with filters
   */
  async getOrdersWithFilters(filters: OrderFilters, limitCount: number = 50): Promise<Order[]> {
    try {
      this.loadingSubject.next(true);
      this.errorSubject.next(null);

      const orders = await this.orderRepository.getOrdersWithFilters(filters, limitCount);
      this.ordersSubject.next(orders);
      
      return orders;
    } catch (error) {
      this.errorSubject.next('Failed to fetch orders');
      console.error('Error fetching orders with filters:', error);
      throw error;
    } finally {
      this.loadingSubject.next(false);
    }
  }

  /**
   * Load active orders
   */
  async loadActiveOrders(placeId: string): Promise<void> {
    try {
      this.loadingSubject.next(true);
      this.errorSubject.next(null);

      const orders = await this.orderRepository.getActiveOrders(placeId);
      this.activeOrdersSubject.next(orders);
    } catch (error) {
      this.errorSubject.next('Failed to load active orders');
      console.error('Error loading active orders:', error);
    } finally {
      this.loadingSubject.next(false);
    }
  }

  /**
   * Load table orders
   */
  async loadTableOrders(placeId: string): Promise<void> {
    try {
      this.loadingSubject.next(true);
      this.errorSubject.next(null);

      const tableOrders = await this.orderRepository.getTableOrders(placeId);
      this.tableOrdersSubject.next(tableOrders);
    } catch (error) {
      this.errorSubject.next('Failed to load table orders');
      console.error('Error loading table orders:', error);
    } finally {
      this.loadingSubject.next(false);
    }
  }

  /**
   * Load order statistics
   */
  async loadOrderStats(placeId: string, dateFrom?: Date, dateTo?: Date): Promise<void> {
    try {
      this.loadingSubject.next(true);
      this.errorSubject.next(null);

      const stats = await this.orderRepository.getOrderStats(placeId, dateFrom, dateTo);
      this.orderStatsSubject.next(stats);
    } catch (error) {
      this.errorSubject.next('Failed to load order statistics');
      console.error('Error loading order stats:', error);
    } finally {
      this.loadingSubject.next(false);
    }
  }

  /**
   * Update order
   */
  async updateOrder(orderId: string, updates: OrderUpdate): Promise<void> {
    try {
      this.loadingSubject.next(true);
      this.errorSubject.next(null);

      await this.orderRepository.updateOrder(orderId, updates);
      
      // Refresh active orders
      const currentOrders = this.activeOrdersSubject.value;
      const updatedOrders = currentOrders.map(order => 
        order.id === orderId ? { ...order, ...updates, updatedAt: new Date() } : order
      );
      this.activeOrdersSubject.next(updatedOrders);
    } catch (error) {
      this.errorSubject.next('Failed to update order');
      console.error('Error updating order:', error);
      throw error;
    } finally {
      this.loadingSubject.next(false);
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    try {
      await this.updateOrder(orderId, { orderId, status });
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  /**
   * Mark order as paid
   */
  async markOrderAsPaid(orderId: string, paymentMethod: PaymentMethod = 'card'): Promise<void> {
    try {
      await this.updateOrder(orderId, { 
        orderId, 
        paymentStatus: 'paid',
        status: 'confirmed'
      });
    } catch (error) {
      console.error('Error marking order as paid:', error);
      throw error;
    }
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId: string, reason?: string): Promise<void> {
    try {
      await this.updateOrder(orderId, { 
        orderId, 
        status: 'cancelled',
        cashierNotes: reason ? `Cancelled: ${reason}` : 'Order cancelled'
      });
    } catch (error) {
      console.error('Error cancelling order:', error);
      throw error;
    }
  }

  /**
   * Confirm order (move from pending to confirmed)
   */
  async confirmOrder(orderId: string): Promise<void> {
    try {
      await this.updateOrderStatus(orderId, 'confirmed');
    } catch (error) {
      console.error('Error confirming order:', error);
      throw error;
    }
  }

  /**
   * Start preparing order (move from confirmed to preparing)
   */
  async startPreparingOrder(orderId: string, estimatedTime?: number): Promise<void> {
    try {
      await this.updateOrder(orderId, { 
        orderId, 
        status: 'preparing',
        estimatedTime
      });
    } catch (error) {
      console.error('Error starting order preparation:', error);
      throw error;
    }
  }

  /**
   * Mark order as ready (move from preparing to ready)
   */
  async markOrderAsReady(orderId: string): Promise<void> {
    try {
      await this.updateOrderStatus(orderId, 'ready');
    } catch (error) {
      console.error('Error marking order as ready:', error);
      throw error;
    }
  }

  /**
   * Deliver order (move from ready to delivered)
   */
  async deliverOrder(orderId: string): Promise<void> {
    try {
      await this.updateOrder(orderId, { 
        orderId, 
        status: 'delivered',
        actualDeliveryTime: new Date()
      });
    } catch (error) {
      console.error('Error delivering order:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time order updates
   */
  subscribeToOrders(placeId: string): Observable<Order[]> {
    return new Observable(observer => {
      const unsubscribe = this.orderRepository.subscribeToOrders(placeId, (orders) => {
        this.activeOrdersSubject.next(orders);
        observer.next(orders);
      });

      return () => unsubscribe();
    });
  }

  /**
   * Subscribe to table-specific order updates
   */
  subscribeToTableOrders(tableId: string, placeId: string): Observable<Order[]> {
    return new Observable(observer => {
      const unsubscribe = this.orderRepository.subscribeToTableOrders(tableId, placeId, (orders) => {
        this.ordersSubject.next(orders);
        observer.next(orders);
      });

      return () => unsubscribe();
    });
  }

  /**
   * Get current orders from state
   */
  getCurrentOrders(): Order[] {
    return this.ordersSubject.value;
  }

  /**
   * Get current active orders from state
   */
  getCurrentActiveOrders(): Order[] {
    return this.activeOrdersSubject.value;
  }

  /**
   * Get current table orders from state
   */
  getCurrentTableOrders(): TableOrder[] {
    return this.tableOrdersSubject.value;
  }

  /**
   * Get current order stats from state
   */
  getCurrentOrderStats(): OrderStats | null {
    return this.orderStatsSubject.value;
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this.errorSubject.next(null);
  }

  /**
   * Refresh all data
   */
  async refresh(placeId: string): Promise<void> {
    await Promise.all([
      this.loadActiveOrders(placeId),
      this.loadTableOrders(placeId),
      this.loadOrderStats(placeId)
    ]);
  }

  // Session management methods (similar to React version)
  getCurrentUserId(): string | null {
    return sessionStorage.getItem('userId');
  }

  getCurrentUserName(): string | null {
    return sessionStorage.getItem('userName');
  }

  getCurrentPlaceId(): string | null {
    return sessionStorage.getItem('placeId');
  }

  getCurrentTableId(): string | null {
    return sessionStorage.getItem('tableId');
  }

  getCurrentMenuId(): string | null {
    return sessionStorage.getItem('menuId');
  }

  setCurrentUserId(userId: string): void {
    sessionStorage.setItem('userId', userId);
  }

  setCurrentUserName(userName: string): void {
    sessionStorage.setItem('userName', userName);
  }

  setCurrentPlaceId(placeId: string): void {
    sessionStorage.setItem('placeId', placeId);
  }

  setCurrentTableId(tableId: string): void {
    sessionStorage.setItem('tableId', tableId);
  }

  setCurrentMenuId(menuId: string): void {
    sessionStorage.setItem('menuId', menuId);
  }

  clearSession(): void {
    sessionStorage.removeItem('userId');
    sessionStorage.removeItem('userName');
    sessionStorage.removeItem('placeId');
    sessionStorage.removeItem('tableId');
    sessionStorage.removeItem('menuId');
  }

  // Utility methods
  calculateOrderTotal(items: OrderItem[]): number {
    return items.reduce((sum, item) => sum + item.totalPrice, 0);
  }

  calculateTax(amount: number, taxRate: number = 0.085): number {
    return amount * taxRate;
  }

  calculateFinalAmount(amount: number, taxRate: number = 0.085): number {
    return amount + this.calculateTax(amount, taxRate);
  }

  formatOrderTime(date: Date): string {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  }

  getOrderStatusColor(status: OrderStatus): string {
    const colors = {
      pending: 'text-yellow-600 bg-yellow-100',
      confirmed: 'text-blue-600 bg-blue-100',
      preparing: 'text-orange-600 bg-orange-100',
      ready: 'text-green-600 bg-green-100',
      delivered: 'text-gray-600 bg-gray-100',
      cancelled: 'text-red-600 bg-red-100'
    };
    return colors[status] || 'text-gray-600 bg-gray-100';
  }

  getPaymentStatusColor(status: PaymentStatus): string {
    const colors = {
      pending: 'text-yellow-600 bg-yellow-100',
      paid: 'text-green-600 bg-green-100',
      failed: 'text-red-600 bg-red-100',
      refunded: 'text-blue-600 bg-blue-100'
    };
    return colors[status] || 'text-gray-600 bg-gray-100';
  }
}
