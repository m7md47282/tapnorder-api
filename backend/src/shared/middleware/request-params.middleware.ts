import { Request } from 'express';

/**
 * Request Parameters Middleware
 * Generic utility to extract resource IDs from Firebase Functions requests
 * Handles both path parameters and query parameters for maximum compatibility
 * 
 * Firebase Functions can pass parameters in different ways:
 * - Path: /orders/{id} -> request.path = '/orders/123'
 * - Query: /orderDetail?id=123 -> request.query.id = '123'
 * - Both: /orders/123?placeId=xxx -> path has ID, query has filters
 */
export class RequestParamsMiddleware {
  /**
   * Extract resource ID from request
   * Tries multiple strategies:
   * 1. Path parameter (e.g., /orders/{id})
   * 2. Query parameter 'id'
   * 3. Query parameter '{resourceName}_id' (e.g., 'order_id', 'item_id')
   * 4. Query parameter '{resourceName}Id' (e.g., 'orderId', 'itemId')
   * 
   * @param request - Express request object
   * @param resourceName - Name of the resource (e.g., 'order', 'item', 'cart')
   * @param pathIndex - Index in path parts where ID should be (default: 1)
   * @returns The extracted ID or undefined
   */
  static extractResourceId(
    request: Request,
    resourceName: string,
    pathIndex: number = 1
  ): string | undefined {
    // Strategy 1: Extract from path
    const pathId = this.extractIdFromPath(request, pathIndex);
    if (pathId) {
      return pathId;
    }

    // Strategy 2: Extract from query parameters
    const queryId = this.extractIdFromQuery(request, resourceName);
    if (queryId) {
      return queryId;
    }

    return undefined;
  }

  /**
   * Extract ID from path
   * @param request - Express request object
   * @param pathIndex - Index in path parts (default: 1, meaning second segment)
   * @returns ID from path or undefined
   */
  static extractIdFromPath(request: Request, pathIndex: number = 1): string | undefined {
    try {
      // Get path from request (Firebase Functions may use request.path or request.url)
      const path = request.path || request.url?.split('?')[0] || '';
      const pathParts = path.split('/').filter(p => p);
      
      // Extract ID from specified index
      // Example: /orders/123 -> pathParts = ['orders', '123'], pathIndex 1 = '123'
      if (pathParts.length > pathIndex && pathParts[pathIndex]) {
        return pathParts[pathIndex];
      }
    } catch (error) {
      console.error('Error extracting ID from path:', error);
    }
    
    return undefined;
  }

  /**
   * Extract ID from query parameters
   * Tries multiple query parameter names:
   * - 'id' (generic)
   * - '{resourceName}_id' (snake_case, e.g., 'order_id')
   * - '{resourceName}Id' (camelCase, e.g., 'orderId')
   * 
   * @param request - Express request object
   * @param resourceName - Name of the resource
   * @returns ID from query or undefined
   */
  static extractIdFromQuery(request: Request, resourceName: string): string | undefined {
    try {
      const query = request.query || {};
      
      // Try generic 'id' parameter
      if (query.id && typeof query.id === 'string') {
        return query.id;
      }

      // Try snake_case: order_id, item_id, cart_id, etc.
      const snakeCaseKey = `${resourceName}_id`;
      if (query[snakeCaseKey] && typeof query[snakeCaseKey] === 'string') {
        return query[snakeCaseKey] as string;
      }

      // Try camelCase: orderId, itemId, cartId, etc.
      const camelCaseKey = `${resourceName}Id`;
      if (query[camelCaseKey] && typeof query[camelCaseKey] === 'string') {
        return query[camelCaseKey] as string;
      }
    } catch (error) {
      console.error('Error extracting ID from query:', error);
    }
    
    return undefined;
  }

  /**
   * Set resource ID in request params for controller compatibility
   * This ensures controllers can access the ID via req.params[0]
   * 
   * @param request - Express request object
   * @param resourceId - The resource ID to set
   */
  static setResourceIdInParams(request: Request, resourceId: string | undefined): void {
    if (resourceId) {
      request.params = request.params || {};
      request.params[0] = resourceId;
    }
  }

  /**
   * Extract and set resource ID in one call
   * Convenience method that combines extractResourceId and setResourceIdInParams
   * 
   * @param request - Express request object
   * @param resourceName - Name of the resource
   * @param pathIndex - Index in path parts where ID should be (default: 1)
   * @returns The extracted ID or undefined
   */
  static extractAndSetResourceId(
    request: Request,
    resourceName: string,
    pathIndex: number = 1
  ): string | undefined {
    const resourceId = this.extractResourceId(request, resourceName, pathIndex);
    this.setResourceIdInParams(request, resourceId);
    return resourceId;
  }

  /**
   * Extract query parameter value
   * Helper to safely extract query parameters with type checking
   * 
   * @param request - Express request object
   * @param paramName - Name of the query parameter
   * @param defaultValue - Default value if parameter is not found
   * @returns The parameter value or default
   */
  static getQueryParam(
    request: Request,
    paramName: string,
    defaultValue?: string
  ): string | undefined {
    try {
      const query = request.query || {};
      const value = query[paramName];
      
      if (typeof value === 'string') {
        return value;
      }
      
      if (Array.isArray(value) && value.length > 0) {
        return value[0] as string;
      }
    } catch (error) {
      console.error(`Error extracting query parameter ${paramName}:`, error);
    }
    
    return defaultValue;
  }

  /**
   * Extract boolean query parameter
   * Handles string values like 'true', 'false', '1', '0'
   * 
   * @param request - Express request object
   * @param paramName - Name of the query parameter
   * @param defaultValue - Default value if parameter is not found
   * @returns The boolean value or default
   */
  static getBooleanQueryParam(
    request: Request,
    paramName: string,
    defaultValue?: boolean
  ): boolean | undefined {
    const value = this.getQueryParam(request, paramName);
    
    if (value === undefined) {
      return defaultValue;
    }
    
    if (value === 'true' || value === '1') {
      return true;
    }
    
    if (value === 'false' || value === '0') {
      return false;
    }
    
    return defaultValue;
  }
}

