/**
 * Error Handling Module - Centralized error management
 * Exports all error-related classes and utilities
 */

// Custom Error Classes
export * from './custom-errors';

// Error Handler
export * from './error-handler';

// Re-export commonly used types for convenience
export type { ApiResponse } from './error-handler';
export type { ErrorDetails } from './custom-errors';
