
/**
 * Result pattern for consistent error handling across the application
 * Based on Rust's Result type and functional programming principles
 */
export type Result<T, E = AppError> = 
  | { success: true; data: T }
  | { success: false; error: E };

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }

  static validation(message: string, context?: Record<string, unknown>): AppError {
    return new AppError(message, 'VALIDATION_ERROR', 'medium', context);
  }

  static network(message: string, context?: Record<string, unknown>): AppError {
    return new AppError(message, 'NETWORK_ERROR', 'high', context);
  }

  static database(message: string, context?: Record<string, unknown>): AppError {
    return new AppError(message, 'DATABASE_ERROR', 'critical', context);
  }

  static notFound(resource: string, id: string): AppError {
    return new AppError(`${resource} not found`, 'NOT_FOUND', 'medium', { resource, id });
  }

  static unauthorized(action: string): AppError {
    return new AppError(`Unauthorized: ${action}`, 'UNAUTHORIZED', 'high', { action });
  }
}

// Utility functions for working with Results
export const Ok = <T>(data: T): Result<T> => ({ success: true, data });
export const Err = <E = AppError>(error: E): Result<never, E> => ({ success: false, error });

// Type guard to check if Result is successful
export function isOk<T, E>(result: Result<T, E>): result is { success: true; data: T } {
  return result.success;
}

// Type guard to check if Result is an error
export function isErr<T, E>(result: Result<T, E>): result is { success: false; error: E } {
  return !result.success;
}

export function mapResult<T, U, E>(
  result: Result<T, E>,
  fn: (data: T) => U
): Result<U, E> {
  if (isOk(result)) {
    return Ok(fn(result.data));
  } else {
    return result;
  }
}

export function flatMapResult<T, U, E>(
  result: Result<T, E>,
  fn: (data: T) => Result<U, E>
): Result<U, E> {
  if (isOk(result)) {
    return fn(result.data);
  } else {
    return result;
  }
}
