
import { Result, ErrorConstraint } from '@/types/result';

/**
 * Legacy service interface - preserved for backward compatibility
 * New services should extend AbstractService from BaseService.ts
 * @deprecated Use CrudService or ReadOnlyService from BaseService.ts instead
 */
export interface ServiceBase<TEntity, TId> {
  findById(id: TId): Promise<Result<TEntity>>;
  create(entity: Omit<TEntity, 'id'>): Promise<Result<TEntity>>;
  update(id: TId, updates: Partial<TEntity>): Promise<Result<TEntity>>;
  delete(id: TId): Promise<Result<void>>;
}

/**
 * Legacy read-only service interface
 * @deprecated Use ReadOnlyService from BaseService.ts instead
 */
export interface ReadOnlyService<TEntity, TId> {
  findById(id: TId): Promise<Result<TEntity>>;
  findAll(): Promise<Result<TEntity[]>>;
}

/**
 * Legacy service configuration
 * @deprecated Use ServiceConfig from BaseService.ts instead
 */
export interface ServiceConfig {
  retryAttempts?: number;
  timeoutMs?: number;
  enableLogging?: boolean;
}

/**
 * Legacy service metadata
 * @deprecated Use ServiceMetadata from BaseService.ts instead
 */
export interface ServiceMetadata {
  timestamp: Date;
  requestId?: string;
  version: string;
}
