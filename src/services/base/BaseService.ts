
import { Result } from '@/types/result';
import { ServiceError } from './ServiceError';

/**
 * Base service interface ensuring consistency across all service implementations
 * Following Clean Architecture and SOLID principles
 */
export interface BaseService {
  readonly serviceName: string;
}

/**
 * Standard service configuration interface
 * Based on enterprise patterns for service configuration
 */
export interface ServiceConfig {
  retryAttempts?: number;
  timeoutMs?: number;
  enableLogging?: boolean;
}

/**
 * Service operation metadata for observability
 * Following Google SRE practices for service monitoring
 */
export interface ServiceMetadata {
  timestamp: Date;
  requestId?: string;
  version: string;
  service: string;
}

/**
 * Abstract base class for all services with common patterns
 * Implements error handling and logging consistently
 */
export abstract class AbstractService implements BaseService {
  abstract readonly serviceName: string;

  protected config: ServiceConfig;

  constructor(config: ServiceConfig = {}) {
    this.config = {
      retryAttempts: 3,
      timeoutMs: 5000,
      enableLogging: true,
      ...config
    };
  }

  protected log(level: 'info' | 'warn' | 'error', message: string, context?: Record<string, unknown>): void {
    if (this.config.enableLogging) {
      console[level](`[${this.serviceName}] ${message}`, context);
    }
  }

  protected createError(message: string, code: string, context?: Record<string, unknown>): ServiceError {
    return new ServiceError(message, code, this.serviceName, 'medium', context);
  }

  protected createMetadata(requestId?: string): ServiceMetadata {
    return {
      timestamp: new Date(),
      requestId,
      version: '1.0.0', // This should come from app config
      service: this.serviceName
    };
  }
}
