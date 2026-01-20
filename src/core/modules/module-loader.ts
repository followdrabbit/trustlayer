/**
 * Module Loader
 * Dynamically loads and manages modules
 */

import type {
  ModuleManifest,
  ModuleInstance,
  ModuleLoaderOptions,
  Permission,
} from './types';
import { eventBus, EventTypes } from './event-bus';
import { serviceRegistry } from './service-registry';

export class ModuleLoader {
  private modules = new Map<string, ModuleInstance>();
  private permissionChecker?: (permissions: Permission[]) => boolean;

  /**
   * Set permission checker function
   */
  setPermissionChecker(checker: (permissions: Permission[]) => boolean): void {
    this.permissionChecker = checker;
  }

  /**
   * Load a module
   */
  async loadModule(
    moduleId: string,
    options: ModuleLoaderOptions = {}
  ): Promise<ModuleInstance> {
    const {
      autoActivate = true,
      validatePermissions = true,
      validateDependencies = true,
    } = options;

    try {
      // Check if already loaded
      if (this.modules.has(moduleId)) {
        console.warn(`Module "${moduleId}" is already loaded`);
        return this.modules.get(moduleId)!;
      }

      // Create instance with loading status
      const instance: ModuleInstance = {
        manifest: {} as ModuleManifest,
        status: 'loading',
        loadedAt: new Date(),
      };

      this.modules.set(moduleId, instance);

      // Dynamic import of module manifest
      const manifestModule = await import(`@/modules/${moduleId}/manifest`);
      const manifest: ModuleManifest = manifestModule.default || manifestModule;

      // Validate manifest
      this.validateManifest(manifest);

      // Update instance
      instance.manifest = manifest;

      // Validate permissions
      if (validatePermissions && !this.hasRequiredPermissions(manifest.permissions)) {
        throw new Error(
          `Missing required permissions for module "${moduleId}": ${manifest.permissions.join(', ')}`
        );
      }

      // Validate dependencies
      if (validateDependencies && manifest.dependencies) {
        const missing = manifest.dependencies.filter((dep) => !this.isModuleLoaded(dep));
        if (missing.length > 0) {
          throw new Error(
            `Missing dependencies for module "${moduleId}": ${missing.join(', ')}`
          );
        }
      }

      // Emit loaded event
      await eventBus.emit(
        EventTypes.MODULE_LOADED,
        { moduleId, manifest },
        { module: moduleId }
      );

      // Auto-activate if requested
      if (autoActivate) {
        await this.activateModule(moduleId);
      } else {
        instance.status = 'inactive';
      }

      console.log(`✅ Module "${moduleId}" loaded successfully`);
      return instance;
    } catch (error) {
      // Update instance with error
      const instance = this.modules.get(moduleId);
      if (instance) {
        instance.status = 'error';
        instance.error = error as Error;
      }

      // Emit error event
      await eventBus.emit(
        EventTypes.MODULE_ERROR,
        { moduleId, error: (error as Error).message },
        { module: moduleId }
      );

      console.error(`❌ Failed to load module "${moduleId}":`, error);
      throw error;
    }
  }

  /**
   * Activate a module
   */
  async activateModule(moduleId: string): Promise<void> {
    const instance = this.modules.get(moduleId);

    if (!instance) {
      throw new Error(`Module "${moduleId}" is not loaded`);
    }

    if (instance.status === 'active') {
      console.warn(`Module "${moduleId}" is already active`);
      return;
    }

    const { manifest } = instance;

    try {
      // Call onActivate hook
      if (manifest.onActivate) {
        await manifest.onActivate();
      }

      // Register services
      if (manifest.services) {
        for (const [name, service] of Object.entries(manifest.services)) {
          serviceRegistry.register({
            name,
            module: moduleId,
            service,
            version: manifest.version,
          });
        }
      }

      // Register event handlers
      if (manifest.eventHandlers) {
        for (const [eventType, handler] of Object.entries(manifest.eventHandlers)) {
          eventBus.on(eventType, handler);
        }
      }

      // Update instance
      instance.status = 'active';
      instance.activatedAt = new Date();

      // Emit activated event
      await eventBus.emit(
        EventTypes.MODULE_ACTIVATED,
        { moduleId, manifest },
        { module: moduleId }
      );

      console.log(`✅ Module "${moduleId}" activated`);
    } catch (error) {
      instance.status = 'error';
      instance.error = error as Error;

      await eventBus.emit(
        EventTypes.MODULE_ERROR,
        { moduleId, error: (error as Error).message },
        { module: moduleId }
      );

      throw error;
    }
  }

