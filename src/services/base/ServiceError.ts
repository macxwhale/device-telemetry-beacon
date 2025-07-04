
import { AppError } from '@/types/result';

/**
 * Service-specific error types following domain-driven design principles
 * Based on Google's error handling guidelines
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
}
