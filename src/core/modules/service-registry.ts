/**
 * Service Registry
 * Central registry for module services
 */

import type { ServiceDefinition } from './types';

export class ServiceRegistry {
  private services = new Map<string, ServiceDefinition>();

  /**
   * Register a service
   */
  register<T = any>(definition: ServiceDefinition<T>): void {
    const key = this.getServiceKey(definition.name, definition.module);

    if (this.services.has(key)) {
      console.warn(
        `Service "${definition.name}" from module "${definition.module}" is already registered. Overwriting.`
      );
    }

    this.services.set(key, definition);
  }

  /**
   * Unregister a service
   */
  unregister(name: string, module: string): boolean {
    const key = this.getServiceKey(name, module);
    return this.services.delete(key);
  }

  /**
   * Get a service
   */
  get<T = any>(name: string, module?: string): T {
    // If module is specified, get exact service
    if (module) {
      const key = this.getServiceKey(name, module);
      const definition = this.services.get(key);

      if (!definition) {
        throw new Error(`Service "${name}" from module "${module}" not found`);
      }

      return definition.service as T;
    }

    // Otherwise, find first service with this name
    for (const [key, definition] of this.services.entries()) {
      if (definition.name === name) {
        return definition.service as T;
      }
    }

    throw new Error(`Service "${name}" not found in any module`);
  }

  /**
   * Try to get a service (returns undefined if not found)
   */
  tryGet<T = any>(name: string, module?: string): T | undefined {
    try {
      return this.get<T>(name, module);
    } catch {
      return undefined;
    }
  }

  /**
   * Check if service exists
   */
  has(name: string, module?: string): boolean {
    if (module) {
      const key = this.getServiceKey(name, module);
      return this.services.has(key);
    }

    for (const definition of this.services.values()) {
      if (definition.name === name) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get all services from a module
   */
  getModuleServices(module: string): ServiceDefinition[] {
    const services: ServiceDefinition[] = [];

    for (const definition of this.services.values()) {
      if (definition.module === module) {
        services.push(definition);
      }
    }

    return services;
  }

  /**
   * Get all service names
   */
  getServiceNames(): string[] {
    const names = new Set<string>();

    for (const definition of this.services.values()) {
      names.add(definition.name);
    }

    return Array.from(names);
  }

  /**
   * Get all services
   */
  getAllServices(): ServiceDefinition[] {
    return Array.from(this.services.values());
  }

  /**
   * Clear all services from a module
   */
  clearModule(module: string): void {
    const keys: string[] = [];

    for (const [key, definition] of this.services.entries()) {
      if (definition.module === module) {
        keys.push(key);
      }
    }

    for (const key of keys) {
      this.services.delete(key);
    }
  }

  /**
   * Clear all services
   */
  clear(): void {
    this.services.clear();
  }

  /**
   * Get service key
   */
  private getServiceKey(name: string, module: string): string {
    return `${module}:${name}`;
  }
}

// Singleton instance
export const serviceRegistry = new ServiceRegistry();
