/**
 * Application Monitoring and Observability
 * Provides metrics collection, health checks, and performance monitoring
 * Based on Prometheus metrics and OpenTelemetry standards
 */

import { ILogger, createLogger } from './logger';
import { serviceRegistry } from './service-registry';

export interface Metric {
  name: string;
  value: number;
  labels?: Record<string, string>;
  timestamp: number;
}

export interface HealthCheck {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  message?: string;
  duration: number;
  timestamp: number;
}

export class MonitoringService {
  private metrics: Metric[] = [];
  private healthChecks: Map<string, () => Promise<HealthCheck>> = new Map();
  private logger: ILogger;

  constructor() {
    this.logger = createLogger('MonitoringService');
    this.setupDefaultHealthChecks();
  }

  private setupDefaultHealthChecks(): void {
    this.registerHealthCheck('services', async () => {
      const start = Date.now();
      try {
        const health = serviceRegistry.getServiceHealth();
        const unhealthyCount = Object.values(health).filter(h => h.status === 'unhealthy').length;
        
        return {
          name: 'services',
          status: unhealthyCount === 0 ? 'healthy' : 'degraded',
          message: `${Object.keys(health).length - unhealthyCount}/${Object.keys(health).length} services healthy`,
          duration: Date.now() - start,
          timestamp: Date.now()
        };
      } catch (error) {
        return {
          name: 'services',
          status: 'unhealthy',
          message: (error as Error).message,
          duration: Date.now() - start,
          timestamp: Date.now()
        };
      }
    });

    this.registerHealthCheck('memory', async () => {
      const start = Date.now();
      try {
        // Basic memory usage check (browser environment)
        const memoryUsage = (performance as any).memory;
        const used = memoryUsage?.usedJSHeapSize || 0;
        const limit = memoryUsage?.jsHeapSizeLimit || Infinity;
        const percentage = (used / limit) * 100;

        return {
          name: 'memory',
          status: percentage > 90 ? 'unhealthy' : percentage > 70 ? 'degraded' : 'healthy',
          message: `Memory usage: ${percentage.toFixed(1)}%`,
          duration: Date.now() - start,
          timestamp: Date.now()
        };
      } catch (error) {
        return {
          name: 'memory',
          status: 'unhealthy',
          message: 'Unable to check memory usage',
          duration: Date.now() - start,
          timestamp: Date.now()
        };
      }
    });
  }

  /**
   * Record a metric
   */
  recordMetric(name: string, value: number, labels?: Record<string, string>): void {
    const metric: Metric = {
      name,
      value,
      labels,
      timestamp: Date.now()
    };

    this.metrics.push(metric);
    
    // Keep only last 1000 metrics in memory
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    this.logger.debug('Metric recorded', { metric });
  }

  /**
   * Increment a counter metric
   */
  incrementCounter(name: string, labels?: Record<string, string>): void {
    this.recordMetric(name, 1, labels);
  }

  /**
   * Record a timer metric
   */
  recordTimer(name: string, duration: number, labels?: Record<string, string>): void {
    this.recordMetric(`${name}_duration_ms`, duration, labels);
  }

  /**
   * Create a timer function
   */
  startTimer(name: string, labels?: Record<string, string>) {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      this.recordTimer(name, duration, labels);
      return duration;
    };
  }

  /**
   * Register a health check
   */
  registerHealthCheck(name: string, check: () => Promise<HealthCheck>): void {
    this.healthChecks.set(name, check);
    this.logger.info('Health check registered', { name });
  }

  /**
   * Run all health checks
   */
  async runHealthChecks(): Promise<HealthCheck[]> {
    const results: HealthCheck[] = [];
    
    for (const [name, check] of this.healthChecks) {
      try {
        const result = await check();
        results.push(result);
      } catch (error) {
        results.push({
          name,
          status: 'unhealthy',
          message: (error as Error).message,
          duration: 0,
          timestamp: Date.now()
        });
      }
    }

    return results;
  }

  /**
   * Get current metrics
   */
  getMetrics(): Metric[] {
    return [...this.metrics];
  }

  /**
   * Get metrics by name
   */
  getMetricsByName(name: string): Metric[] {
    return this.metrics.filter(m => m.name === name);
  }

  /**
   * Get system overview
   */
  async getSystemOverview() {
    const healthChecks = await this.runHealthChecks();
    const serviceMetrics = serviceRegistry.getServiceMetrics();
    
    return {
      health: {
        overall: healthChecks.every(h => h.status === 'healthy') ? 'healthy' : 
                healthChecks.some(h => h.status === 'unhealthy') ? 'unhealthy' : 'degraded',
        checks: healthChecks
      },
      services: serviceMetrics,
      metrics: {
        total: this.metrics.length,
        recent: this.metrics.filter(m => Date.now() - m.timestamp < 60000).length
      }
    };
  }
}

// Global monitoring service
export const monitoring = new MonitoringService();

// Decorator for automatic method monitoring
export function monitor(metricName?: string) {
  return function(target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const name = metricName || `${target.constructor.name}.${propertyName}`;

    descriptor.value = async function(...args: any[]) {
      const timer = monitoring.startTimer(name);
      monitoring.incrementCounter(`${name}_calls`);

      try {
        const result = await method.apply(this, args);
        monitoring.incrementCounter(`${name}_success`);
        timer();
        return result;
      } catch (error) {
        monitoring.incrementCounter(`${name}_error`);
        timer();
        throw error;
      }
    };

    return descriptor;
  };
}
