
import { AppError, ErrorConstraint } from '@/types/result';

/**
 * Service-specific error types following domain-driven design principles
 * Based on Google's error handling guidelines with proper inheritance
 */
export class ServiceError extends AppError {
  constructor(
    message: string,
    code: string,
    public readonly service: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    context?: Record<string, unknown>
  ) {
    super(message, code, severity, { ...context, service });
    this.name = 'ServiceError';
  }

  // Service-specific factory methods with proper parameter alignment
  static database(service: string, message: string, context?: Record<string, unknown>): ServiceError {
    return new ServiceError(message, 'DATABASE_ERROR', service, 'critical', context);
  }

  static validation(service: string, message: string, context?: Record<string, unknown>): ServiceError {
    return new ServiceError(message, 'VALIDATION_ERROR', service, 'medium', context);
  }

  static notFound(service: string, resource: string, id: string): ServiceError {
    return new ServiceError(
      `${resource} not found`, 
      'NOT_FOUND', 
      service, 
      'medium', 
      { resource, id }
    );
  }

  static unauthorized(service: string, action: string): ServiceError {
    return new ServiceError(
      `Unauthorized: ${action}`, 
      'UNAUTHORIZED', 
      service, 
      'high', 
      { action }
    );
  }

  static timeout(service: string, operation: string, timeoutMs: number): ServiceError {
    return new ServiceError(
      `Operation timeout: ${operation}`,
      'TIMEOUT',
      service,
      'high',
      { operation, timeoutMs }
    );
  }

  static rateLimit(service: string, limit: number, window: string): ServiceError {
    return new ServiceError(
      `Rate limit exceeded: ${limit} requests per ${window}`,
      'RATE_LIMIT_EXCEEDED',
      service,
      'medium',
      { limit, window }
    );
  }
}

// Type-safe error classification for better error handling
export const isServiceError = (error: ErrorConstraint): error is ServiceError => {
  return error instanceof ServiceError;
};

export const isAppError = (error: ErrorConstraint): error is AppError => {
  return error instanceof AppError;
};

// Error severity helpers for consistent logging and monitoring
export const getErrorSeverityLevel = (error: ErrorConstraint): number => {
  if (!(error instanceof AppError)) return 1;
  
  switch (error.severity) {
    case 'low': return 1;
    case 'medium': return 2;
    case 'high': return 3;
    case 'critical': return 4;
    default: return 2;
  }
};
