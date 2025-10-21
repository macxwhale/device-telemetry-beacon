
/**
 * Result pattern for consistent error handling across the application
 * Based on Rust's Result type and functional programming principles
 * Following Google's TypeScript style guide for generic constraints
 */

// Constrained error type to ensure proper inheritance hierarchy
export type ErrorConstraint = Error | AppError;

export type Result<T, E extends ErrorConstraint = AppError> = 
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

// Utility functions for working with Results with proper generic constraints
export const Ok = <T>(data: T): Result<T, never> => ({ success: true, data });
export const Err = <E extends ErrorConstraint>(error: E): Result<never, E> => ({ success: false, error });

// Type guards with strengthened constraints
export function isOk<T, E extends ErrorConstraint>(result: Result<T, E>): result is { success: true; data: T } {
  return result.success;
}

export function isErr<T, E extends ErrorConstraint>(result: Result<T, E>): result is { success: false; error: E } {
  return !result.success;
}

// Fixed mapResult with proper generic bounds and type preservation
export function mapResult<T, U, E extends ErrorConstraint>(
  result: Result<T, E>,
  fn: (data: T) => U
): Result<U, E> {
  if (isOk(result)) {
    return Ok(fn(result.data));
  }
  // Preserve original error type through proper casting
  return result as Result<U, E>;
}

export function flatMapResult<T, U, E extends ErrorConstraint>(
  result: Result<T, E>,
  fn: (data: T) => Result<U, E>
): Result<U, E> {
  if (isOk(result)) {
    return fn(result.data);
  }
  // Preserve original error type through proper casting
  return result as Result<U, E>;
}

// Enhanced utility functions with proper error type constraints
export function mapError<T, E1 extends ErrorConstraint, E2 extends ErrorConstraint>(
  result: Result<T, E1>,
  fn: (error: E1) => E2
): Result<T, E2> {
  if (isErr(result)) {
    return Err(fn(result.error));
  }
  return Ok(result.data);
}

export function unwrapOr<T, E extends ErrorConstraint>(result: Result<T, E>, defaultValue: T): T {
  return isOk(result) ? result.data : defaultValue;
}

export function unwrapOrElse<T, E extends ErrorConstraint>(
  result: Result<T, E>, 
  fn: (error: E) => T
): T {
  return isOk(result) ? result.data : fn(result.error);
}

// Combine multiple results
export function combineResults<T extends ErrorConstraint>(
  results: Result<T>[]
): Result<T[], AppError> {
  const errors: ErrorConstraint[] = [];
  const values: T[] = [];

  for (const result of results) {
    if (isErr(result)) {
      errors.push(result.error);
    } else {
      values.push(result.data);
    }
  }

  if (errors.length > 0) {
    const firstError = errors[0];
    const appError = firstError instanceof AppError 
      ? firstError 
      : new AppError(firstError.message, 'UNKNOWN_ERROR', 'medium');
    return { success: false, error: appError };
  }

  return { success: true, data: values };
}

// New: Chain multiple fallible operations
export function chain<T, U, V, E extends ErrorConstraint>(
  result: Result<T, E>,
  ...operations: Array<(value: any) => Result<any, E>>
): Result<V, E> {
  return operations.reduce(
    (acc, operation) => flatMapResult(acc, operation),
    result
  ) as Result<V, E>;
}
