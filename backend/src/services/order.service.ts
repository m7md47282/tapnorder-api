import { Order, CreateOrderCommand, UpdateOrderCommand, OrderQuery, OrderItem } from '../entities/order.entity';
import { IOrderRepository } from '../repositories/interfaces/order.repository.interface';
import { OrderRepository } from '../repositories/order/order.repository';
import { IOrderService } from './interfaces/order.service.interface';
import { AuthorizationService, IAuthorizationService, IUserContext } from './authorization.service';
import { IItemService } from './item.service';
import { ItemService } from './item.service';
import { ItemCostCalculatorService } from './item-cost-calculator.service';
import { IInventoryService } from './interfaces/inventory.service.interface';
import { InventoryService } from './inventory.service';

/**
 * Order Service - Contains ALL business logic and validation
 * Follows SOLID principles and Clean Architecture
 * Uses repository for data access ONLY
 * Implements comprehensive business rules and validation
 */
export class OrderService implements IOrderService {
  private readonly orderRepository: IOrderRepository;
  private readonly authorizationService: IAuthorizationService;
  private readonly itemService: IItemService;
  private readonly inventoryService: IInventoryService;
  private readonly costCalculator: ItemCostCalculatorService;

  constructor(
    orderRepository?: IOrderRepository, 
    authorizationService?: IAuthorizationService,
    itemService?: IItemService,
    inventoryService?: IInventoryService
  ) {
    this.orderRepository = orderRepository ?? new OrderRepository();
    this.authorizationService = authorizationService ?? new AuthorizationService();
    this.itemService = itemService ?? new ItemService();
    this.inventoryService = inventoryService ?? new InventoryService();
    this.costCalculator = new ItemCostCalculatorService(this.inventoryService);
  }

  async createOrder(command: CreateOrderCommand, userContext?: IUserContext): Promise<Order> {
    // Business validation
    this.validateCreateOrderCommand(command);

    // Authorization: ensure user can access this place
    if (userContext) {
      this.authorizationService.assertCanAccessPlace(userContext, command.placeId);
    }

    // Validate inventory availability for all items
    await this.validateInventoryForOrder(command.items, command.placeId);

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
      tableId: command.tableId,
      notes: command.notes,
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

    // Reduce inventory for all items in the order
    await this.reduceInventoryForOrder(command.items, command.placeId);

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

  async getOrdersByPlaceId(placeId: string, query?: OrderQuery, userContext?: IUserContext): Promise<Order[]> {
    if (userContext) {
      // For admins, enforce their place; for super admins, allow requested place
      this.authorizationService.assertCanAccessPlace(userContext, placeId);
    }
    return await this.orderRepository.getOrdersByPlaceId(placeId, query);
  }

  async getOrderByOrderNumber(placeId: string, orderNumber: string, userContext?: IUserContext): Promise<Order | null> {
    if (userContext) {
      this.authorizationService.assertCanAccessPlace(userContext, placeId);
    }
    return await this.orderRepository.getOrderByOrderNumber(placeId, orderNumber);
  }

  // Real-time operations for cashier
  subscribeToOrdersByPlaceId(
    placeId: string, 
    callback: (orders: Order[]) => void,
    options?: { branchId?: string; hoursBack?: number }
  ): () => void {
    return this.orderRepository.subscribeToOrdersByPlaceId(placeId, callback, options);
  }

  subscribeToOrderUpdates(orderId: string, callback: (order: Order | null) => void): () => void {
    return this.orderRepository.subscribeToOrderUpdates(orderId, callback);
  }

  subscribeToOrdersByStatus(
    placeId: string, 
    statuses: Order['status'][], 
    callback: (orders: Order[]) => void,
    options?: { branchId?: string; hoursBack?: number }
  ): () => void {
    return this.orderRepository.subscribeToOrdersByStatus(placeId, statuses, callback, options);
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

  /**
   * Validate inventory availability for order items
   */
  private async validateInventoryForOrder(
    items: CreateOrderCommand['items'],
    placeId: string
  ): Promise<void> {
    for (const orderItem of items) {
      // Get the item to access its recipe
      const item = await this.itemService.getItemById(orderItem.itemId);
      if (!item) {
        throw new Error(`Item not found: ${orderItem.itemId}`);
      }

      // If item has a recipe, validate inventory
      if (item.recipe && item.recipe.length > 0) {
        const validation = await this.costCalculator.validateInventoryForQuantity(
          item.recipe,
          orderItem.quantity,
          placeId,
          item.branchId
        );

        if (!validation.valid) {
          const missingList = validation.missingIngredients?.map(
            m => `${m.ingredientName} (available: ${m.available}, required: ${m.required})`
          ).join(', ') || 'unknown ingredients';
          throw new Error(
            `Insufficient inventory for item "${item.name}". Missing: ${missingList}`
          );
        }
      }
    }
  }

  /**
   * Reduce inventory for all items in an order
   */
  private async reduceInventoryForOrder(
    items: CreateOrderCommand['items'],
    placeId: string
  ): Promise<void> {
    for (const orderItem of items) {
      // Get the item to access its recipe
      const item = await this.itemService.getItemById(orderItem.itemId);
      if (!item || !item.recipe || item.recipe.length === 0) {
        continue; // Skip items without recipes
      }

      // Calculate inventory reductions
      const reductions = await this.costCalculator.calculateInventoryReduction(
        item.recipe,
        orderItem.quantity,
        placeId,
        item.branchId
      );

      // Apply reductions
      for (const reduction of reductions) {
        try {
          await this.inventoryService.reduceInventory(
            reduction.inventoryId,
            reduction.quantity,
            `Order for item: ${item.name}`
          );
        } catch (error) {
          console.error(`Failed to reduce inventory ${reduction.inventoryId}:`, error);
          // Continue with other reductions even if one fails
        }
      }

      // Recalculate the item's available units
      try {
        await this.itemService.recalculateItem(item.id);
      } catch (error) {
        console.error(`Failed to recalculate item ${item.id}:`, error);
      }
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }
}
