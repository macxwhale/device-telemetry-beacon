
/**
 * Structured Logging System
 * Implements observability patterns for monitoring and debugging
 * Based on Google's Cloud Logging and OpenTelemetry standards
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';
export type LogContext = Record<string, unknown>;

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  context?: LogContext;
  traceId?: string;
  spanId?: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export interface ILogger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, error?: Error, context?: LogContext): void;
  fatal(message: string, error?: Error, context?: LogContext): void;
  child(defaultContext: LogContext): ILogger;
}

export class StructuredLogger implements ILogger {
  constructor(
    private service: string,
    private defaultContext: LogContext = {},
    private minLevel: LogLevel = 'info'
  ) {}

  private shouldLog(level: LogLevel): boolean {
    const levels = ['debug', 'info', 'warn', 'error', 'fatal'];
    return levels.indexOf(level) >= levels.indexOf(this.minLevel);
  }

  private formatError(error: Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.service,
      context: { ...this.defaultContext, ...context },
      traceId: this.generateTraceId(),
      error: error ? this.formatError(error) : undefined
    };

    // In production, this would send to your logging service
    // For now, we'll use console with structured format
    const output = JSON.stringify(entry, null, 2);
    
    switch (level) {
      case 'debug':
        console.debug(output);
        break;
      case 'info':
        console.info(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      case 'error':
      case 'fatal':
        console.error(output);
        break;
    }
  }

  private generateTraceId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.log('error', message, context, error);
  }

  fatal(message: string, error?: Error, context?: LogContext): void {
    this.log('fatal', message, context, error);
  }

  child(defaultContext: LogContext): ILogger {
    return new StructuredLogger(
      this.service,
      { ...this.defaultContext, ...defaultContext },
      this.minLevel
    );
  }
}

// Factory function for creating service-specific loggers
export const createLogger = (service: string, context?: LogContext): ILogger => {
  return new StructuredLogger(service, context);
};

// Global logger instance
export const logger = createLogger('application');
