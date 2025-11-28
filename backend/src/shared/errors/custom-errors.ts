/**
 * Custom Error Classes - Follows Clean Architecture
 * Provides structured error handling with proper HTTP status codes
 */

export enum ErrorCode {
  // Validation Errors (400)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  
  // Authentication/Authorization Errors (401, 403)
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  
  // Not Found Errors (404)
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  MENU_NOT_FOUND = 'MENU_NOT_FOUND',
  ITEM_NOT_FOUND = 'ITEM_NOT_FOUND',
  PLACE_NOT_FOUND = 'PLACE_NOT_FOUND',
  
  // Conflict Errors (409)
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  DUPLICATE_RESOURCE = 'DUPLICATE_RESOURCE',
  
  // Business Logic Errors (422)
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  INVALID_OPERATION = 'INVALID_OPERATION',
  
  // Database Errors (500)
  DATABASE_ERROR = 'DATABASE_ERROR',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  QUERY_ERROR = 'QUERY_ERROR',
  TRANSACTION_ERROR = 'TRANSACTION_ERROR',
  
  // External Service Errors (502, 503)
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  
  // Generic Errors (500)
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface ErrorDetails {
  field?: string;
  value?: unknown;
  constraint?: string;
  suggestion?: string;
  correlationId?: string;
  timestamp?: string;
  stack?: string;
  originalError?: string;
  type?: string;
}

/**
 * Base Custom Error Class
 * All custom errors extend this class
 */
export abstract class BaseCustomError extends Error {
  public readonly errorCode: ErrorCode;
  public readonly statusCode: number;
  public readonly details: ErrorDetails;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    errorCode: ErrorCode,
    statusCode: number,
    details: ErrorDetails = {},
    isOperational: boolean = true
  ) {
    super(message);
    
    this.name = this.constructor.name;
    this.errorCode = errorCode;
    this.statusCode = statusCode;
    this.details = {
      ...details,
      timestamp: new Date().toISOString(),
      correlationId: this.generateCorrelationId()
    };
    this.isOperational = isOperational;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  private generateCorrelationId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      errorCode: this.errorCode,
      statusCode: this.statusCode,
      details: this.details,
      isOperational: this.isOperational,
      stack: this.stack
    };
  }
}

/**
 * Validation Error - 400 Bad Request
 * Used for input validation failures
 */
export class ValidationError extends BaseCustomError {
  constructor(message: string, details: ErrorDetails = {}) {
    super(message, ErrorCode.VALIDATION_ERROR, 400, details);
  }
}

/**
 * Invalid Input Error - 400 Bad Request
 * Used for malformed input data
 */
export class InvalidInputError extends BaseCustomError {
  constructor(message: string, details: ErrorDetails = {}) {
    super(message, ErrorCode.INVALID_INPUT, 400, details);
  }
}

/**
 * Missing Required Field Error - 400 Bad Request
 * Used when required fields are missing
 */
export class MissingRequiredFieldError extends BaseCustomError {
  constructor(field: string, details: ErrorDetails = {}) {
    super(`Missing required field: ${field}`, ErrorCode.MISSING_REQUIRED_FIELD, 400, {
      ...details,
      field
    });
  }
}

/**
 * Invalid Format Error - 400 Bad Request
 * Used for format validation failures
 */
export class InvalidFormatError extends BaseCustomError {
  constructor(message: string, details: ErrorDetails = {}) {
    super(message, ErrorCode.INVALID_FORMAT, 400, details);
  }
}

/**
 * Unauthorized Error - 401 Unauthorized
 * Used for authentication failures
 */
export class UnauthorizedError extends BaseCustomError {
  constructor(message: string = 'Unauthorized access', details: ErrorDetails = {}) {
    super(message, ErrorCode.UNAUTHORIZED, 401, details);
  }
}

/**
 * Forbidden Error - 403 Forbidden
 * Used for authorization failures
 */
export class ForbiddenError extends BaseCustomError {
  constructor(message: string = 'Access forbidden', details: ErrorDetails = {}) {
    super(message, ErrorCode.FORBIDDEN, 403, details);
  }
}

/**
 * Resource Not Found Error - 404 Not Found
 * Used when requested resource doesn't exist
 */
