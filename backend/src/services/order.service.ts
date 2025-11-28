import { Order, CreateOrderCommand, UpdateOrderCommand, OrderQuery, OrderItem } from '../entities/order.entity';
import { IOrderRepository } from '../repositories/interfaces/order.repository.interface';
import { OrderRepository } from '../repositories/order/order.repository';
import { IOrderService } from './interfaces/order.service.interface';

/**
 * Order Service - Contains ALL business logic and validation
 * Follows SOLID principles and Clean Architecture
 * Uses repository for data access ONLY
 * Implements comprehensive business rules and validation
 */
export class OrderService implements IOrderService {
  private readonly orderRepository: IOrderRepository;

  constructor(orderRepository?: IOrderRepository) {
    this.orderRepository = orderRepository ?? new OrderRepository();
  }

  async createOrder(command: CreateOrderCommand): Promise<Order> {
    // Business validation
    this.validateCreateOrderCommand(command);

    // Generate order number
    const orderNumber = await this.orderRepository.generateOrderNumber(command.placeId);

    // Create order items with calculated totals first
    const orderItems: OrderItem[] = command.items.map(item => ({
      id: this.generateId(),
      ...item,
      totalPrice: item.quantity * item.itemPrice,
      status: 'pending' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    // Calculate totals using the created order items
    const totals = this.calculateOrderTotals(orderItems);

    // Create order entity
    const order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'> = {
      orderNumber,
      placeId: command.placeId,
      customer: command.customer,
      items: orderItems,
      status: 'pending',
      type: command.type,
      subtotal: totals.subtotal,
      tax: totals.tax,
      serviceFee: totals.serviceFee,
      deliveryFee: totals.deliveryFee,
      discount: totals.discount,
      total: totals.total,
      lastUpdatedBy: command.lastUpdatedBy,
      lastUpdatedAt: new Date(),
      source: command.source,
      version: 1
    };

    // Create order in repository
    const orderId = await this.orderRepository.create(order);

    // Return the created order
    const createdOrder = await this.orderRepository.getById(orderId);
    if (!createdOrder) {
      throw new Error('Failed to retrieve created order');
    }

    return createdOrder;
  }

  async updateOrder(command: UpdateOrderCommand): Promise<Order> {
    // Business validation
    this.validateUpdateOrderCommand(command);

    // Get existing order
    const existingOrder = await this.orderRepository.getById(command.id);
    if (!existingOrder) {
      throw new Error('Order not found');
    }

    // Update order
    const updateData: Partial<Order> = {
      lastUpdatedBy: command.lastUpdatedBy,
      lastUpdatedAt: new Date(),
      updatedAt: new Date(),
      version: existingOrder.version + 1
    };

    if (command.status) {
      updateData.status = command.status;
    }

    await this.orderRepository.update(command.id, updateData);

    // Return updated order
    const updatedOrder = await this.orderRepository.getById(command.id);
    if (!updatedOrder) {
      throw new Error('Failed to retrieve updated order');
    }

    return updatedOrder;
  }

  async getOrderById(id: string): Promise<Order | null> {
    return await this.orderRepository.getById(id);
  }

  async getOrdersByPlaceId(placeId: string, query?: OrderQuery): Promise<Order[]> {
    return await this.orderRepository.getOrdersByPlaceId(placeId, query);
  }

  async getOrderByOrderNumber(placeId: string, orderNumber: string): Promise<Order | null> {
    return await this.orderRepository.getOrderByOrderNumber(placeId, orderNumber);
  }

  // Real-time operations for cashier
  subscribeToOrdersByPlaceId(placeId: string, callback: (orders: Order[]) => void): () => void {
    return this.orderRepository.subscribeToOrdersByPlaceId(placeId, callback);
  }

  subscribeToOrderUpdates(orderId: string, callback: (order: Order | null) => void): () => void {
    return this.orderRepository.subscribeToOrderUpdates(orderId, callback);
  }

  subscribeToOrdersByStatus(placeId: string, statuses: Order['status'][], callback: (orders: Order[]) => void): () => void {
    return this.orderRepository.subscribeToOrdersByStatus(placeId, statuses, callback);
  }

  async updateOrderStatus(orderId: string, status: Order['status'], updatedBy: string): Promise<void> {
    await this.orderRepository.updateOrderStatus(orderId, status, updatedBy);
  }

  async searchOrders(placeId: string, searchTerm: string): Promise<Order[]> {
    return await this.orderRepository.searchOrders(placeId, searchTerm);
  }

  async getOrdersByDateRange(placeId: string, dateFrom: Date, dateTo: Date): Promise<Order[]> {
    return await this.orderRepository.getOrdersByDateRange(placeId, dateFrom, dateTo);
  }

  // Business validation methods
  validateCreateOrderCommand(command: CreateOrderCommand): boolean {
    if (!command.placeId) {
      throw new Error('Place ID is required');
    }

    if (!command.customer || !command.customer.name) {
      throw new Error('Customer name is required');
    }

    if (!command.items || command.items.length === 0) {
      throw new Error('Order must have at least one item');
    }

    if (!command.type) {
      throw new Error('Order type is required');
    }

    if (!command.payment) {
      throw new Error('Payment information is required');
    }

    if (!command.lastUpdatedBy) {
      throw new Error('Last updated by is required');
    }

    // Validate items
    command.items.forEach((item, index) => {
      if (!item.itemId) {
        throw new Error(`Item ID is required for item at index ${index}`);
      }
      if (!item.itemName) {
        throw new Error(`Item name is required for item at index ${index}`);
      }
      if (item.itemPrice <= 0) {
        throw new Error(`Item price must be greater than 0 for item at index ${index}`);
      }
      if (item.quantity <= 0) {
        throw new Error(`Item quantity must be greater than 0 for item at index ${index}`);
      }
    });

    return true;
  }

  validateUpdateOrderCommand(command: UpdateOrderCommand): boolean {
    if (!command.id) {
      throw new Error('Order ID is required');
    }

    if (!command.lastUpdatedBy) {
      throw new Error('Last updated by is required');
    }

    return true;
  }

  calculateOrderTotals(items: Order['items'], placeSettings?: any): {
    subtotal: number;
    tax: number;
    serviceFee?: number;
    deliveryFee?: number;
    discount?: number;
    total: number;
  } {
    // Calculate subtotal
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

    // Get place settings or use defaults
    const taxRate = placeSettings?.taxRate || 0.08; // 8% default tax
    const serviceFeeRate = placeSettings?.serviceFee || 0;
    const deliveryFee = placeSettings?.deliveryFee || 0;
    const discount = 0; // TODO: Implement discount logic

    // Calculate tax
    const tax = subtotal * taxRate;

    // Calculate service fee
    const serviceFee = subtotal * serviceFeeRate;

    // Calculate total
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
