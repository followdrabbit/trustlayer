/**
 * Service Registry for decoupling service providers from consumers.
 * Modules can register services (like 'RiskService') that others can consume.
 */

class ServiceRegistryImpl {
  private services: Map<string, any> = new Map();

  /**
   * Register a service implementation.
   * @param name The unique name of the service interface
   * @param service The service instance
   */
  register<T>(name: string, service: T): void {
    if (this.services.has(name)) {
      console.warn(`Service '${name}' is already registered. Overwriting.`);
    }
    this.services.set(name, service);
  }

  /**
   * Retrieve a service by name.
   * @param name The service name
   */
  get<T>(name: string): T | undefined {
    return this.services.get(name);
  }
}

export const ServiceRegistry = new ServiceRegistryImpl();