export class ResourceNotFoundError extends BaseCustomError {
  constructor(resourceType: string, identifier: string, details: ErrorDetails = {}) {
    super(`${resourceType} not found: ${identifier}`, ErrorCode.RESOURCE_NOT_FOUND, 404, {
      ...details,
      field: 'identifier',
      value: identifier
    });
  }
}

/**
 * Menu Not Found Error - 404 Not Found
 * Specific error for menu-related not found cases
 */
export class MenuNotFoundError extends BaseCustomError {
  constructor(placeId: string, details: ErrorDetails = {}) {
    super(`Menu not found for place ID: ${placeId}`, ErrorCode.MENU_NOT_FOUND, 404, {
      ...details,
      field: 'placeId',
      value: placeId
    });
  }
}

/**
 * Item Not Found Error - 404 Not Found
 * Specific error for item-related not found cases
 */
export class ItemNotFoundError extends BaseCustomError {
  constructor(itemId: string, details: ErrorDetails = {}) {
    super(`Item not found: ${itemId}`, ErrorCode.ITEM_NOT_FOUND, 404, {
      ...details,
      field: 'itemId',
      value: itemId
    });
  }
}

/**
 * Resource Already Exists Error - 409 Conflict
 * Used when trying to create a resource that already exists
 */
export class ResourceAlreadyExistsError extends BaseCustomError {
  constructor(resourceType: string, identifier: string, details: ErrorDetails = {}) {
    super(`${resourceType} already exists: ${identifier}`, ErrorCode.RESOURCE_ALREADY_EXISTS, 409, {
      ...details,
      field: 'identifier',
      value: identifier
    });
  }
}

/**
 * Business Rule Violation Error - 422 Unprocessable Entity
 * Used for business logic violations
 */
export class BusinessRuleViolationError extends BaseCustomError {
  constructor(message: string, details: ErrorDetails = {}) {
    super(message, ErrorCode.BUSINESS_RULE_VIOLATION, 422, details);
  }
}

/**
 * Invalid Operation Error - 422 Unprocessable Entity
 * Used for operations that are not allowed
 */
export class InvalidOperationError extends BaseCustomError {
  constructor(message: string, details: ErrorDetails = {}) {
    super(message, ErrorCode.INVALID_OPERATION, 422, details);
  }
}

/**
 * Database Error - 500 Internal Server Error
 * Used for database operation failures
 */
export class DatabaseError extends BaseCustomError {
  constructor(message: string, details: ErrorDetails = {}) {
    super(message, ErrorCode.DATABASE_ERROR, 500, details);
  }
}

/**
 * Connection Error - 500 Internal Server Error
 * Used for database connection failures
 */
export class ConnectionError extends BaseCustomError {
  constructor(message: string, details: ErrorDetails = {}) {
    super(message, ErrorCode.CONNECTION_ERROR, 500, details);
  }
}

/**
 * External Service Error - 502 Bad Gateway
 * Used for external service failures
 */
export class ExternalServiceError extends BaseCustomError {
  constructor(serviceName: string, message: string, details: ErrorDetails = {}) {
    super(`External service error (${serviceName}): ${message}`, ErrorCode.EXTERNAL_SERVICE_ERROR, 502, {
      ...details,
      field: 'serviceName',
      value: serviceName
    });
  }
}

/**
 * Service Unavailable Error - 503 Service Unavailable
 * Used when service is temporarily unavailable
 */
export class ServiceUnavailableError extends BaseCustomError {
  constructor(message: string = 'Service temporarily unavailable', details: ErrorDetails = {}) {
    super(message, ErrorCode.SERVICE_UNAVAILABLE, 503, details);
  }
}

/**
 * Internal Server Error - 500 Internal Server Error
 * Used for unexpected server errors
 */
export class InternalServerError extends BaseCustomError {
  constructor(message: string = 'Internal server error', details: ErrorDetails = {}) {
    super(message, ErrorCode.INTERNAL_SERVER_ERROR, 500, details, false);
  }
}

/**
 * Unknown Error - 500 Internal Server Error
 * Used for completely unexpected errors
 */
export class UnknownError extends BaseCustomError {
  constructor(message: string = 'An unknown error occurred', details: ErrorDetails = {}) {
    super(message, ErrorCode.UNKNOWN_ERROR, 500, details, false);
  }
}
