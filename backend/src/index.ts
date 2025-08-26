import { onRequest } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';
import { MenuService } from './services/menu.service';

// Set global options for Firebase Functions v2
setGlobalOptions({
  maxInstances: 10,
  region: 'us-central1',
  timeoutSeconds: 540,
  memory: '256MiB'
});

// Health check function
export const healthCheck = onRequest({
  maxInstances: 10
}, (request, response) => {
  response.json({
    success: true,
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API info function
export const getApiInfo = onRequest({
  maxInstances: 10
}, (request, response) => {
  response.json({
    success: true,
    message: 'TabNorder Backend API',
    version: '1.0.0',
    endpoints: [
      'health'
    ]
  });
});

export const health = onRequest({
    maxInstances: 10
}, (request, response) => {
    response.json({
        success: true,
        message: 'Service is healthy',
        timestamp: new Date().toISOString()
    });
});


export const apiInfo = onRequest({
    maxInstances: 10
}, (request, response) => {
  response.json({
      success: true,
      message: 'TabNorder Backend API',
      version: '1.0.0',
      endpoints: [
          'health'
          ]   
      });
  });

export const getMenu = onRequest({
  maxInstances: 10
}, async (request, response) => {
  try {
    const placeId = request.query.placeId || request.body?.placeId;
    
    if (!placeId) {
      response.status(400).json({
        success: false,
        message: 'placeId is required'
      });
      return;
    }

    const menuService = new MenuService();
    const menu = await menuService.getMenuByPlaceId(placeId);

    if (!menu) {
      response.status(404).json({
        success: false,
        message: 'Menu not found'
      });
      return;
    }

    response.json({
      success: true,
      message: 'Menu fetched successfully',
      data: menu
    });
  } catch (error) {
    console.error('Error fetching menu:', error);
    response.status(500).json({
      success: false,
      message: 'An error occurred while fetching the menu'
    });
  }
});

export const errorHandler = (err: any, _req: any, res: any, _next: any) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'An unexpected error occurred.',
    error: err.message || 'Internal Server Error'
  });
};
  






  //{compenent ---> service --> repository --> firebase repository} ---> {---> index.ts --> controller --> service --> repository  --> database}

