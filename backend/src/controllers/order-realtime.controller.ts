import { Request, Response } from 'express';
import { OrderService } from '../services/order.service';
import { Order } from '../entities/order.entity';

/**
 * Order Real-time Controller - Presentation Layer
 * Handles real-time order updates for cashier
 * Uses Server-Sent Events (SSE) for real-time communication
 * Follows Clean Architecture principles
 */
export class OrderRealtimeController {
  private readonly orderService: OrderService;
  private activeConnections: Map<string, Response> = new Map();

  constructor() {
    this.orderService = new OrderService();
  }

  /**
   * Real-time orders endpoint for cashier
   * GET /orders/realtime?placeId=xxx&status=xxx,xxx
   * Returns Server-Sent Events stream
   */
  getRealtimeOrders = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        placeId,
        status
      } = req.query;

      // Validate required fields
      if (!placeId) {
        res.status(400).json({
          success: false,
          message: 'Place ID is required'
        });
        return;
      }

      // Set up Server-Sent Events
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });

      // Send initial connection message
      res.write(`data: ${JSON.stringify({
        type: 'connection',
        message: 'Connected to real-time orders',
        timestamp: new Date().toISOString()
      })}\n\n`);

      // Parse status filter
      const statusFilter = status ? (status as string).split(',') : undefined;

      // Create connection ID
      const connectionId = `${placeId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      this.activeConnections.set(connectionId, res);

      // Set up real-time subscription
      const unsubscribe = this.orderService.subscribeToOrdersByPlaceId(
        placeId as string,
        (orders: Order[]) => {
          // Filter orders by status if specified
          let filteredOrders = orders;
          if (statusFilter && statusFilter.length > 0) {
            filteredOrders = orders.filter(order => 
              statusFilter.includes(order.status)
            );
          }

          // Send orders update
          res.write(`data: ${JSON.stringify({
            type: 'orders_update',
            data: filteredOrders,
            count: filteredOrders.length,
            timestamp: new Date().toISOString()
          })}\n\n`);
        }
      );

      // Handle client disconnect
      req.on('close', () => {
        console.log(`Client disconnected: ${connectionId}`);
        this.activeConnections.delete(connectionId);
        unsubscribe();
      });

      req.on('error', (error) => {
        console.error(`Client error: ${connectionId}`, error);
        this.activeConnections.delete(connectionId);
        unsubscribe();
      });

      // Send heartbeat every 30 seconds
      const heartbeat = setInterval(() => {
        if (this.activeConnections.has(connectionId)) {
          res.write(`data: ${JSON.stringify({
            type: 'heartbeat',
            timestamp: new Date().toISOString()
          })}\n\n`);
        } else {
          clearInterval(heartbeat);
        }
      }, 30000);

    } catch (error) {
      console.error('Error setting up real-time orders:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to set up real-time orders',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Real-time orders by status endpoint
   * GET /orders/realtime/status?placeId=xxx&status=pending,confirmed,preparing
   * Returns Server-Sent Events stream filtered by status
   */
  getRealtimeOrdersByStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        placeId,
        status
      } = req.query;

      // Validate required fields
      if (!placeId) {
        res.status(400).json({
          success: false,
          message: 'Place ID is required'
        });
        return;
      }

      if (!status) {
        res.status(400).json({
          success: false,
          message: 'Status filter is required'
        });
        return;
      }

      // Set up Server-Sent Events
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });

      // Send initial connection message
      res.write(`data: ${JSON.stringify({
        type: 'connection',
        message: 'Connected to real-time orders by status',
        timestamp: new Date().toISOString()
      })}\n\n`);

      // Parse status filter
      const statusFilter = (status as string).split(',');

      // Create connection ID
      const connectionId = `${placeId}-${statusFilter.join('-')}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      this.activeConnections.set(connectionId, res);

      // Set up real-time subscription
      const unsubscribe = this.orderService.subscribeToOrdersByStatus(
        placeId as string,
        statusFilter as any[],
        (orders: Order[]) => {
          // Send orders update
          res.write(`data: ${JSON.stringify({
            type: 'orders_update',
            data: orders,
            count: orders.length,
            timestamp: new Date().toISOString()
          })}\n\n`);
        }
      );

      // Handle client disconnect
      req.on('close', () => {
        console.log(`Client disconnected: ${connectionId}`);
        this.activeConnections.delete(connectionId);
        unsubscribe();
      });

      req.on('error', (error) => {
        console.error(`Client error: ${connectionId}`, error);
        this.activeConnections.delete(connectionId);
        unsubscribe();
      });

      // Send heartbeat every 30 seconds
      const heartbeat = setInterval(() => {
        if (this.activeConnections.has(connectionId)) {
          res.write(`data: ${JSON.stringify({
            type: 'heartbeat',
            timestamp: new Date().toISOString()
          })}\n\n`);
        } else {
          clearInterval(heartbeat);
        }
      }, 30000);

    } catch (error) {
      console.error('Error setting up real-time orders by status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to set up real-time orders by status',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Real-time single order endpoint
   * GET /orders/realtime/:id
   * Returns Server-Sent Events stream for a specific order
   */
  getRealtimeOrder = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Order ID is required'
        });
        return;
      }

      // Set up Server-Sent Events
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });

      // Send initial connection message
      res.write(`data: ${JSON.stringify({
        type: 'connection',
        message: 'Connected to real-time order updates',
        orderId: id,
        timestamp: new Date().toISOString()
      })}\n\n`);

      // Create connection ID
      const connectionId = `order-${id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      this.activeConnections.set(connectionId, res);

      // Set up real-time subscription
      const unsubscribe = this.orderService.subscribeToOrderUpdates(
        id,
        (order: Order | null) => {
          // Send order update
          res.write(`data: ${JSON.stringify({
            type: 'order_update',
            data: order,
            timestamp: new Date().toISOString()
          })}\n\n`);
        }
      );

      // Handle client disconnect
      req.on('close', () => {
        console.log(`Client disconnected: ${connectionId}`);
        this.activeConnections.delete(connectionId);
        unsubscribe();
      });

      req.on('error', (error) => {
        console.error(`Client error: ${connectionId}`, error);
        this.activeConnections.delete(connectionId);
        unsubscribe();
      });

      // Send heartbeat every 30 seconds
      const heartbeat = setInterval(() => {
        if (this.activeConnections.has(connectionId)) {
          res.write(`data: ${JSON.stringify({
            type: 'heartbeat',
            timestamp: new Date().toISOString()
          })}\n\n`);
        } else {
          clearInterval(heartbeat);
        }
      }, 30000);

    } catch (error) {
      console.error('Error setting up real-time order:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to set up real-time order',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get active connections count
   * GET /orders/realtime/connections
   */
  getActiveConnections = async (req: Request, res: Response): Promise<void> => {
    try {
      res.status(200).json({
        success: true,
        data: {
          activeConnections: this.activeConnections.size,
          connections: Array.from(this.activeConnections.keys())
        },
        message: 'Active connections retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting active connections:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get active connections',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}

