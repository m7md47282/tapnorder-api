import { Request, Response } from 'express';
import { CartService } from '../services/cart.service';
import { 
  CreateCartCommand, 
  AddItemToCartCommand, 
  UpdateCartItemCommand, 
  RemoveItemFromCartCommand,
  ApplyDiscountCommand,
  ConvertCartToOrderCommand,
  UpdateCartCommand,
  CartQuery 
} from '../entities/cart.entity';

/**
 * Cart Controller - Presentation Layer
 * Handles HTTP requests for cart operations
 * NO BUSINESS LOGIC - delegates to service layer
 * Follows Clean Architecture principles
 */
export class CartController {
  private readonly cartService: CartService;

  constructor() {
    this.cartService = new CartService();
  }

  /**
   * Create a new cart
   * POST /cart
   */
  createCart = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        placeId,
        customerId,
        sessionId,
        source = 'pos'
      } = req.body;

      // Validate required fields
      if (!placeId) {
        res.status(400).json({
          success: false,
          message: 'Place ID is required'
        });
        return;
      }

      if (!customerId && !sessionId) {
        res.status(400).json({
          success: false,
          message: 'Either customer ID or session ID is required'
        });
        return;
      }

      // Create cart command
      const command: CreateCartCommand = {
        placeId,
        customerId,
        sessionId,
        source
      };

      // Create cart
      const cart = await this.cartService.createCart(command);

      res.status(201).json({
        success: true,
        data: cart,
        message: 'Cart created successfully'
      });

    } catch (error) {
      console.error('Error creating cart:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create cart',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get cart by ID
   * GET /cart?id={id}
   */
  getCartById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.query.id as string;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Cart ID is required'
        });
        return;
      }

      const cart = await this.cartService.getCartById(id);

      if (!cart) {
        res.status(404).json({
          success: false,
          message: 'Cart not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: cart,
        message: 'Cart retrieved successfully'
      });

    } catch (error) {
      console.error('Error getting cart by ID:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve cart',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Update cart
   * PUT /cart?id={id}
   */
  updateCart = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.query.id as string;
      const { status, lastActivityAt } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Cart ID is required'
        });
        return;
      }

      // Create update command
      const command: UpdateCartCommand = {
        id,
        status,
        lastActivityAt: lastActivityAt ? new Date(lastActivityAt) : undefined
      };

      // Update cart
      const cart = await this.cartService.updateCart(command);

      res.status(200).json({
        success: true,
        data: cart,
        message: 'Cart updated successfully'
      });

    } catch (error) {
      console.error('Error updating cart:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update cart',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Delete cart
   * DELETE /cart?id={id}
   */
  deleteCart = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.query.id as string;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Cart ID is required'
        });
        return;
      }

      await this.cartService.deleteCart(id);

      res.status(200).json({
        success: true,
        message: 'Cart deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting cart:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete cart',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get carts by place ID
   * GET /cart/place/:placeId
   */
  getCartsByPlaceId = async (req: Request, res: Response): Promise<void> => {
    try {
      const placeId = req.params[0];
      const {
        status,
        customerId,
        sessionId,
        source,
        dateFrom,
        dateTo
      } = req.query;

      if (!placeId) {
        res.status(400).json({
          success: false,
          message: 'Place ID is required'
        });
        return;
      }

      // Build query
      const query: CartQuery = {
        placeId,
        status: status as any,
        customerId: customerId as string,
        sessionId: sessionId as string,
        source: source as any,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined
      };

      // Get carts
      const carts = await this.cartService.getCartsByPlaceId(placeId, query);

      res.status(200).json({
        success: true,
        data: carts,
        message: 'Carts retrieved successfully',
        count: carts.length
      });

    } catch (error) {
      console.error('Error getting carts by place ID:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve carts',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get carts by customer ID
   * GET /cart/customer/:customerId
   */
  getCartsByCustomerId = async (req: Request, res: Response): Promise<void> => {
    try {
      const customerId = req.params[0];
      const {
        placeId,
        status,
        source,
        dateFrom,
        dateTo
      } = req.query;

      if (!customerId) {
        res.status(400).json({
          success: false,
          message: 'Customer ID is required'
        });
        return;
      }

      // Build query
      const query: CartQuery = {
        placeId: placeId as string,
        customerId,
        status: status as any,
        source: source as any,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined
      };

      // Get carts
      const carts = await this.cartService.getCartsByCustomerId(customerId, query);

      res.status(200).json({
        success: true,
        data: carts,
        message: 'Carts retrieved successfully',
        count: carts.length
      });

    } catch (error) {
      console.error('Error getting carts by customer ID:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve carts',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get active cart by customer ID and place ID
   * GET /cart/active?customer=customerId&place=placeId
   */
  getActiveCartByCustomerId = async (req: Request, res: Response): Promise<void> => {
    try {
      const { customerId, placeId } = req.params;

      if (!customerId) {
        res.status(400).json({
          success: false,
          message: 'Customer ID is required'
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

      const cart = await this.cartService.getActiveCartByCustomerId(customerId, placeId);

      if (!cart) {
        res.status(404).json({
          success: false,
          message: 'Active cart not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: cart,
        message: 'Active cart retrieved successfully'
      });

    } catch (error) {
      console.error('Error getting active cart by customer ID:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve active cart',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get active cart by session ID and place ID
   * GET /cart/active?session=sessionId&place=placeId
   */
  getActiveCartBySessionId = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionId, placeId } = req.params;

      if (!sessionId) {
        res.status(400).json({
          success: false,
          message: 'Session ID is required'
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

      const cart = await this.cartService.getActiveCartBySessionId(sessionId, placeId);

      if (!cart) {
        res.status(404).json({
          success: false,
          message: 'Active cart not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: cart,
        message: 'Active cart retrieved successfully'
      });

    } catch (error) {
      console.error('Error getting active cart by session ID:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve active cart',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Add item to cart
   * POST /cart/:cartId/items
   */
  addItemToCart = async (req: Request, res: Response): Promise<void> => {
    try {
      const cartId = req.params[0];
      const {
        itemId,
        itemName,
        itemPrice,
        quantity,
        specialInstructions
      } = req.body;

      if (!cartId) {
        res.status(400).json({
          success: false,
          message: 'Cart ID is required'
        });
        return;
      }

      if (!itemId) {
        res.status(400).json({
          success: false,
          message: 'Item ID is required'
        });
        return;
      }

      if (!itemName) {
        res.status(400).json({
          success: false,
          message: 'Item name is required'
        });
        return;
      }

      if (!itemPrice || itemPrice <= 0) {
        res.status(400).json({
          success: false,
          message: 'Valid item price is required'
        });
        return;
      }

      if (!quantity || quantity <= 0) {
        res.status(400).json({
          success: false,
          message: 'Valid quantity is required'
        });
        return;
      }

      // Create add item command
      const command: AddItemToCartCommand = {
        cartId,
        itemId,
        itemName,
        itemPrice,
        quantity,
        specialInstructions
      };

      // Add item to cart
      const cart = await this.cartService.addItemToCart(command);

      res.status(200).json({
        success: true,
        data: cart,
        message: 'Item added to cart successfully'
      });

    } catch (error) {
      console.error('Error adding item to cart:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add item to cart',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Update cart item
   * PUT /cart?cartId=cartId&itemId=itemId
   */
  updateCartItem = async (req: Request, res: Response): Promise<void> => {
    try {
      const { cartId, itemId } = req.params;
      const { quantity, specialInstructions } = req.body;

      if (!cartId) {
        res.status(400).json({
          success: false,
          message: 'Cart ID is required'
        });
        return;
      }

      if (!itemId) {
        res.status(400).json({
          success: false,
          message: 'Item ID is required'
        });
        return;
      }

      if (!quantity || quantity <= 0) {
        res.status(400).json({
          success: false,
          message: 'Valid quantity is required'
        });
        return;
      }

      // Create update item command
      const command: UpdateCartItemCommand = {
        cartId,
        itemId,
        quantity,
        specialInstructions
      };

      // Update cart item
      const cart = await this.cartService.updateCartItem(command);

      res.status(200).json({
        success: true,
        data: cart,
        message: 'Cart item updated successfully'
      });

    } catch (error) {
      console.error('Error updating cart item:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update cart item',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Remove item from cart
   * DELETE /cart?cartId=cartId&itemId=itemId
   */
  removeItemFromCart = async (req: Request, res: Response): Promise<void> => {
    try {
      const { cartId, itemId } = req.params;

      if (!cartId) {
        res.status(400).json({
          success: false,
          message: 'Cart ID is required'
        });
        return;
      }

      if (!itemId) {
        res.status(400).json({
          success: false,
          message: 'Item ID is required'
        });
        return;
      }

      // Create remove item command
      const command: RemoveItemFromCartCommand = {
        cartId,
        itemId
      };

      // Remove item from cart
      const cart = await this.cartService.removeItemFromCart(command);

      res.status(200).json({
        success: true,
        data: cart,
        message: 'Item removed from cart successfully'
      });

    } catch (error) {
      console.error('Error removing item from cart:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove item from cart',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Clear all items from cart
   * POST /cart/:cartId/clear
   */
  clearCartItems = async (req: Request, res: Response): Promise<void> => {
    try {
      const cartId = req.params[0];

      if (!cartId) {
        res.status(400).json({
          success: false,
          message: 'Cart ID is required'
        });
        return;
      }

      // Clear cart items
      const cart = await this.cartService.clearCartItems(cartId);

      res.status(200).json({
        success: true,
        data: cart,
        message: 'Cart cleared successfully'
      });

    } catch (error) {
      console.error('Error clearing cart items:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to clear cart items',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Apply discount to cart
   * POST /cart/:cartId/discount
   */
  applyDiscount = async (req: Request, res: Response): Promise<void> => {
    try {
      const cartId = req.params[0];
      const {
        discountCode,
        discountAmount,
        discountType
      } = req.body;

      if (!cartId) {
        res.status(400).json({
          success: false,
          message: 'Cart ID is required'
        });
        return;
      }

      if (!discountCode) {
        res.status(400).json({
          success: false,
          message: 'Discount code is required'
        });
        return;
      }

      if (!discountType) {
        res.status(400).json({
          success: false,
          message: 'Discount type is required'
        });
        return;
      }

      // Create apply discount command
      const command: ApplyDiscountCommand = {
        cartId,
        discountCode,
        discountAmount,
        discountType
      };

      // Apply discount
      const cart = await this.cartService.applyDiscount(command);

      res.status(200).json({
        success: true,
        data: cart,
        message: 'Discount applied successfully'
      });

    } catch (error) {
      console.error('Error applying discount:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to apply discount',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Remove discount from cart
   * DELETE /cart/:cartId/discount
   */
  removeDiscount = async (req: Request, res: Response): Promise<void> => {
    try {
      const cartId = req.params[0];

      if (!cartId) {
        res.status(400).json({
          success: false,
          message: 'Cart ID is required'
        });
        return;
      }

      // Remove discount
      const cart = await this.cartService.removeDiscount(cartId);

      res.status(200).json({
        success: true,
        data: cart,
        message: 'Discount removed successfully'
      });

    } catch (error) {
      console.error('Error removing discount:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove discount',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Convert cart to order
   * POST /cart/:cartId/convert
   */
  convertCartToOrder = async (req: Request, res: Response): Promise<void> => {
    try {
      const cartId = req.params[0];
      const {
        customer,
        payment,
        orderType,
        lastUpdatedBy
      } = req.body;

      if (!cartId) {
        res.status(400).json({
          success: false,
          message: 'Cart ID is required'
        });
        return;
      }

      if (!customer || !customer.name) {
        res.status(400).json({
          success: false,
          message: 'Customer information is required'
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

      if (!orderType) {
        res.status(400).json({
          success: false,
          message: 'Order type is required'
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

      // Create convert cart command
      const command: ConvertCartToOrderCommand = {
        cartId,
        customer,
        payment,
        orderType,
        lastUpdatedBy
      };

      // Convert cart to order
      const result = await this.cartService.convertCartToOrder(command);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Cart converted to order successfully'
      });

    } catch (error) {
      console.error('Error converting cart to order:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to convert cart to order',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get cart statistics
   * GET /cart/statistics/:placeId
   */
  getCartStatistics = async (req: Request, res: Response): Promise<void> => {
    try {
      const placeId = req.params[0];
      const { dateFrom, dateTo } = req.query;

      if (!placeId) {
        res.status(400).json({
          success: false,
          message: 'Place ID is required'
        });
        return;
      }

      // Get cart statistics
      const statistics = await this.cartService.getCartStatistics(
        placeId,
        dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo ? new Date(dateTo as string) : undefined
      );

      res.status(200).json({
        success: true,
        data: statistics,
        message: 'Cart statistics retrieved successfully'
      });

    } catch (error) {
      console.error('Error getting cart statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve cart statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get popular cart items
   * GET /cart/popular/:placeId
   */
  getPopularCartItems = async (req: Request, res: Response): Promise<void> => {
    try {
      const placeId = req.params[0];
      const { limit } = req.query;

      if (!placeId) {
        res.status(400).json({
          success: false,
          message: 'Place ID is required'
        });
        return;
      }

      // Get popular cart items
      const popularItems = await this.cartService.getPopularCartItems(
        placeId,
        limit ? parseInt(limit as string) : undefined
      );

      res.status(200).json({
        success: true,
        data: popularItems,
        message: 'Popular cart items retrieved successfully'
      });

    } catch (error) {
      console.error('Error getting popular cart items:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve popular cart items',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}




