import { Request, Response } from 'express';
import { OrderService } from '../services/order.service';
import { CreateOrderCommand, OrderQuery } from '../entities/order.entity';

/**
 * Order Controller - Presentation Layer
 * Handles HTTP requests for order operations
 * NO BUSINESS LOGIC - delegates to service layer
 * Follows Clean Architecture principles
 */
export class OrderController {
  private readonly orderService: OrderService;

  constructor() {
    this.orderService = new OrderService();
  }

  /**
   * Create a new order
   * POST /orders
   */
  createOrder = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        placeId,
        customer,
        items,
        type,
        payment,
        source = 'pos',
        lastUpdatedBy
      } = req.body;

      // Validate required fields
      if (!placeId) {
        res.status(400).json({
          success: false,
          message: 'Place ID is required'
        });
        return;
      }

      if (!customer || !customer.name) {
        res.status(400).json({
          success: false,
          message: 'Customer name is required'
        });
        return;
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Order must have at least one item'
        });
        return;
      }

      if (!type) {
        res.status(400).json({
          success: false,
          message: 'Order type is required'
        });
        return;
      }

      if (!payment) {
        res.status(400).json({
          success: false,
          message: 'Payment information is required'
        });
        return;
      }

      if (!lastUpdatedBy) {
        res.status(400).json({
          success: false,
          message: 'Last updated by is required'
        });
        return;
      }

      // Create order command
      const command: CreateOrderCommand = {
        placeId,
        customer,
        items,
        type,
        payment,
        source,
        lastUpdatedBy
      };

      // Create order
      const order = await this.orderService.createOrder(command);

      res.status(201).json({
        success: true,
        data: order,
        message: 'Order created successfully'
      });

    } catch (error) {
      console.error('Error creating order:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create order',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get orders with real-time updates
   * GET /orders?placeId=xxx&status=xxx&type=xxx
   */
  getOrders = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        placeId,
        status,
        type,
        customerId,
        dateFrom,
        dateTo,
        orderNumber,
        source
      } = req.query;

      // Validate required fields
      if (!placeId) {
        res.status(400).json({
          success: false,
          message: 'Place ID is required'
        });
        return;
      }

      // Build query
      const query: OrderQuery = {
        placeId: placeId as string,
        status: status as any,
        type: type as any,
        customerId: customerId as string,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
        orderNumber: orderNumber as string,
        source: source as any
      };

      // Get orders
      const orders = await this.orderService.getOrdersByPlaceId(placeId as string, query);

      res.status(200).json({
        success: true,
        data: orders,
        message: 'Orders retrieved successfully',
        count: orders.length
      });

    } catch (error) {
      console.error('Error getting orders:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve orders',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get a specific order by ID
   * GET /orders/:id
   */
  getOrderById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params[0];

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Order ID is required'
        });
        return;
      }

      const order = await this.orderService.getOrderById(id);

      if (!order) {
        res.status(404).json({
          success: false,
          message: 'Order not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: order,
        message: 'Order retrieved successfully'
      });

    } catch (error) {
      console.error('Error getting order by ID:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve order',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get order by order number
   * GET /orders/number/:orderNumber?placeId=xxx
   */
  getOrderByNumber = async (req: Request, res: Response): Promise<void> => {
    try {
      const orderNumber = req.params[0];
      const { placeId } = req.query;

      if (!orderNumber) {
        res.status(400).json({
          success: false,
          message: 'Order number is required'
        });
        return;
      }

      if (!placeId) {
        res.status(400).json({
          success: false,
          message: 'Place ID is required'
        });
        return;
      }

      const order = await this.orderService.getOrderByOrderNumber(placeId as string, orderNumber);

      if (!order) {
        res.status(404).json({
          success: false,
          message: 'Order not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: order,
        message: 'Order retrieved successfully'
      });

    } catch (error) {
      console.error('Error getting order by number:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve order',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Update order status
   * PUT /orders/:id/status
   */
  updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params[0];
      const { status, lastUpdatedBy } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Order ID is required'
        });
        return;
      }

      if (!status) {
        res.status(400).json({
          success: false,
          message: 'Status is required'
        });
        return;
      }

      if (!lastUpdatedBy) {
        res.status(400).json({
          success: false,
          message: 'Last updated by is required'
        });
        return;
      }

      await this.orderService.updateOrderStatus(id, status, lastUpdatedBy);

      res.status(200).json({
        success: true,
        message: 'Order status updated successfully'
      });

    } catch (error) {
      console.error('Error updating order status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update order status',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Search orders
   * GET /orders/search?placeId=xxx&q=searchTerm
   */
  searchOrders = async (req: Request, res: Response): Promise<void> => {
    try {
      const { placeId, q } = req.query;

      if (!placeId) {
        res.status(400).json({
          success: false,
          message: 'Place ID is required'
        });
        return;
      }

      if (!q) {
        res.status(400).json({
          success: false,
          message: 'Search term is required'
        });
        return;
      }

      const orders = await this.orderService.searchOrders(placeId as string, q as string);

      res.status(200).json({
        success: true,
        data: orders,
        message: 'Orders found successfully',
        count: orders.length
      });

    } catch (error) {
      console.error('Error searching orders:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search orders',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}
