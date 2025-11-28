import { onRequest } from 'firebase-functions/v2/https';

/**
 * Health Controller - Handles health check and API information endpoints
 * Follows clean architecture by separating presentation layer concerns
 */
export class HealthController {
  /**
   * Health check endpoint - returns service status
   */
  static healthCheck = onRequest({
    maxInstances: 10
  }, (_request, response) => {
    response.json({
      success: true,
      status: 'OK',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  });

  /**
   * API information endpoint - returns available endpoints
   */
  static getApiInfo = onRequest({
    maxInstances: 10
  }, (_request, response) => {
    response.json({
      success: true,
      message: 'TabNorder Backend API',
      version: '1.0.0',
      endpoints: [
        'health',
        'getMenuByPlaceId',
        'createMenuForPlace', 
        'updateMenuForPlace',
        'updateMenuItem'
      ]
    });
  });
}

// Export individual functions for Firebase Functions
export const healthCheck = HealthController.healthCheck;
export const getApiInfo = HealthController.getApiInfo;
