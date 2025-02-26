/**
 * Enum for categorizing errors for analytics and reporting
 */
export enum ErrorCategory {
  // Input validation errors
  VALIDATION = 'validation',
  
  // Authentication and authorization errors
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  
  // Resource-related errors
  RESOURCE_NOT_FOUND = 'resource_not_found',
  RESOURCE_CONFLICT = 'resource_conflict',
  
  // Business logic errors
  BUSINESS_LOGIC = 'business_logic',
  
  // External service errors
  EXTERNAL_SERVICE = 'external_service',
  NETWORK = 'network',
  
  // Database errors
  DATABASE = 'database',
  
  // System errors
  SYSTEM = 'system',
  UNEXPECTED = 'unexpected',
  
  // Performance errors
  TIMEOUT = 'timeout',
  RATE_LIMIT = 'rate_limit',
  
  // Configuration errors
  CONFIGURATION = 'configuration',
} 