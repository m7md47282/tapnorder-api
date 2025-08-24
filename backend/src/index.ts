import { onCall } from 'firebase-functions/v2/https';
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
export const healthCheck = onCall({
  maxInstances: 10
}, (_request) => {
  return {
    success: true,
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  };
});

// API info function
export const getApiInfo = onCall({
  maxInstances: 10
}, (_request) => {
  return {
    success: true,
    message: 'TabNorder Backend API',
    version: '1.0.0',
    endpoints: [
      'health'
    ]
  };
});

export const health = onCall({
    maxInstances: 10
}, (_request) => {
    return {
        success: true,
        message: 'Service is healthy',
        timestamp: new Date().toISOString()
    };
});


export const apiInfo = onCall({
    maxInstances: 10
}, (_request) => {
  return {
      success: true,
      message: 'TabNorder Backend API',
      version: '1.0.0',
      endpoints: [
          'health'
          ]   
      };
  });

export const getMenu = onCall({
  maxInstances: 10
}, async (request) => {
  const placeId = request.data.placeId;
  const menuService = new MenuService();
  const menu = await menuService.getMenuByPlaceId(placeId);

  if (!menu) {
    return {
      success: false,
      message: 'Menu not found'
    };
  }

  return {
    success: true,
    message: 'Menu fetched successfully',
    data: menu
  };
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

