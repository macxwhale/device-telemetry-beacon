
/**
 * Service Registry and Configuration
 * Centralizes service dependencies and provides clear boundaries
 * Implements service locator pattern with dependency injection
 */

import { container, SERVICE_TOKENS } from './di-container';
import { createLogger, ILogger } from './logger';
import { ServiceConfig } from '@/services/base/BaseService';

// Service layer boundaries
export const LAYERS = {
  PRESENTATION: 'presentation',
  APPLICATION: 'application', 
  DOMAIN: 'domain',
  INFRASTRUCTURE: 'infrastructure'
} as const;

export type LayerType = typeof LAYERS[keyof typeof LAYERS];

// Service registration with layer enforcement
export interface ServiceRegistration {
  layer: LayerType;
  dependencies: (string | symbol)[];
  config?: ServiceConfig;
}

export class ServiceRegistry {
  private registrations = new Map<string | symbol, ServiceRegistration>();
  private logger: ILogger;

  constructor() {
    this.logger = createLogger('ServiceRegistry');
    this.setupCoreServices();
  }

  private setupCoreServices(): void {
    // Register core infrastructure services
    container.registerSingleton(SERVICE_TOKENS.LOGGER, () => createLogger('core'));
    
    container.registerSingleton(SERVICE_TOKENS.CONFIG_SERVICE, () => ({
      get: (key: string, defaultValue?: any) => {
        // Configuration service implementation
        return process.env[key] || defaultValue;
      },
      getRequired: (key: string) => {
        const value = process.env[key];
        if (!value) {
          throw new Error(`Required configuration missing: ${key}`);
        }
        return value;
      }
    }));

    this.logger.info('Core services registered', { 
      services: Object.keys(SERVICE_TOKENS) 
    });
  }

  /**
   * Register a service with layer validation
   */
  registerService<T>(
    token: string | symbol,
    factory: () => T,
    registration: ServiceRegistration
  ): void {
    // Validate dependencies exist and respect layer boundaries
    this.validateDependencies(token, registration);
    
    container.registerSingleton(token, factory);
    this.registrations.set(token, registration);
    
    this.logger.info('Service registered', {
      token: String(token),
      layer: registration.layer,
      dependencies: registration.dependencies.map(String)
    });
  }

  /**
   * Validate service dependencies respect layer boundaries
   */
  private validateDependencies(
    token: string | symbol,
    registration: ServiceRegistration
  ): void {
    const layerHierarchy = [
      LAYERS.INFRASTRUCTURE,
      LAYERS.DOMAIN,
      LAYERS.APPLICATION,
      LAYERS.PRESENTATION
    ];

    const currentLayerIndex = layerHierarchy.indexOf(registration.layer);

    for (const dependency of registration.dependencies) {
      const depRegistration = this.registrations.get(dependency);
      if (!depRegistration) {
        this.logger.warn('Dependency not found', {
          service: String(token),
          dependency: String(dependency)
        });
        continue;
      }

      const depLayerIndex = layerHierarchy.indexOf(depRegistration.layer);
      
      // Services can only depend on services in lower layers
      if (depLayerIndex > currentLayerIndex) {
        throw new Error(
          `Layer boundary violation: ${registration.layer} service cannot depend on ${depRegistration.layer} service`
        );
      }
    }
  }

  /**
   * Get service health status
   */
  getServiceHealth(): Record<string, { status: 'healthy' | 'unhealthy'; layer: LayerType }> {
    const health: Record<string, { status: 'healthy' | 'unhealthy'; layer: LayerType }> = {};
    
    for (const [token, registration] of this.registrations) {
      try {
        container.resolve(token);
        health[String(token)] = { status: 'healthy', layer: registration.layer };
      } catch (error) {
        health[String(token)] = { status: 'unhealthy', layer: registration.layer };
        this.logger.error('Service health check failed', error as Error, {
          service: String(token)
        });
      }
    }
    
    return health;
  }

  /**
   * Create monitoring metrics for services
   */
  getServiceMetrics() {
    return {
      registeredServices: this.registrations.size,
      servicesByLayer: this.getServicesByLayer(),
      dependencyGraph: this.getDependencyGraph()
    };
  }

  private getServicesByLayer() {
    const byLayer: Record<LayerType, number> = {
      [LAYERS.PRESENTATION]: 0,
      [LAYERS.APPLICATION]: 0,
      [LAYERS.DOMAIN]: 0,
      [LAYERS.INFRASTRUCTURE]: 0,
    };

    for (const registration of this.registrations.values()) {
      byLayer[registration.layer]++;
    }

    return byLayer;
  }

  private getDependencyGraph() {
    const graph: Record<string, string[]> = {};
    
    for (const [token, registration] of this.registrations) {
      graph[String(token)] = registration.dependencies.map(String);
    }
    
    return graph;
  }
}

// Global service registry instance
export const serviceRegistry = new ServiceRegistry();
