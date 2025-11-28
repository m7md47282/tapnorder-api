/**
 * CORS Middleware for Firebase Functions v2
 * Handles CORS headers and preflight requests
 */

import { Request } from 'firebase-functions/v2/https';
import { Response } from 'express';
import { CorsConfigFactory } from '../config/cors.config';

/**
 * CORS Middleware for Firebase Functions
 * Handles CORS headers and preflight requests
 */
export class CorsMiddleware {
  /**
   * Handle CORS for Firebase Functions v2
   * @param request Firebase Functions request object
   * @param response Firebase Functions response object
   * @returns boolean indicating if request was handled (for preflight)
   */
  static handleCors(request: Request, response: Response): boolean {
    const origin = request.headers.origin;
    const method = request.method;

    // Set CORS headers
    const corsHeaders = CorsConfigFactory.getCorsHeaders(origin);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.setHeader(key, value);
    });

    // Handle preflight requests
    if (method === 'OPTIONS') {
      response.status(204).send('');
      return true; // Indicates request was handled
    }

    return false; // Indicates request should continue processing
  }

  /**
   * Set CORS headers on response
   * @param response Firebase Functions response object
   * @param origin Request origin (optional)
   */
  static setCorsHeaders(response: Response, origin?: string): void {
    const corsHeaders = CorsConfigFactory.getCorsHeaders(origin);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.setHeader(key, value);
    });
  }

  /**
   * Check if origin is allowed
   * @param origin The origin to check
   * @returns boolean indicating if origin is allowed
   */
  static isOriginAllowed(origin: string): boolean {
    return CorsConfigFactory.isOriginAllowed(origin);
  }

  /**
   * Handle CORS error response
   * @param response Firebase Functions response object
   * @param origin Request origin
   * @param message Error message
   */
  static handleCorsError(response: Response, origin: string, message: string = 'CORS policy violation'): void {
    this.setCorsHeaders(response, origin);
    response.status(403).json({
      success: false,
      error: 'CORS_ERROR',
      message,
      origin,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * CORS Wrapper for Firebase Functions
 * Wraps a function handler with CORS handling
 */
export function withCors<T extends any[]>(
  handler: (request: Request, response: Response, ...args: T) => Promise<void> | void
) {
  return async (request: Request, response: Response, ...args: T): Promise<void> => {
    try {
      // Handle CORS
      const wasHandled = CorsMiddleware.handleCors(request, response);
      if (wasHandled) {
        return; // Preflight request was handled
      }

      // Check origin if not wildcard
      const origin = request.headers.origin;
      if (origin && !CorsMiddleware.isOriginAllowed(origin)) {
        CorsMiddleware.handleCorsError(response, origin, 'Origin not allowed');
        return;
      }

      // Call the original handler
      await handler(request, response, ...args);
    } catch (error) {
      console.error('CORS wrapper error:', error);
      CorsMiddleware.setCorsHeaders(response, request.headers.origin);
      response.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while processing the request',
        timestamp: new Date().toISOString()
      });
    }
  };
}