  /**
   * Deactivate a module
   */
  async deactivateModule(moduleId: string): Promise<void> {
    const instance = this.modules.get(moduleId);

    if (!instance) {
      throw new Error(`Module "${moduleId}" is not loaded`);
    }

    if (instance.status !== 'active') {
      console.warn(`Module "${moduleId}" is not active`);
      return;
    }

    const { manifest } = instance;

    try {
      // Call onDeactivate hook
      if (manifest.onDeactivate) {
        await manifest.onDeactivate();
      }

      // Unregister services
      serviceRegistry.clearModule(moduleId);

      // Remove event handlers
      if (manifest.eventHandlers) {
        for (const [eventType, handler] of Object.entries(manifest.eventHandlers)) {
          eventBus.off(eventType, handler);
        }
      }

      // Update instance
      instance.status = 'inactive';

      // Emit deactivated event
      await eventBus.emit(
        EventTypes.MODULE_DEACTIVATED,
        { moduleId, manifest },
        { module: moduleId }
      );

      console.log(`✅ Module "${moduleId}" deactivated`);
    } catch (error) {
      console.error(`❌ Error deactivating module "${moduleId}":`, error);
      throw error;
    }
  }

  /**
   * Unload a module
   */
  async unloadModule(moduleId: string): Promise<void> {
    const instance = this.modules.get(moduleId);

    if (!instance) {
      console.warn(`Module "${moduleId}" is not loaded`);
      return;
    }

    // Deactivate if active
    if (instance.status === 'active') {
      await this.deactivateModule(moduleId);
    }

    // Remove from registry
    this.modules.delete(moduleId);

    console.log(`✅ Module "${moduleId}" unloaded`);
  }

  /**
   * Get a module instance
   */
  getModule(moduleId: string): ModuleInstance | undefined {
    return this.modules.get(moduleId);
  }

  /**
   * Get all loaded modules
   */
  getAllModules(): ModuleInstance[] {
    return Array.from(this.modules.values());
  }

  /**
   * Check if module is loaded
   */
  isModuleLoaded(moduleId: string): boolean {
    return this.modules.has(moduleId);
  }

  /**
   * Check if module is active
   */
  isModuleActive(moduleId: string): boolean {
    const instance = this.modules.get(moduleId);
    return instance?.status === 'active';
  }

  /**
   * Get all active modules
   */
  getActiveModules(): ModuleInstance[] {
    return Array.from(this.modules.values()).filter((m) => m.status === 'active');
  }

  /**
   * Reload a module
   */
  async reloadModule(moduleId: string, options?: ModuleLoaderOptions): Promise<ModuleInstance> {
    await this.unloadModule(moduleId);
    return await this.loadModule(moduleId, options);
  }

  /**
   * Validate manifest structure
   */
  private validateManifest(manifest: ModuleManifest): void {
    if (!manifest.id) {
      throw new Error('Module manifest must have an "id" field');
    }

    if (!manifest.name) {
      throw new Error('Module manifest must have a "name" field');
    }

    if (!manifest.version) {
      throw new Error('Module manifest must have a "version" field');
    }

    if (!Array.isArray(manifest.permissions)) {
      throw new Error('Module manifest must have a "permissions" array');
    }
  }

  /**
   * Check if user has required permissions
   */
  private hasRequiredPermissions(permissions: Permission[]): boolean {
    if (!this.permissionChecker) {
      console.warn('No permission checker set, skipping permission validation');
      return true;
    }

    return this.permissionChecker(permissions);
  }
}

// Singleton instance
export const moduleLoader = new ModuleLoader();
