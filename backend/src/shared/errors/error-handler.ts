import { Request, Response } from 'express';
import { logger } from 'firebase-functions/v2';
import { 
  BaseCustomError, 
  ValidationError, 
  UnauthorizedError,
  ForbiddenError,
  ResourceNotFoundError,
  MenuNotFoundError,
  ItemNotFoundError,
  BusinessRuleViolationError,
  DatabaseError,
  InternalServerError,
  UnknownError,
  ErrorCode
} from './custom-errors';

/**
 * API Response Interface - Consistent response format
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
    correlationId?: string;
    timestamp?: string;
  };
  metadata?: {
    timestamp: string;
    version: string;
    requestId?: string;
  };
}

/**
 * Error Handler Class - Centralized error handling
 * Follows Clean Architecture and SOLID principles
 * Handles all error types and returns proper REST responses
 */
export class ErrorHandler {
  private static readonly DEFAULT_MESSAGES: Record<string, string> = {
    [ErrorCode.VALIDATION_ERROR]: 'Validation failed',
    [ErrorCode.INVALID_INPUT]: 'Invalid input provided',
    [ErrorCode.MISSING_REQUIRED_FIELD]: 'Required field is missing',
    [ErrorCode.INVALID_FORMAT]: 'Invalid format provided',
    [ErrorCode.UNAUTHORIZED]: 'Unauthorized access',
    [ErrorCode.FORBIDDEN]: 'Access forbidden',
    [ErrorCode.RESOURCE_NOT_FOUND]: 'Resource not found',
    [ErrorCode.MENU_NOT_FOUND]: 'Menu not found',
    [ErrorCode.ITEM_NOT_FOUND]: 'Item not found',
    [ErrorCode.PLACE_NOT_FOUND]: 'Place not found',
    [ErrorCode.RESOURCE_ALREADY_EXISTS]: 'Resource already exists',
    [ErrorCode.DUPLICATE_RESOURCE]: 'Duplicate resource',
    [ErrorCode.BUSINESS_RULE_VIOLATION]: 'Business rule violation',
    [ErrorCode.INVALID_OPERATION]: 'Invalid operation',
    [ErrorCode.DATABASE_ERROR]: 'Database operation failed',
    [ErrorCode.CONNECTION_ERROR]: 'Database connection failed',
    [ErrorCode.QUERY_ERROR]: 'Database query failed',
    [ErrorCode.TRANSACTION_ERROR]: 'Database transaction failed',
    [ErrorCode.EXTERNAL_SERVICE_ERROR]: 'External service error',
    [ErrorCode.SERVICE_UNAVAILABLE]: 'Service unavailable',
    [ErrorCode.INTERNAL_SERVER_ERROR]: 'Internal server error',
    [ErrorCode.UNKNOWN_ERROR]: 'An unknown error occurred'
  };

  /**
   * Main error handler method
   * Converts any error to proper REST response
   */
  static handleError(error: unknown, req: Request, res: Response): void {
    const customError = this.convertToCustomError(error);
    const response = this.buildErrorResponse(customError, req);
    
    // Log error with appropriate level
    this.logError(customError, req);
    
    // Send response
    res.status(customError.statusCode).json(response);
  }

  /**
   * Convert any error to BaseCustomError
   */
  private static convertToCustomError(error: unknown): BaseCustomError {
    // If it's already a custom error, return it
    if (error instanceof BaseCustomError) {
      return error;
    }

    // If it's a standard Error, convert it
    if (error instanceof Error) {
      return this.convertStandardError(error);
    }

    // If it's an unknown type, wrap it
    return new UnknownError(
      'An unexpected error occurred',
      {
        originalError: String(error),
        type: typeof error
      }
    );
  }

  /**
   * Convert standard Error to appropriate BaseCustomError
   */
  private static convertStandardError(error: Error): BaseCustomError {
    const message = error.message.toLowerCase();

    // Storage-related errors (check first, as they're more specific)
    if (message.includes('storage') || message.includes('bucket') || message.includes('firebase storage') || message.includes('gcs')) {
      return new DatabaseError(error.message, {
        stack: error.stack,
        originalError: error.message
      });
    }

    // Database-related errors
    if (message.includes('firestore') || message.includes('database') || message.includes('connection')) {
      return new DatabaseError(error.message, {
        stack: error.stack
      });
    }

    // Validation errors
    if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
      return new ValidationError(error.message);
    }

    // Not found errors
    if (message.includes('not found') || message.includes('does not exist')) {
      if (message.includes('menu')) {
        return new MenuNotFoundError('unknown');
      }
      if (message.includes('item')) {
        return new ItemNotFoundError('unknown');
      }
      return new ResourceNotFoundError('Resource', 'unknown');
    }

    // Authentication/Authorization errors
    if (message.includes('unauthorized') || message.includes('permission')) {
      return new UnauthorizedError(error.message);
    }

    if (message.includes('forbidden') || message.includes('access denied')) {
      return new ForbiddenError(error.message);
    }

