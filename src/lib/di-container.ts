
/**
 * Dependency Injection Container
 * Implements IoC pattern for loose coupling and testability
 * Based on Microsoft's .NET DI container design principles
 */

export type ServiceLifetime = 'singleton' | 'transient' | 'scoped';

export interface ServiceDescriptor<T = any> {
  token: string | symbol;
  factory: (container: DIContainer) => T;
  lifetime: ServiceLifetime;
  instance?: T;
}

export interface Injectable {
  readonly serviceToken: string | symbol;
}

export class DIContainer {
  private services = new Map<string | symbol, ServiceDescriptor>();
  private singletons = new Map<string | symbol, any>();
  private scoped = new Map<string | symbol, any>();

  /**
   * Register a service with the container
   */
  register<T>(
    token: string | symbol,
    factory: (container: DIContainer) => T,
    lifetime: ServiceLifetime = 'transient'
  ): DIContainer {
    this.services.set(token, { token, factory, lifetime });
    return this;
  }

  /**
   * Register a singleton service
   */
  registerSingleton<T>(
    token: string | symbol,
    factory: (container: DIContainer) => T
  ): DIContainer {
    return this.register(token, factory, 'singleton');
  }

  /**
   * Register a scoped service (new instance per scope)
   */
  registerScoped<T>(
    token: string | symbol,
    factory: (container: DIContainer) => T
  ): DIContainer {
    return this.register(token, factory, 'scoped');
  }

  /**
   * Resolve a service from the container
   */
  resolve<T>(token: string | symbol): T {
    const descriptor = this.services.get(token);
    if (!descriptor) {
      throw new Error(`Service not registered: ${String(token)}`);
    }

    switch (descriptor.lifetime) {
      case 'singleton':
        if (!this.singletons.has(token)) {
          this.singletons.set(token, descriptor.factory(this));
        }
        return this.singletons.get(token);

      case 'scoped':
        if (!this.scoped.has(token)) {
          this.scoped.set(token, descriptor.factory(this));
        }
        return this.scoped.get(token);

      case 'transient':
      default:
        return descriptor.factory(this);
    }
  }

  /**
   * Clear scoped services (useful for request boundaries)
   */
  clearScoped(): void {
    this.scoped.clear();
  }

  /**
   * Create a child container for scoped services
   */
  createScope(): DIContainer {
    const scope = new DIContainer();
    // Copy service registrations but not instances
    for (const [token, descriptor] of this.services) {
      scope.services.set(token, descriptor);
    }
    // Copy singletons (shared across scopes)
    for (const [token, instance] of this.singletons) {
      scope.singletons.set(token, instance);
    }
    return scope;
  }

  /**
   * Check if a service is registered
   */
  isRegistered(token: string | symbol): boolean {
    return this.services.has(token);
  }
}

// Service tokens for type safety
export const SERVICE_TOKENS = {
  LOGGER: Symbol('Logger'),
  TELEMETRY_SERVICE: Symbol('TelemetryService'),
  NOTIFICATION_SERVICE: Symbol('NotificationService'),
  DATABASE_SERVICE: Symbol('DatabaseService'),
  CONFIG_SERVICE: Symbol('ConfigService')
} as const;

// Global container instance
export const container = new DIContainer();
