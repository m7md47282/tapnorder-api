import { Order, CreateOrderCommand, UpdateOrderCommand, OrderQuery } from '../../entities/order.entity';

/**
 * Order Service Interface
 * Defines business logic operations for order management
 * Follows SOLID principles and Clean Architecture
 */
export interface IOrderService {
  // Order creation and management
  createOrder(command: CreateOrderCommand): Promise<Order>;
  updateOrder(command: UpdateOrderCommand): Promise<Order>;
  
  // Order retrieval
  getOrderById(id: string): Promise<Order | null>;
  getOrdersByPlaceId(placeId: string, query?: OrderQuery): Promise<Order[]>;
  getOrderByOrderNumber(placeId: string, orderNumber: string): Promise<Order | null>;
  
  // Real-time operations for cashier
  subscribeToOrdersByPlaceId(placeId: string, callback: (orders: Order[]) => void): () => void;
  subscribeToOrderUpdates(orderId: string, callback: (order: Order | null) => void): () => void;
  subscribeToOrdersByStatus(placeId: string, statuses: Order['status'][], callback: (orders: Order[]) => void): () => void;
  
  // Order status management
  updateOrderStatus(orderId: string, status: Order['status'], updatedBy: string): Promise<void>;
  
  // Search and filtering
  searchOrders(placeId: string, searchTerm: string): Promise<Order[]>;
  getOrdersByDateRange(placeId: string, dateFrom: Date, dateTo: Date): Promise<Order[]>;
  
  // Business validation
  validateCreateOrderCommand(command: CreateOrderCommand): boolean;
  validateUpdateOrderCommand(command: UpdateOrderCommand): boolean;
  calculateOrderTotals(items: Order['items'], placeSettings?: any): {
    subtotal: number;
    tax: number;
    serviceFee?: number;
    deliveryFee?: number;
    discount?: number;
    total: number;
  };
}





