/**
 * CORS Configuration for TabNorder Backend
 * Handles Cross-Origin Resource Sharing configuration
 */

export interface CorsConfig {
  origin: string | string[] | boolean;
  methods: string[];
  allowedHeaders: string[];
  credentials: boolean;
  maxAge?: number;
  preflightContinue?: boolean;
  optionsSuccessStatus?: number;
}

/**
 * CORS Configuration Factory
 * Creates CORS configuration based on environment
 */
export class CorsConfigFactory {
  /**
   * Get CORS configuration for the current environment
   * @returns CorsConfig object
   */
  static getConfig(): CorsConfig {
    // const environment = process.env.NODE_ENV || 'development';
    const allowedOrigins = this.getAllowedOrigins();

    return {
      origin: allowedOrigins,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'Cache-Control',
        'Pragma',
        'X-API-Key',
        'X-Request-ID',
        'X-Correlation-ID'
      ],
      credentials: true,
      maxAge: 86400, // 24 hours
      preflightContinue: false,
      optionsSuccessStatus: 204
    };
  }

  /**
   * Get allowed origins based on environment
   * @returns Array of allowed origins or boolean for wildcard
   */
  private static getAllowedOrigins(): string[] | boolean {
    const environment = process.env.NODE_ENV || 'development';
    
    // Get origins from environment variable
    const envOrigins = process.env.ALLOWED_ORIGINS;
    
    if (envOrigins) {
      return envOrigins.split(',').map(origin => origin.trim());
    }

    // Default origins based on environment
    switch (environment) {
      case 'development':
        return [
          'http://localhost:3000',
          'http://localhost:3001',
          'http://localhost:4200',
          'http://localhost:5000',
          'http://127.0.0.1:3000',
          'http://127.0.0.1:3001',
          'http://127.0.0.1:4200',
          'http://127.0.0.1:5000',
          'https://us-central1-tab-n-order.cloudfunctions.net',
          'https://tab-n-order.web.app'
        ];
      
      case 'staging':
        return [
          'https://staging.tabnorder.com',
          'https://staging-web.tabnorder.com',
          'https://staging-admin.tabnorder.com',
          'https://us-central1-tab-n-order.cloudfunctions.net',
          'https://tab-n-order.web.app'
        ];
      
      case 'production':
        return [
          'https://tabnorder.com',
          'https://www.tabnorder.com',
          'https://admin.tabnorder.com',
          'https://app.tabnorder.com',
          'https://tab-n-order.web.app',
          'http://localhost:4200',
          'http://127.0.0.1:4200',
          'https://us-central1-tab-n-order.cloudfunctions.net',
          'https://tab-n-order.web.app'
        ];
      
      default:
        // For testing or unknown environments, allow all origins
        return true;
    }
  }

  /**
   * Check if origin is allowed
   * @param origin The origin to check
   * @returns boolean indicating if origin is allowed
   */
  static isOriginAllowed(origin: string): boolean {
    const config = this.getConfig();
    
    if (config.origin === true) {
      return true;
    }
    
    if (Array.isArray(config.origin)) {
      return config.origin.includes(origin);
    }
    
    return config.origin === origin;
  }

  /**
   * Get CORS headers for manual response handling
   * @param origin The request origin
   * @returns Object with CORS headers
   */
  static getCorsHeaders(origin?: string): Record<string, string> {
    const config = this.getConfig();
    
    // When credentials is true, we cannot use '*' - must use specific origin
    let allowedOrigin: string;
    if (config.credentials) {
      if (origin && this.isOriginAllowed(origin)) {
        allowedOrigin = origin;
      } else if (Array.isArray(config.origin) && config.origin.length > 0) {
        // Use first allowed origin as fallback
        allowedOrigin = config.origin[0] as string;
      } else if (typeof config.origin === 'string') {
        allowedOrigin = config.origin;
      } else {
        // If wildcard is allowed but credentials is true, use the request origin or fallback
        allowedOrigin = origin || (Array.isArray(config.origin) && config.origin.length > 0 ? config.origin[0] as string : '*');
      }
    } else {
      // When credentials is false, we can use wildcard
      allowedOrigin = origin && this.isOriginAllowed(origin) ? origin : '*';
    }
    
    const headers: Record<string, string> = {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': config.methods.join(', '),
      'Access-Control-Allow-Headers': config.allowedHeaders.join(', '),
      'Access-Control-Max-Age': config.maxAge?.toString() || '86400'
    };
    
    // Only set credentials header if credentials is true
    if (config.credentials) {
      headers['Access-Control-Allow-Credentials'] = 'true';
    }
    
    return headers;
  }
}

/**
 * CORS Middleware for Express (if using Express directly)
 * Note: This is for reference - Firebase Functions v2 handles CORS differently
 */
export const corsMiddleware = (req: any, res: any, next: any) => {
  const origin = req.headers.origin;
//   const config = CorsConfigFactory.getConfig();
  
  // Set CORS headers
  const headers = CorsConfigFactory.getCorsHeaders(origin);
  Object.entries(headers).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  
  next();
};
