import { onRequest } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';
import { initializeApp } from 'firebase-admin/app';
import { MenuController } from './controllers/menu.controller';
import { ItemsController } from './controllers/items.controller';
import { CategoryController } from './controllers/category.controller';
import { PlaceController } from './controllers/place.controller';
import { OrderController } from './controllers/order.controller';
import { OrderRealtimeController } from './controllers/order-realtime.controller';
import { CartController } from './controllers/cart.controller';
import { AuthController } from './controllers/auth.controller';
import { AttachmentController } from './controllers/attachment.controller';
import { AddonGroupController } from './controllers/addon-group.controller';
import { CorsMiddleware } from './shared/middleware/cors.middleware';
import { CorsConfigFactory } from './shared/config/cors.config';

// Initialize Firebase Admin ONCE at application level
initializeApp({
  projectId: 'tab-n-order'
});

// Set global options for Firebase Functions v2
setGlobalOptions({
  maxInstances: 10,
  region: 'us-central1', // Keep us-central1 for now
  timeoutSeconds: 540,
  memory: '256MiB'
});

// Get CORS configuration for Firebase Functions v2
const corsConfig = CorsConfigFactory.getConfig();
const corsOrigins = Array.isArray(corsConfig.origin) ? corsConfig.origin : corsConfig.origin === true ? true : [corsConfig.origin as string];

