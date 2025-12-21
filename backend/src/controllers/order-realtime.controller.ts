import { Request, Response } from 'express';
import { OrderService } from '../services/order.service';
import { Order } from '../entities/order.entity';
import { CorsConfigFactory } from '../shared/config/cors.config';

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
   * GET /ordersRealtime?placeId=xxx&branchId=xxx&status=pending,confirmed&hoursBack=6
   * Returns Server-Sent Events stream
   */
  getRealtimeOrders = async (req: Request, res: Response): Promise<void> => {
    // Track if headers have been sent to avoid sending JSON after SSE headers
    let headersSent = false;

    try {
      const {
        placeId,
        branchId,
        status,
        hoursBack
      } = req.query;

      // Validate required fields BEFORE setting SSE headers
      if (!placeId) {
        res.status(400).json({
          success: false,
          message: 'Place ID is required'
        });
        return;
      }

      // Parse hoursBack (default to 6 hours) - BEFORE setting SSE headers
      const hoursBackNum = hoursBack 
        ? parseInt(hoursBack as string, 10) 
        : 6;

      // Validate hoursBack is a positive number - BEFORE setting SSE headers
      if (isNaN(hoursBackNum) || hoursBackNum <= 0) {
        res.status(400).json({
          success: false,
          message: 'hoursBack must be a positive number'
        });
        return;
      }

      // Parse status filter - handle comma-separated values properly
      let statusFilter: string[] | undefined;
      if (status) {
        if (typeof status === 'string') {
          statusFilter = status.split(',').map(s => s.trim()).filter(s => s.length > 0);
        } else if (Array.isArray(status)) {
          statusFilter = status.map(s => String(s).trim()).filter(s => s.length > 0);
        }
      }

      // Get CORS headers from config factory BEFORE setting SSE headers
      const origin = req.headers.origin;
      const corsHeaders = CorsConfigFactory.getCorsHeaders(origin);

      // NOW set up Server-Sent Events (after all validations)
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        ...corsHeaders // Spread all CORS headers from the factory
      });
      headersSent = true;

      // Send initial connection message
      res.write(`data: ${JSON.stringify({
        type: 'connection',
        message: 'Connected to real-time orders',
        timestamp: new Date().toISOString()
      })}\n\n`);

      // Create connection ID
      const connectionId = `${placeId}-${branchId || 'all'}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      this.activeConnections.set(connectionId, res);

      // Set up real-time subscription with options
      // Wrap in try-catch to handle immediate subscription errors
      try {
        const unsubscribe = this.orderService.subscribeToOrdersByPlaceId(
          placeId as string,
          (orders: Order[]) => {
            try {
              // Filter orders by status if specified
              let filteredOrders = orders;
              if (statusFilter && statusFilter.length > 0) {
                filteredOrders = orders.filter(order => 
                  statusFilter!.includes(order.status)
                );
              }

              // Send orders update
              res.write(`data: ${JSON.stringify({
                type: 'orders_update',
                data: filteredOrders,
                count: filteredOrders.length,
                timestamp: new Date().toISOString()
              })}\n\n`);
            } catch (writeError) {
              console.error(`Error writing orders update for connection ${connectionId}:`, writeError);
              // Don't throw - just log the error
            }
          },
          {
            branchId: branchId as string | undefined,
            hoursBack: hoursBackNum
          }
        );

        // Store unsubscribe function for cleanup
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
            try {
              res.write(`data: ${JSON.stringify({
                type: 'heartbeat',
                timestamp: new Date().toISOString()
              })}\n\n`);
            } catch (writeError) {
              console.error(`Error writing heartbeat for connection ${connectionId}:`, writeError);
              clearInterval(heartbeat);
              this.activeConnections.delete(connectionId);
            }
          } else {
            clearInterval(heartbeat);
          }
        }, 30000);
      } catch (subscriptionError) {
        // Subscription setup failed - send SSE error event
        console.error(`Error setting up subscription for connection ${connectionId}:`, subscriptionError);
        this.activeConnections.delete(connectionId);
        res.write(`data: ${JSON.stringify({
          type: 'error',
          message: 'Failed to set up real-time subscription',
          error: subscriptionError instanceof Error ? subscriptionError.message : 'Unknown error',
          timestamp: new Date().toISOString()
        })}\n\n`);
        res.end();
        return;
      }

    } catch (error) {
      console.error('Error setting up real-time orders:', error);
      
      // If headers are already sent, send SSE error event instead of JSON
      if (headersSent) {
        res.write(`data: ${JSON.stringify({
          type: 'error',
          message: 'Failed to set up real-time orders',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        })}\n\n`);
        res.end();
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to set up real-time orders',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  };

  /**
   * Real-time orders by status endpoint
   * GET /orderRealtimeStatus?placeId=xxx&branchId=xxx&status=pending,confirmed,preparing&hoursBack=6
   * Returns Server-Sent Events stream filtered by status
   */
  getRealtimeOrdersByStatus = async (req: Request, res: Response): Promise<void> => {
    // Track if headers have been sent to avoid sending JSON after SSE headers
    let headersSent = false;

    try {
      const {
        placeId,
        branchId,
        status,
        hoursBack
      } = req.query;

      // Validate required fields BEFORE setting SSE headers
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

      // Parse status filter - handle comma-separated values properly - BEFORE setting SSE headers
      let statusFilter: string[];
      if (typeof status === 'string') {
        statusFilter = status.split(',').map(s => s.trim()).filter(s => s.length > 0);
      } else if (Array.isArray(status)) {
        statusFilter = status.map(s => String(s).trim()).filter(s => s.length > 0);
      } else {
        res.status(400).json({
          success: false,
          message: 'Status must be a string or array'
        });
        return;
      }

      // Parse hoursBack (default to 6 hours) - BEFORE setting SSE headers
      const hoursBackNum = hoursBack 
        ? parseInt(hoursBack as string, 10) 
        : 6;

      // Validate hoursBack is a positive number - BEFORE setting SSE headers
      if (isNaN(hoursBackNum) || hoursBackNum <= 0) {
        res.status(400).json({
          success: false,
          message: 'hoursBack must be a positive number'
        });
        return;
      }

      // Get CORS headers from config factory BEFORE setting SSE headers
      const origin = req.headers.origin;
      const corsHeaders = CorsConfigFactory.getCorsHeaders(origin);

      // NOW set up Server-Sent Events (after all validations)
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        ...corsHeaders // Spread all CORS headers from the factory
      });
      headersSent = true;

      // Send initial connection message
      res.write(`data: ${JSON.stringify({
        type: 'connection',
        message: 'Connected to real-time orders by status',
        timestamp: new Date().toISOString()
      })}\n\n`);

      // Create connection ID
      const connectionId = branchId ? `${placeId}-${branchId}-${statusFilter.join('-')}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` : `${placeId}-${statusFilter.join('-')}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      this.activeConnections.set(connectionId, res);

      // Set up real-time subscription with options
      // Wrap in try-catch to handle immediate subscription errors
      try {
        const unsubscribe = this.orderService.subscribeToOrdersByStatus(
          placeId as string,
          statusFilter as Order['status'][],
          (orders: Order[]) => {
            try {
              // Send orders update
              res.write(`data: ${JSON.stringify({
                type: 'orders_update',
                data: orders,
                count: orders.length,
                timestamp: new Date().toISOString()
              })}\n\n`);
            } catch (writeError) {
              console.error(`Error writing orders update for connection ${connectionId}:`, writeError);
              // Don't throw - just log the error
            }
          },
          {
            branchId: branchId as string | undefined,
            hoursBack: hoursBackNum
          }
        );

        // Store unsubscribe function for cleanup
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
            try {
              res.write(`data: ${JSON.stringify({
                type: 'heartbeat',
                timestamp: new Date().toISOString()
              })}\n\n`);
            } catch (writeError) {
              console.error(`Error writing heartbeat for connection ${connectionId}:`, writeError);
              clearInterval(heartbeat);
              this.activeConnections.delete(connectionId);
            }
          } else {
            clearInterval(heartbeat);
          }
        }, 30000);
      } catch (subscriptionError) {
        // Subscription setup failed - send SSE error event
        console.error(`Error setting up subscription for connection ${connectionId}:`, subscriptionError);
        this.activeConnections.delete(connectionId);
        res.write(`data: ${JSON.stringify({
          type: 'error',
          message: 'Failed to set up real-time subscription',
          error: subscriptionError instanceof Error ? subscriptionError.message : 'Unknown error',
          timestamp: new Date().toISOString()
        })}\n\n`);
        res.end();
        return;
      }

    } catch (error) {
      console.error('Error setting up real-time orders by status:', error);
      
      // If headers are already sent, send SSE error event instead of JSON
      if (headersSent) {
        res.write(`data: ${JSON.stringify({
          type: 'error',
          message: 'Failed to set up real-time orders by status',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        })}\n\n`);
        res.end();
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to set up real-time orders by status',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  };

  /**
   * Real-time single order endpoint
   * GET /orders/realtime/:id
   * Returns Server-Sent Events stream for a specific order
   */
  getRealtimeOrder = async (req: Request, res: Response): Promise<void> => {
    // Track if headers have been sent to avoid sending JSON after SSE headers
    let headersSent = false;

    try {
      const { id } = req.params;

      // Validate required fields BEFORE setting SSE headers
      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Order ID is required'
        });
        return;
      }

      // Get CORS headers from config factory BEFORE setting SSE headers
      const origin = req.headers.origin;
      const corsHeaders = CorsConfigFactory.getCorsHeaders(origin);

      // NOW set up Server-Sent Events (after all validations)
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        ...corsHeaders // Spread all CORS headers from the factory
      });
      headersSent = true;

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
      // Wrap in try-catch to handle immediate subscription errors
      try {
        const unsubscribe = this.orderService.subscribeToOrderUpdates(
          id,
          (order: Order | null) => {
            try {
              // Send order update
              res.write(`data: ${JSON.stringify({
                type: 'order_update',
                data: order,
                timestamp: new Date().toISOString()
              })}\n\n`);
            } catch (writeError) {
              console.error(`Error writing order update for connection ${connectionId}:`, writeError);
              // Don't throw - just log the error
            }
          }
        );

        // Store unsubscribe function for cleanup
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
            try {
              res.write(`data: ${JSON.stringify({
                type: 'heartbeat',
                timestamp: new Date().toISOString()
              })}\n\n`);
            } catch (writeError) {
              console.error(`Error writing heartbeat for connection ${connectionId}:`, writeError);
              clearInterval(heartbeat);
              this.activeConnections.delete(connectionId);
            }
          } else {
            clearInterval(heartbeat);
          }
        }, 30000);
      } catch (subscriptionError) {
        // Subscription setup failed - send SSE error event
        console.error(`Error setting up subscription for connection ${connectionId}:`, subscriptionError);
        this.activeConnections.delete(connectionId);
        res.write(`data: ${JSON.stringify({
          type: 'error',
          message: 'Failed to set up real-time subscription',
          error: subscriptionError instanceof Error ? subscriptionError.message : 'Unknown error',
          timestamp: new Date().toISOString()
        })}\n\n`);
        res.end();
        return;
      }

    } catch (error) {
      console.error('Error setting up real-time order:', error);
      
      // If headers are already sent, send SSE error event instead of JSON
      if (headersSent) {
        res.write(`data: ${JSON.stringify({
          type: 'error',
          message: 'Failed to set up real-time order',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        })}\n\n`);
        res.end();
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to set up real-time order',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
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

