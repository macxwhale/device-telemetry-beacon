
import { Result, ErrorConstraint } from '@/types/result';
import { ServiceError } from './ServiceError';

/**
 * Type-safe service interface contracts ensuring consistency across all implementations
 * Following Clean Architecture and SOLID principles with strengthened type constraints
 */
export interface BaseService {
  readonly serviceName: string;
}

/**
 * Enhanced service configuration with validation
 */
export interface ServiceConfig {
  retryAttempts?: number;
  timeoutMs?: number;
  enableLogging?: boolean;
  enableMetrics?: boolean;
  rateLimitConfig?: {
    maxRequests: number;
    windowMs: number;
  };
}

/**
 * Service operation metadata for enhanced observability
 * Following Google SRE practices for service monitoring
 */
export interface ServiceMetadata {
  timestamp: Date;
  requestId?: string;
  version: string;
  service: string;
  operation?: string;
  duration?: number;
}

/**
 * Service operation result with rich context
 */
export interface ServiceResult<T, E extends ErrorConstraint = ServiceError> {
  result: Result<T, E>;
  metadata: ServiceMetadata;
}

/**
 * Abstract base class for all services with consistent error handling patterns
 * Implements observability and configuration management
 */
export abstract class AbstractService implements BaseService {
  abstract readonly serviceName: string;

  protected config: Required<ServiceConfig>;

  constructor(config: ServiceConfig = {}) {
    this.config = {
      retryAttempts: 3,
      timeoutMs: 5000,
      enableLogging: true,
      enableMetrics: false,
      rateLimitConfig: {
        maxRequests: 100,
        windowMs: 60000
      },
      ...config
    };
  }

  protected log(
    level: 'info' | 'warn' | 'error' | 'debug', 
    message: string, 
    context?: Record<string, unknown>
  ): void {
    if (this.config.enableLogging) {
      console[level === 'debug' ? 'log' : level](
        `[${this.serviceName}] ${message}`, 
        context
      );
    }
  }

  protected createError(
    message: string, 
    code: string, 
    context?: Record<string, unknown>
  ): ServiceError {
    return new ServiceError(message, code, this.serviceName, 'medium', context);
  }

  protected createMetadata(requestId?: string, operation?: string): ServiceMetadata {
    return {
      timestamp: new Date(),
      requestId,
      version: '1.0.0', // Should come from app config
      service: this.serviceName,
      operation
    };
  }

  // Template method for consistent operation execution with error handling
  protected async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    requestId?: string
  ): Promise<ServiceResult<T, ServiceError>> {
    const startTime = Date.now();
    const metadata = this.createMetadata(requestId, operationName);
    let lastError: ServiceError | undefined;

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        this.log('debug', `Executing ${operationName} (attempt ${attempt})`, { requestId });
        
        const result = await this.withTimeout(operation(), this.config.timeoutMs);
        
        metadata.duration = Date.now() - startTime;
        this.log('info', `${operationName} completed successfully`, { 
          requestId, 
          duration: metadata.duration,
          attempt 
        });

        return {
          result: { success: true, data: result },
          metadata
        };

      } catch (error) {
        const serviceError = error instanceof ServiceError 
          ? error 
          : this.createError(
              `${operationName} failed: ${(error as Error).message}`,
              'OPERATION_FAILED',
              { originalError: error, attempt, requestId }
            );

        lastError = serviceError;
        
        if (attempt < this.config.retryAttempts) {
          this.log('warn', `${operationName} failed, retrying...`, { 
            error: serviceError.message, 
            attempt, 
            requestId 
          });
          
          // Exponential backoff
          await this.delay(Math.pow(2, attempt) * 100);
        }
      }
    }

    metadata.duration = Date.now() - startTime;
    this.log('error', `${operationName} failed after all retries`, { 
      error: lastError?.message, 
      duration: metadata.duration,
      requestId 
    });

    return {
      result: { success: false, error: lastError! },
      metadata
    };
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(
        ServiceError.timeout(this.serviceName, 'operation', timeoutMs)
      ), timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Type-safe service interface for CRUD operations
 */
export interface CrudService<TEntity, TId, TError extends ErrorConstraint = ServiceError> extends BaseService {
  findById(id: TId): Promise<Result<TEntity, TError>>;
  create(entity: Omit<TEntity, 'id'>): Promise<Result<TEntity, TError>>;
  update(id: TId, updates: Partial<TEntity>): Promise<Result<TEntity, TError>>;
  delete(id: TId): Promise<Result<void, TError>>;
}

/**
 * Type-safe read-only service interface
 */
export interface ReadOnlyService<TEntity, TId, TError extends ErrorConstraint = ServiceError> extends BaseService {
  findById(id: TId): Promise<Result<TEntity, TError>>;
  findAll(): Promise<Result<TEntity[], TError>>;
}
