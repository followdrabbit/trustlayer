import { ModuleManifest, ModuleRoute, ModuleNavigationItem } from './types';

/**
 * Core service responsible for loading, activating, and managing the lifecycle of modules.
 */
class ModuleLoaderService {
  private modules: Map<string, ModuleManifest> = new Map();
  private activeModules: Set<string> = new Set();

  /**
   * Registers a module manifest.
   * This does not activate the module, just makes it known to the system.
   */
  register(manifest: ModuleManifest): void {
    if (this.modules.has(manifest.id)) {
      console.warn(`Module ${manifest.id} is already registered.`);
      return;
    }
    this.modules.set(manifest.id, manifest);
    console.log(`Module registered: ${manifest.name} (${manifest.id})`);
  }

  /**
   * Activates a module, calling its onActivate hook.
   */
  async activate(id: string): Promise<void> {
    const module = this.modules.get(id);
    if (!module) {
      throw new Error(`Module ${id} not found.`);
    }

    if (this.activeModules.has(id)) {
      return; // Already active
    }

    if (module.onActivate) {
      try {
        await module.onActivate();
      } catch (error) {
        console.error(`Failed to activate module ${id}:`, error);
        throw error;
      }
    }

    this.activeModules.add(id);
    console.log(`Module activated: ${id}`);
  }

  /**
   * Deactivates a module, calling its onDeactivate hook.
   */
  async deactivate(id: string): Promise<void> {
    const module = this.modules.get(id);
    if (!module || !this.activeModules.has(id)) {
      return;
    }

    if (module.onDeactivate) {
      await module.onDeactivate();
    }

    this.activeModules.delete(id);
    console.log(`Module deactivated: ${id}`);
  }

  /**
   * Returns all routes from active modules.
   */
  getRoutes(): ModuleRoute[] {
    const routes: ModuleRoute[] = [];
    this.activeModules.forEach((id) => {
      const module = this.modules.get(id);
      if (module?.routes) {
        routes.push(...module.routes);
      }
    });
    return routes;
  }

  /**
   * Returns all navigation items from active modules.
   */
  getNavigationItems(): ModuleNavigationItem[] {
    const items: ModuleNavigationItem[] = [];
    this.activeModules.forEach((id) => {
      const module = this.modules.get(id);
      if (module?.navigation) {
        items.push(...module.navigation);
      }
    });
    return items.sort((a, b) => (a.order || 99) - (b.order || 99));
  }

  isModuleActive(id: string): boolean {
    return this.activeModules.has(id);
  }
}

export const ModuleLoader = new ModuleLoaderService();