// Health check function
export const healthCheck = onRequest({
  maxInstances: 10,
  cors: corsOrigins
}, (request, response) => {
  // Handle CORS
  const wasHandled = CorsMiddleware.handleCors(request, response);
  if (wasHandled) return;

  response.json({
    success: true,
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

export const login = onRequest({
  maxInstances: 10,
  cors: corsOrigins
}, async (request, response) => {
  try {
    const wasHandled = CorsMiddleware.handleCors(request, response);
    if (wasHandled) return;

    const controller = new AuthController();

    if (request.method === 'POST') {
      await controller.login(request, response);
    } else if (request.method === 'GET') {
      await controller.getCurrentUser(request, response);
    } else {
      response.status(405).json({
        success: false,
        message: 'Method not allowed'
      });
    }
  } catch (error) {
    console.error('Login endpoint error:', error);
    CorsMiddleware.setCorsHeaders(response, request.headers.origin);
    response.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export const signup = onRequest({
  maxInstances: 10,
  cors: corsOrigins
}, async (request, response) => {
  try {
    const wasHandled = CorsMiddleware.handleCors(request, response);
    if (wasHandled) return;

    const controller = new AuthController();

    if (request.method === 'POST') {
      await controller.signup(request, response);
    } else {
      response.status(405).json({
        success: false,
        message: 'Method not allowed'
      });
    }
  } catch (error) {
    console.error('Signup endpoint error:', error);
    CorsMiddleware.setCorsHeaders(response, request.headers.origin);
    response.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export const menu = onRequest({
  maxInstances: 10,
  cors: corsOrigins
}, async (request, response) => {
  try {
    // Handle CORS
    const wasHandled = CorsMiddleware.handleCors(request, response);
    if (wasHandled) return;

    const controller = new MenuController();

    if (request.method === 'POST') 
      await controller.createMenuForPlace(request, response);

    else if (request.method === 'GET')
      await controller.getMenuByPlaceId(request, response);

     else 
      response.status(405).json({
        success: false,
        message: 'Method not allowed'
      });

  } catch (error) {
    console.error('Menu endpoint error:', error);
    CorsMiddleware.setCorsHeaders(response, request.headers.origin);
    response.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export const items = onRequest({
  maxInstances: 10,
  cors: corsOrigins
}, async (request, response) => {
  try {
    // Handle CORS
    const wasHandled = CorsMiddleware.handleCors(request, response);
    if (wasHandled) return;

    const controller = new ItemsController();

    // Extract path and parse it for all methods
    const path = request.path || request.url?.split('?')[0] || '/items';
    const pathParts = path.split('/').filter(p => p);
    
    // Extract ID from path: /items/{id}
    const resourceId = pathParts[1]; // ID is second segment (after 'items')
    
    // Set resourceId in req.params[0] for controller methods that need it
    if (resourceId) {
      request.params = request.params || {};
      request.params[0] = resourceId;
    }

    if(request.method === 'POST')
      await controller.createItem(request, response);

    else if(request.method === 'PUT')
      await controller.updateItem(request, response);

    else if(request.method === 'DELETE')
      await controller.deleteItem(request, response);

    else if(request.method === 'GET') {
      if (resourceId) {
        // GET /items/{id} - Get single item
        await controller.getItemById(request, response);
      } else {
        // GET /items?menu_id=xxx&category_id=xxx&is_available=true|false&search=xxx
        await controller.queryItems(request, response);
      }
    }

    else
      response.status(405).json({
        success: false,
        message: 'Method not allowed'
      });
  } catch (error) {
    CorsMiddleware.setCorsHeaders(response, request.headers.origin);
    response.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Individual item endpoints (with path parameters)
export const itemDetail = onRequest({
  maxInstances: 10,
  cors: corsOrigins
}, async (request, response) => {
  try {
    // Handle CORS
    const wasHandled = CorsMiddleware.handleCors(request, response);
    if (wasHandled) return;

    const controller = new ItemsController();

    if(request.method === 'GET')
      await controller.getItemById(request, response);

    else if(request.method === 'PUT')
      await controller.updateItem(request, response);

    else if(request.method === 'DELETE')
      await controller.deleteItem(request, response);

    else
      response.status(405).json({
        success: false,
        message: 'Method not allowed'
      });
  } catch (error) {
    CorsMiddleware.setCorsHeaders(response, request.headers.origin);
    response.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Categories endpoint
export const categories = onRequest({
  maxInstances: 10,
  cors: corsOrigins
}, async (request, response) => {
  try {
    // Handle CORS
    const wasHandled = CorsMiddleware.handleCors(request, response);
    if (wasHandled) return;

    const controller = new CategoryController();

    if(request.method === 'POST')
      await controller.createCategory(request, response);

    else if(request.method === 'PUT')
      await controller.updateCategory(request, response);

    else if(request.method === 'DELETE')
      await controller.deleteCategory(request, response);

    else if(request.method === 'GET') {
      // Extract path and parse it
      const path = request.path || request.url?.split('?')[0] || '/categories';
      const pathParts = path.split('/').filter(p => p);
      
      // Extract ID from path: /categories/{id}
      const resourceId = pathParts[1]; // ID is second segment (after 'categories')

      if (resourceId) {
        // GET /categories/{id} - Get single category
        await controller.getCategoryById(request, response);
      } else {
        // GET /categories?menu_id=xxx&is_active=true|false&search=xxx
        await controller.queryCategories(request, response);
      }
    }

    else
      response.status(405).json({
        success: false,
        message: 'Method not allowed'
      });
  } catch (error) {
    CorsMiddleware.setCorsHeaders(response, request.headers.origin);
    response.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export const place = onRequest({
  maxInstances: 10,
  cors: corsOrigins
}, async (request, response) => {
  try {
    // Handle CORS
    const wasHandled = CorsMiddleware.handleCors(request, response);
    if (wasHandled) return;

    const controller = new PlaceController();

    if(request.method === 'POST')
      await controller.createPlace(request, response);

    else if(request.method === 'PUT')
      await controller.updatePlace(request, response);

    else if(request.method === 'DELETE')
      await controller.deletePlace(request, response);

    else if(request.method === 'GET')
      await controller.getPlaceById(request, response);

    else
      response.status(405).json({
        success: false,
        message: 'Method not allowed'
      });
  } catch (error) {
    CorsMiddleware.setCorsHeaders(response, request.headers.origin);
    response.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Order endpoints
export const orders = onRequest({
  maxInstances: 10,
  cors: corsOrigins
}, async (request, response) => {
  try {
    // Handle CORS
    const wasHandled = CorsMiddleware.handleCors(request, response);
    if (wasHandled) return;

    const controller = new OrderController();

    if (request.method === 'POST')
      await controller.createOrder(request, response);

    else if (request.method === 'GET')
      await controller.getOrders(request, response);

    else
      response.status(405).json({
        success: false,
        message: 'Method not allowed'
      });

  } catch (error) {
    console.error('Orders endpoint error:', error);
    CorsMiddleware.setCorsHeaders(response, request.headers.origin);
    response.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Order detail endpoints
export const orderDetail = onRequest({
  maxInstances: 10,
  cors: corsOrigins
}, async (request, response) => {
  try {
    // Handle CORS
    const wasHandled = CorsMiddleware.handleCors(request, response);
    if (wasHandled) return;

    const controller = new OrderController();

    if (request.method === 'GET')
      await controller.getOrderById(request, response);

    else if (request.method === 'PUT')
      await controller.updateOrderStatus(request, response);

    else
      response.status(405).json({
        success: false,
        message: 'Method not allowed'
      });

  } catch (error) {
    console.error('Order detail endpoint error:', error);
    CorsMiddleware.setCorsHeaders(response, request.headers.origin);
    response.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Order search endpoint
export const orderSearch = onRequest({
  maxInstances: 10,
  cors: corsOrigins
}, async (request, response) => {
  try {
    // Handle CORS
    const wasHandled = CorsMiddleware.handleCors(request, response);
    if (wasHandled) return;

    const controller = new OrderController();

    if (request.method === 'GET')
      await controller.searchOrders(request, response);

    else
      response.status(405).json({
        success: false,
        message: 'Method not allowed'
      });

  } catch (error) {
    console.error('Order search endpoint error:', error);
    CorsMiddleware.setCorsHeaders(response, request.headers.origin);
    response.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Real-time order endpoints
export const ordersRealtime = onRequest({
  maxInstances: 10,
  cors: corsOrigins
}, async (request, response) => {
  try {
    // Handle CORS
    const wasHandled = CorsMiddleware.handleCors(request, response);
    if (wasHandled) return;

    const controller = new OrderRealtimeController();

    if (request.method === 'GET')
      await controller.getRealtimeOrders(request, response);

    else
      response.status(405).json({
        success: false,
        message: 'Method not allowed'
      });

  } catch (error) {
    console.error('Order realtime endpoint error:', error);
    CorsMiddleware.setCorsHeaders(response, request.headers.origin);
    response.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Real-time orders by status endpoint
export const orderRealtimeStatus = onRequest({
  maxInstances: 10,
  cors: corsOrigins
}, async (request, response) => {
  try {
    // Handle CORS
    const wasHandled = CorsMiddleware.handleCors(request, response);
    if (wasHandled) return;

    const controller = new OrderRealtimeController();

    if (request.method === 'GET')
      await controller.getRealtimeOrdersByStatus(request, response);

    else
      response.status(405).json({
        success: false,
        message: 'Method not allowed'
      });

  } catch (error) {
    console.error('Order realtime status endpoint error:', error);
    CorsMiddleware.setCorsHeaders(response, request.headers.origin);
    response.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Real-time single order endpoint
export const orderRealtimeSingle = onRequest({
  maxInstances: 10,
  cors: corsOrigins
}, async (request, response) => {
  try {
    // Handle CORS
    const wasHandled = CorsMiddleware.handleCors(request, response);
    if (wasHandled) return;

    const controller = new OrderRealtimeController();

    if (request.method === 'GET')
      await controller.getRealtimeOrder(request, response);

    else
      response.status(405).json({
        success: false,
        message: 'Method not allowed'
      });

  } catch (error) {
    console.error('Order realtime single endpoint error:', error);
    CorsMiddleware.setCorsHeaders(response, request.headers.origin);
    response.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Cart endpoints
export const cart = onRequest({
  maxInstances: 10,
  cors: corsOrigins
}, async (request, response) => {
  try {
    // Handle CORS
    const wasHandled = CorsMiddleware.handleCors(request, response);
    if (wasHandled) return;

    const controller = new CartController();

    if (request.method === 'POST')
      await controller.createCart(request, response);

    else if (request.method === 'GET')
      await controller.getCartById(request, response);

    else if (request.method === 'PUT')
      await controller.updateCart(request, response);

    else if (request.method === 'DELETE')
      await controller.deleteCart(request, response);

    else
      response.status(405).json({
        success: false,
        message: 'Method not allowed'
      });

  } catch (error) {
    console.error('Cart endpoint error:', error);
    CorsMiddleware.setCorsHeaders(response, request.headers.origin);
    response.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Cart place endpoints
export const cartPlace = onRequest({
  maxInstances: 10,
  cors: corsOrigins
}, async (request, response) => {
  try {
    // Handle CORS
    const wasHandled = CorsMiddleware.handleCors(request, response);
    if (wasHandled) return;

    const controller = new CartController();

    if (request.method === 'GET')
      await controller.getCartsByPlaceId(request, response);

    else
      response.status(405).json({
        success: false,
        message: 'Method not allowed'
      });

  } catch (error) {
    console.error('Cart place endpoint error:', error);
    CorsMiddleware.setCorsHeaders(response, request.headers.origin);
    response.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Cart customer endpoints
export const cartCustomer = onRequest({
  maxInstances: 10,
  cors: corsOrigins
}, async (request, response) => {
  try {
    // Handle CORS
    const wasHandled = CorsMiddleware.handleCors(request, response);
    if (wasHandled) return;

    const controller = new CartController();

    if (request.method === 'GET')
      await controller.getCartsByCustomerId(request, response);

    else
      response.status(405).json({
        success: false,
        message: 'Method not allowed'
      });

  } catch (error) {
    console.error('Cart customer endpoint error:', error);
    CorsMiddleware.setCorsHeaders(response, request.headers.origin);
    response.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Cart active customer endpoints
export const cartActiveCustomer = onRequest({
  maxInstances: 10,
  cors: corsOrigins
}, async (request, response) => {
  try {
    // Handle CORS
    const wasHandled = CorsMiddleware.handleCors(request, response);
    if (wasHandled) return;

    const controller = new CartController();

    if (request.method === 'GET')
      await controller.getActiveCartByCustomerId(request, response);

    else
      response.status(405).json({
        success: false,
        message: 'Method not allowed'
      });

  } catch (error) {
    console.error('Cart active customer endpoint error:', error);
    CorsMiddleware.setCorsHeaders(response, request.headers.origin);
    response.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Cart active session endpoints
export const cartActiveSession = onRequest({
  maxInstances: 10,
  cors: corsOrigins
}, async (request, response) => {
  try {
    // Handle CORS
    const wasHandled = CorsMiddleware.handleCors(request, response);
    if (wasHandled) return;

    const controller = new CartController();

    if (request.method === 'GET')
      await controller.getActiveCartBySessionId(request, response);

    else
      response.status(405).json({
        success: false,
        message: 'Method not allowed'
      });

  } catch (error) {
    console.error('Cart active session endpoint error:', error);
    CorsMiddleware.setCorsHeaders(response, request.headers.origin);
    response.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Cart items endpoints
export const cartItems = onRequest({
  maxInstances: 10,
  cors: corsOrigins
}, async (request, response) => {
  try {
    // Handle CORS
    const wasHandled = CorsMiddleware.handleCors(request, response);
    if (wasHandled) return;

    const controller = new CartController();

    if (request.method === 'POST')
      await controller.addItemToCart(request, response);

    else if (request.method === 'PUT')
      await controller.updateCartItem(request, response);

    else if (request.method === 'DELETE')
      await controller.removeItemFromCart(request, response);

    else
      response.status(405).json({
        success: false,
        message: 'Method not allowed'
      });

  } catch (error) {
    console.error('Cart items endpoint error:', error);
    CorsMiddleware.setCorsHeaders(response, request.headers.origin);
    response.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Cart clear endpoints
export const cartClear = onRequest({
  maxInstances: 10,
  cors: corsOrigins
}, async (request, response) => {
  try {
    // Handle CORS
    const wasHandled = CorsMiddleware.handleCors(request, response);
    if (wasHandled) return;

    const controller = new CartController();

    if (request.method === 'POST')
      await controller.clearCartItems(request, response);

    else
      response.status(405).json({
        success: false,
        message: 'Method not allowed'
      });

  } catch (error) {
    console.error('Cart clear endpoint error:', error);
    CorsMiddleware.setCorsHeaders(response, request.headers.origin);
    response.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Cart discount endpoints
export const cartDiscount = onRequest({
  maxInstances: 10,
  cors: corsOrigins
}, async (request, response) => {
  try {
    // Handle CORS
    const wasHandled = CorsMiddleware.handleCors(request, response);
    if (wasHandled) return;

    const controller = new CartController();

    if (request.method === 'POST')
      await controller.applyDiscount(request, response);

    else if (request.method === 'DELETE')
      await controller.removeDiscount(request, response);

    else
      response.status(405).json({
        success: false,
        message: 'Method not allowed'
      });

  } catch (error) {
    console.error('Cart discount endpoint error:', error);
    CorsMiddleware.setCorsHeaders(response, request.headers.origin);
    response.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Cart convert endpoints
export const cartConvert = onRequest({
  maxInstances: 10,
  cors: corsOrigins
}, async (request, response) => {
  try {
    // Handle CORS
    const wasHandled = CorsMiddleware.handleCors(request, response);
    if (wasHandled) return;

    const controller = new CartController();

    if (request.method === 'POST')
      await controller.convertCartToOrder(request, response);

    else
      response.status(405).json({
        success: false,
        message: 'Method not allowed'
      });

  } catch (error) {
    console.error('Cart convert endpoint error:', error);
    CorsMiddleware.setCorsHeaders(response, request.headers.origin);
    response.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Cart statistics endpoints
export const cartStatistics = onRequest({
  maxInstances: 10,
  cors: corsOrigins
}, async (request, response) => {
  try {
    // Handle CORS
    const wasHandled = CorsMiddleware.handleCors(request, response);
    if (wasHandled) return;

    const controller = new CartController();

    if (request.method === 'GET')
      await controller.getCartStatistics(request, response);

    else
      response.status(405).json({
        success: false,
        message: 'Method not allowed'
      });

  } catch (error) {
    console.error('Cart statistics endpoint error:', error);
    CorsMiddleware.setCorsHeaders(response, request.headers.origin);
    response.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Cart popular items endpoints
export const cartPopular = onRequest({
  maxInstances: 10,
  cors: corsOrigins
}, async (request, response) => {
  try {
    // Handle CORS
    const wasHandled = CorsMiddleware.handleCors(request, response);
    if (wasHandled) return;

    const controller = new CartController();

    if (request.method === 'GET')
      await controller.getPopularCartItems(request, response);

    else
      response.status(405).json({
        success: false,
        message: 'Method not allowed'
      });

  } catch (error) {
    console.error('Cart popular items endpoint error:', error);
    CorsMiddleware.setCorsHeaders(response, request.headers.origin);
    response.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Attachment endpoints
export const attachments = onRequest({
  maxInstances: 10,
  cors: corsOrigins
}, async (request, response) => {
  try {
    // Handle CORS
    const wasHandled = CorsMiddleware.handleCors(request, response);
    if (wasHandled) return;

    const controller = new AttachmentController();

    // Extract path and parse it
    const requestPath = request.path || request.url?.split('?')[0] || '';
    const pathParts = requestPath.split('/').filter(p => p);
    
    // Extract ID from path: /attachments/{id} or /attachments/{id}/signed-url
    const resourceId = pathParts[1]; // ID is second segment (after 'attachments')
    const action = pathParts[2]; // Third segment for actions like 'signed-url'

    if (request.method === 'GET') {
      if (action === 'signed-url' && resourceId) {
        // GET /attachments/{id}/signed-url - Get signed URL
        await controller.getSignedUrl(request, response);
      } else if (resourceId) {
        // GET /attachments/{id} - Get single attachment
        await controller.getAttachmentById(request, response);
      } else {
        // GET /attachments?uploaded_by=xxx&related_entity_type=xxx - List with filters
        await controller.getAttachments(request, response);
      }
    }
    else if (request.method === 'POST') {
      // POST /attachments - Upload attachment
      await controller.uploadAttachment(request, response);
    }
    else if (request.method === 'DELETE') {
      if (resourceId) {
        // DELETE /attachments/{id} - Delete attachment
        await controller.deleteAttachment(request, response);
      } else {
        response.status(400).json({ success: false, message: 'Attachment ID required' });
      }
    }
    else {
      response.status(405).json({ success: false, message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Attachments endpoint error:', error);
    CorsMiddleware.setCorsHeaders(response, request.headers.origin);
    response.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Addon Groups endpoints
export const addonGroups = onRequest({
  maxInstances: 10,
  cors: corsOrigins
}, async (request, response) => {
  try {
    // Handle CORS
    const wasHandled = CorsMiddleware.handleCors(request, response);
    if (wasHandled) return;

    const controller = new AddonGroupController();

    // Extract path and parse it
    const path = request.path || request.url?.split('?')[0] || '/addonGroups';
    const pathParts = path.split('/').filter(p => p);
    
    // Extract ID from path: /addonGroups/{id} or /{id} (Firebase Functions v2 may return relative path)
    // Try pathParts[1] first (if path includes 'addonGroups'), then pathParts[0] (if path is just /{id})
    let resourceId = pathParts[1]; // ID is second segment (after 'addonGroups')
    
    // If pathParts[1] is undefined, try pathParts[0] (for relative paths like /{id})
    // But only if pathParts[0] is not 'addonGroups'
    if (!resourceId && pathParts[0] && pathParts[0] !== 'addonGroups') {
      resourceId = pathParts[0];
    }
    
    // Set resourceId in req.params[0] for controller methods that need it
    if (resourceId) {
      request.params = request.params || {};
      request.params[0] = resourceId;
    }

    if (request.method === 'GET') {
      if (resourceId) {
        // GET /addonGroups/{id} - Get single addon group
        await controller.getAddonGroupById(request, response);
      } else {
        // GET /addonGroups?placeId=xxx&menuId=xxx&categoryId=xxx&itemId=xxx&isActive=true|false&search=xxx
        await controller.queryAddonGroups(request, response);
      }
    }
    else if (request.method === 'POST') {
      // POST /addonGroups - Create new addon group
      await controller.createAddonGroup(request, response);
    }
    else if (request.method === 'PUT') {
      // PUT /addonGroups/{id} - Update addon group
      // Allow ID from path or body (controller will handle validation)
      await controller.updateAddonGroup(request, response);
    }
    else if (request.method === 'DELETE') {
      if (resourceId) {
        // DELETE /addonGroups/{id} - Delete addon group
        await controller.deleteAddonGroup(request, response);
      } else {
        response.status(400).json({ success: false, message: 'Addon group ID required' });
      }
    }
    else {
      response.status(405).json({ success: false, message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Addon groups endpoint error:', error);
    CorsMiddleware.setCorsHeaders(response, request.headers.origin);
    response.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});


