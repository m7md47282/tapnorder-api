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
import { UserController } from './controllers/user.controller';
import { BranchController } from './controllers/branch.controller';
import { InventoryController } from './controllers/inventory.controller';
import { TableController } from './controllers/table.controller';
import { CorsMiddleware } from './shared/middleware/cors.middleware';
import { CorsConfigFactory } from './shared/config/cors.config';
import { RequestParamsMiddleware } from './shared/middleware/request-params.middleware';
import { AuthMiddleware, AuthenticatedRequest } from './shared/middleware/auth.middleware';

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

// Administrative user management endpoint
// GET /users?placeId=xxx - Get users by place ID (super admin or place admin)
// POST /users - Create users (super admin or place admin)
export const users = onRequest({
  maxInstances: 10,
  cors: corsOrigins
}, async (request, response) => {
  try {
    const wasHandled = CorsMiddleware.handleCors(request, response);
    if (wasHandled) return;

    const controller = new UserController();

    // Attach authenticated user for authorization
    await AuthMiddleware.attachAuthenticatedUser(request as AuthenticatedRequest);

    if (request.method === 'GET') {
      await controller.getUsers(request as AuthenticatedRequest, response);
    } else if (request.method === 'POST') {
      await controller.createUser(request as AuthenticatedRequest, response);
    } else {
      response.status(405).json({
        success: false,
        message: 'Method not allowed'
      });
    }
  } catch (error) {
    console.error('Users endpoint error:', error);
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

    // Extract and set resource ID from path or query parameters
    const resourceId = RequestParamsMiddleware.extractAndSetResourceId(request, 'item', 1);

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

    // Extract and set resource ID from path or query parameters
    RequestParamsMiddleware.extractAndSetResourceId(request, 'item', 1);

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
      // Extract and set resource ID from path or query parameters
      const resourceId = RequestParamsMiddleware.extractAndSetResourceId(request, 'category', 1);

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

    // Extract and set resource ID from path or query parameters
    RequestParamsMiddleware.extractAndSetResourceId(request, 'place', 1);

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

// Places listing endpoint (for super admin / admin UIs)
// GET /places?ownerId=xxx&status=active&city=...&state=...&allowOnlineOrders=true
export const places = onRequest({
  maxInstances: 10,
  cors: corsOrigins
}, async (request, response) => {
  try {
    // Handle CORS
    const wasHandled = CorsMiddleware.handleCors(request, response);
    if (wasHandled) return;

    const controller = new PlaceController();

    if (request.method === 'GET') {
      // When called without filters, this returns all places.
      await controller.queryPlaces(request, response);
    } else {
      response.status(405).json({
        success: false,
        message: 'Method not allowed'
      });
    }
  } catch (error) {
    console.error('Places endpoint error:', error);
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

    // Attach authenticated user if present (allows guest orders)
    // Guest orders don't require authentication
    await AuthMiddleware.attachAuthenticatedUserIfPresent(request as AuthenticatedRequest);

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

    // Extract and set resource ID from path or query parameters
    RequestParamsMiddleware.extractAndSetResourceId(request, 'order', 1);

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
  // Track if headers have been sent (for SSE streams)
  let headersSent = false;
  
  try {
    // Handle CORS
    const wasHandled = CorsMiddleware.handleCors(request, response);
    if (wasHandled) return;

    const controller = new OrderRealtimeController();

    if (request.method === 'GET') {
      // Check if response headers are already sent (SSE case)
      headersSent = response.headersSent;
      await controller.getRealtimeOrders(request, response);
    } else {
      response.status(405).json({
        success: false,
        message: 'Method not allowed'
      });
    }

  } catch (error) {
    console.error('Order realtime endpoint error:', error);
    
    // If headers are already sent (SSE stream started), send SSE error event
    if (headersSent || response.headersSent) {
      try {
        response.write(`data: ${JSON.stringify({
          type: 'error',
          message: 'Internal server error',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        })}\n\n`);
        response.end();
      } catch (writeError) {
        console.error('Error writing SSE error event:', writeError);
      }
    } else {
      // Headers not sent yet, send JSON error response
      CorsMiddleware.setCorsHeaders(response, request.headers.origin);
      response.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
});

// Real-time orders by status endpoint
export const orderRealtimeStatus = onRequest({
  maxInstances: 10,
  cors: corsOrigins
}, async (request, response) => {
  // Track if headers have been sent (for SSE streams)
  let headersSent = false;
  
  try {
    // Handle CORS
    const wasHandled = CorsMiddleware.handleCors(request, response);
    if (wasHandled) return;

    const controller = new OrderRealtimeController();

    if (request.method === 'GET') {
      // Check if response headers are already sent (SSE case)
      headersSent = response.headersSent;
      await controller.getRealtimeOrdersByStatus(request, response);
    } else {
      response.status(405).json({
        success: false,
        message: 'Method not allowed'
      });
    }

  } catch (error) {
    console.error('Order realtime status endpoint error:', error);
    
    // If headers are already sent (SSE stream started), send SSE error event
    if (headersSent || response.headersSent) {
      try {
        response.write(`data: ${JSON.stringify({
          type: 'error',
          message: 'Internal server error',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        })}\n\n`);
        response.end();
      } catch (writeError) {
        console.error('Error writing SSE error event:', writeError);
      }
    } else {
      // Headers not sent yet, send JSON error response
      CorsMiddleware.setCorsHeaders(response, request.headers.origin);
      response.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
});

// Real-time single order endpoint
export const orderRealtimeSingle = onRequest({
  maxInstances: 10,
  cors: corsOrigins
}, async (request, response) => {
  let headersSent = false;
  
  try {

    const wasHandled = CorsMiddleware.handleCors(request, response);
    if (wasHandled) return;
    
    let orderId = RequestParamsMiddleware.extractResourceId(request, 'order', 0);
    if (!orderId) {
      orderId = RequestParamsMiddleware.extractResourceId(request, 'order', 1);
    }
    
    if (!request.params) request.params = {};
    if (orderId) {
      request.params.id = orderId;
    }

    const controller = new OrderRealtimeController();

    if (request.method === 'GET') {
      headersSent = response.headersSent;
      await controller.getRealtimeOrder(request, response);
    } else {
      response.status(405).json({
        success: false,
        message: 'Method not allowed'
      });
    }

  } catch (error) {
    console.error('Order realtime single endpoint error:', error);
    
    // If headers are already sent (SSE stream started), send SSE error event
    if (headersSent || response.headersSent) {
      try {
        response.write(`data: ${JSON.stringify({
          type: 'error',
          message: 'Internal server error',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        })}\n\n`);
        response.end();
      } catch (writeError) {
        console.error('Error writing SSE error event:', writeError);
      }
    } else {
      // Headers not sent yet, send JSON error response
      CorsMiddleware.setCorsHeaders(response, request.headers.origin);
      response.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
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

    // Extract and set resource ID from path or query parameters
    RequestParamsMiddleware.extractAndSetResourceId(request, 'cart', 1);

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

    // Extract path and parse it for nested routes (signed-url)
    const requestPath = request.path || request.url?.split('?')[0] || '';
    const pathParts = requestPath.split('/').filter(p => p);
    
    // Extract ID from path or query parameters
    const resourceId = RequestParamsMiddleware.extractResourceId(request, 'attachment', 1);
    RequestParamsMiddleware.setResourceIdInParams(request, resourceId);
    
    // Extract action from path (e.g., 'signed-url')
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

    // Extract and set resource ID from path or query parameters
    const resourceId = RequestParamsMiddleware.extractAndSetResourceId(request, 'addonGroup', 1);

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

// Branches endpoint
export const branches = onRequest({
  maxInstances: 10,
  cors: corsOrigins
}, async (request, response) => {
  try {
    // Handle CORS
    const wasHandled = CorsMiddleware.handleCors(request, response);
    if (wasHandled) return;

    const controller = new BranchController();

    // Extract and set resource ID from path or query parameters
    const resourceId = RequestParamsMiddleware.extractAndSetResourceId(request, 'branch', 1);

    if (request.method === 'GET') {
      if (resourceId) {
        // GET /branches/{id} - Get single branch
        await controller.getBranchById(request, response);
      } else {
        // GET /branches?place_id=xxx&status=active&city=xxx&state=xxx&allow_online_orders=true&search=xxx
        await controller.queryBranches(request, response);
      }
    }
    else if (request.method === 'POST') {
      // POST /branches - Create new branch
      await controller.createBranch(request, response);
    }
    else if (request.method === 'PUT') {
      // PUT /branches/{id} - Update branch
      // Allow ID from path or body (controller will handle validation)
      await controller.updateBranch(request, response);
    }
    else if (request.method === 'DELETE') {
      if (resourceId) {
        // DELETE /branches/{id} - Delete branch
        await controller.deleteBranch(request, response);
      } else {
        response.status(400).json({ success: false, message: 'Branch ID required' });
      }
    }
    else {
      response.status(405).json({ success: false, message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Branches endpoint error:', error);
    CorsMiddleware.setCorsHeaders(response, request.headers.origin);
    response.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Inventory endpoints
export const inventory = onRequest({
  maxInstances: 10,
  cors: corsOrigins
}, async (request, response) => {
  try {
    // Handle CORS
    const wasHandled = CorsMiddleware.handleCors(request, response);
    if (wasHandled) return;

    const controller = new InventoryController();

    // Extract path and parse it
    const path = request.path || request.url?.split('?')[0] || '';
    const pathParts = path.split('/').filter(p => p);
    
    // Extract ID from path: /inventory/{id} or /inventory/adjust
    const resourceId = pathParts[1]; // ID is second segment (after 'inventory')
    const action = pathParts[1]; // Check if it's an action like 'adjust'

    if (request.method === 'GET') {
      if (resourceId && resourceId !== 'adjust') {
        // GET /inventory/{id} - Get single inventory item
        await controller.getInventoryById(request, response);
      } else if (request.query.low_stock === 'true' || request.query.lowStock === 'true') {
        // GET /inventory?place_id=xxx&low_stock=true - Get low stock items
        await controller.getLowStockItems(request, response);
      } else if (request.query.place_id || request.query.placeId) {
        // GET /inventory?place_id=xxx - Get inventory by place
        await controller.getInventoryByPlaceId(request, response);
      } else {
        // GET /inventory?place_id=xxx&branch_id=xxx&ingredient_name=xxx&unit=xxx&low_stock=true&search=xxx - Query inventory
        await controller.queryInventory(request, response);
      }
    }
    else if (request.method === 'POST') {
      if (action === 'adjust') {
        // POST /inventory/adjust - Adjust inventory
        await controller.adjustInventory(request, response);
      } else {
        // POST /inventory - Create new inventory item
        await controller.createInventory(request, response);
      }
    }
    else if (request.method === 'PUT') {
      if (resourceId && resourceId !== 'adjust') {
        // PUT /inventory/{id} - Update inventory
        await controller.updateInventory(request, response);
      } else {
        response.status(400).json({ success: false, message: 'Inventory ID required' });
      }
    }
    else if (request.method === 'DELETE') {
      if (resourceId && resourceId !== 'adjust') {
        // DELETE /inventory/{id} - Delete inventory
        await controller.deleteInventory(request, response);
      } else {
        response.status(400).json({ success: false, message: 'Inventory ID required' });
      }
    }
    else {
      response.status(405).json({ success: false, message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Inventory endpoint error:', error);
    CorsMiddleware.setCorsHeaders(response, request.headers.origin);
    response.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Tables endpoint
export const tables = onRequest({
  maxInstances: 10,
  cors: corsOrigins
}, async (request, response) => {
  try {
    // Handle CORS
    const wasHandled = CorsMiddleware.handleCors(request, response);
    if (wasHandled) return;

    const controller = new TableController();

    // Extract and set resource ID from path or query parameters
    const resourceId = RequestParamsMiddleware.extractAndSetResourceId(request, 'table', 1);

    if (request.method === 'GET') {
      if (resourceId) {
        // GET /tables/{id} - Get single table
        await controller.getTableById(request, response);
      } else {
        // GET /tables?place_id=xxx&branch_id=xxx&status=xxx&location=xxx&is_active=true&search=xxx
        await controller.queryTables(request, response);
      }
    }
    else if (request.method === 'POST') {
      // POST /tables - Create new table
      await controller.createTable(request, response);
    }
    else if (request.method === 'PUT') {
      if (resourceId) {
        // PUT /tables/{id} - Update table
        await controller.updateTable(request, response);
      } else {
        response.status(400).json({ success: false, message: 'Table ID required' });
      }
    }
    else if (request.method === 'DELETE') {
      if (resourceId) {
        // DELETE /tables/{id} - Delete table
        await controller.deleteTable(request, response);
      } else {
        response.status(400).json({ success: false, message: 'Table ID required' });
      }
    }
    else {
      response.status(405).json({ success: false, message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Tables endpoint error:', error);
    CorsMiddleware.setCorsHeaders(response, request.headers.origin);
    response.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});


