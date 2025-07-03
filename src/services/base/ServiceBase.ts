
import { Result } from '@/types/result';

/**
 * Base interface for all services to ensure consistency
 * Based on domain-driven design principles
 */
export interface ServiceBase<TEntity, TId> {
  findById(id: TId): Promise<Result<TEntity>>;
  create(entity: Omit<TEntity, 'id'>): Promise<Result<TEntity>>;
  update(id: TId, updates: Partial<TEntity>): Promise<Result<TEntity>>;
  delete(id: TId): Promise<Result<void>>;
}

/**
 * Base interface for read-only services
 */
export interface ReadOnlyService<TEntity, TId> {
  findById(id: TId): Promise<Result<TEntity>>;
  findAll(): Promise<Result<TEntity[]>>;
}

/**
 * Configuration for service operations
 */
export interface ServiceConfig {
  retryAttempts?: number;
  timeoutMs?: number;
  enableLogging?: boolean;
}

/**
 * Standard service response metadata
 */
export interface ServiceMetadata {
  timestamp: Date;
  requestId?: string;
  version: string;
}
