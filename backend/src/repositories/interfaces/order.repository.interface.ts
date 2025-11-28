import { IBaseRepository } from '../base.repository';
import { Order, OrderQuery } from '../../entities/order.entity';
// import { OrderSubscription } from '../../entities/order.entity';

/**
 * Order Repository Interface
 * Extends IBaseRepository with order-specific operations
 * Follows SOLID principles and Clean Architecture
 */
export interface IOrderRepository extends IBaseRepository<Order> {
  // Order-specific queries
  getOrdersByPlaceId(placeId: string, query?: OrderQuery): Promise<Order[]>;
  getOrderByOrderNumber(placeId: string, orderNumber: string): Promise<Order | null>;
  getOrdersByStatus(placeId: string, status: Order['status']): Promise<Order[]>;
  getOrdersByCustomer(placeId: string, customerId: string): Promise<Order[]>;
  
  // Real-time operations for cashier
  subscribeToOrdersByPlaceId(placeId: string, callback: (orders: Order[]) => void): () => void;
  subscribeToOrderUpdates(orderId: string, callback: (order: Order | null) => void): () => void;
  subscribeToOrdersByStatus(placeId: string, statuses: Order['status'][], callback: (orders: Order[]) => void): () => void;
  
  // Order status operations
  updateOrderStatus(orderId: string, status: Order['status'], updatedBy: string): Promise<void>;
  
  // Order search and filtering
  searchOrders(placeId: string, searchTerm: string): Promise<Order[]>;
  getOrdersByDateRange(placeId: string, dateFrom: Date, dateTo: Date): Promise<Order[]>;
  
  // Generate order number
  generateOrderNumber(placeId: string): Promise<string>;
}