    // Business logic errors
    if (message.includes('business') || message.includes('rule') || message.includes('violation')) {
      return new BusinessRuleViolationError(error.message);
    }

    // Default to internal server error
    return new InternalServerError(error.message, {
      stack: error.stack
    });
  }

  /**
   * Build standardized error response
   */
  private static buildErrorResponse(error: BaseCustomError, req: Request): ApiResponse {
    const response: ApiResponse = {
      success: false,
      error: {
        code: error.errorCode,
        message: error.message, // Use the actual error message, not a generic one
        details: this.sanitizeErrorDetails(error.details),
        correlationId: error.details.correlationId,
        timestamp: error.details.timestamp
      },
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        requestId: this.generateRequestId(req)
      }
    };

    // Add helpful message for client - but preserve the actual error message
    if (this.shouldIncludeHelpfulMessage(error)) {
      // Include both the actual error and helpful context
      response.message = `${error.message}. ${this.getHelpfulMessage(error)}`;
    } else {
      // Still include the actual error message even if we don't add helpful context
      response.message = error.message;
    }

    return response;
  }

  /**
   * Sanitize error details to prevent sensitive data leakage
   */
  private static sanitizeErrorDetails(details: any): any {
    if (!details) return details;

    const sanitized = { ...details };
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'key', 'secret', 'private', 'credential'];
    Object.keys(sanitized).forEach(key => {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        delete sanitized[key];
      }
    });

    // Remove stack traces in production
    if (process.env.NODE_ENV === 'production') {
      delete sanitized.stack;
    }

    return sanitized;
  }

  /**
   * Determine if helpful message should be included
   */
  private static shouldIncludeHelpfulMessage(error: BaseCustomError): boolean {
    // Don't include helpful messages for 5xx errors in production
    if (process.env.NODE_ENV === 'production' && error.statusCode >= 500) {
      return false;
    }
    return true;
  }

  /**
   * Get helpful message for client
   */
  private static getHelpfulMessage(error: BaseCustomError): string {
    // Add specific suggestions based on error type
    switch (error.errorCode) {
      case ErrorCode.VALIDATION_ERROR:
        return 'Please check your input and try again.';
      case ErrorCode.MISSING_REQUIRED_FIELD:
        return `Please provide the required field: ${error.details.field}`;
      case ErrorCode.INVALID_FORMAT:
        return 'Please check the format of your input.';
      case ErrorCode.RESOURCE_NOT_FOUND:
        return 'Please verify the resource identifier.';
      case ErrorCode.UNAUTHORIZED:
        return 'Please authenticate and try again.';
      case ErrorCode.FORBIDDEN:
        return 'You don\'t have permission to perform this action.';
      case ErrorCode.DATABASE_ERROR:
        // Don't override the actual error message - let it show through
        return '';
      case ErrorCode.CONNECTION_ERROR:
        return 'Service temporarily unavailable. Please try again later.';
      default:
        return '';
    }
  }

  /**
   * Log error with appropriate level
   */
  private static logError(error: BaseCustomError, req: Request): void {
    const logData = {
      error: {
        name: error.name,
        message: error.message,
        code: error.errorCode,
        statusCode: error.statusCode,
        correlationId: error.details.correlationId,
        isOperational: error.isOperational,
        details: error.details
      },
      request: {
        method: req.method,
        url: req.url,
        headers: this.sanitizeHeaders(req.headers),
        body: this.sanitizeBody(req.body),
        query: req.query,
        params: req.params
      },
      timestamp: new Date().toISOString()
    };

    // Log based on error severity
    if (error.statusCode >= 500) {
      logger.error('Server error occurred', logData);
    } else if (error.statusCode >= 400) {
      logger.warn('Client error occurred', logData);
    } else {
      logger.info('Error occurred', logData);
    }
  }

  /**
   * Sanitize request headers
   */
  private static sanitizeHeaders(headers: any): any {
    if (!headers) return {};
    
    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
    
    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  /**
   * Sanitize request body
   */
  private static sanitizeBody(body: any): any {
    if (!body) return body;

    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'key', 'secret', 'private', 'credential'];
    
    Object.keys(sanitized).forEach(key => {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        sanitized[key] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  /**
   * Generate request ID for tracking
   */
  private static generateRequestId(req: Request): string {
    // Handle Firebase Functions request object structure
    const headers = req.headers || {};
    return headers['x-request-id'] as string || 
           `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Handle async function errors
   * Wraps async functions to catch and handle errors
   */
  static asyncHandler(fn: Function) {
    return (req: Request, res: Response, next: Function) => {
      Promise.resolve(fn(req, res, next)).catch((error) => {
        this.handleError(error, req, res);
      });
    };
  }

  /**
   * Create success response
   */
  static createSuccessResponse<T>(
    data: T, 
    message?: string, 
    statusCode: number = 200,
    req?: Request
  ): { statusCode: number; response: ApiResponse<T> } {
    return {
      statusCode,
      response: {
        success: true,
        message,
        data,
        metadata: {
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          requestId: req ? this.generateRequestId(req) : undefined
        }
      }
    };
  }
}
