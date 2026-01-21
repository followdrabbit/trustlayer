import type { LazyExoticComponent, ComponentType } from 'react';

/**
 * Defines the metadata for a route provided by a module.
 */
export interface ModuleRouteMeta {
  requiresAuth: boolean;
  roles?: string[];
  title: string;
  [key: string]: unknown;
}

/**
 * Defines the structure for a single route within a module.
 */
export interface ModuleRoute {
  path: string;
  component: LazyExoticComponent<ComponentType<any>>;
  meta: ModuleRouteMeta;
}

/**
 * Defines a navigation item to be added to the UI.
 */
export interface ModuleNavigationItem {
  label: string;
  path: string;
  icon: string; // Icon name (e.g., from lucide-react)
  order?: number;
  parent?: string; // For sub-menus
}

/**
 * Defines a widget that can be added to a dashboard.
 */
export interface ModuleWidget {
  id: string;
  name: string;
  component: LazyExoticComponent<ComponentType<any>>;
  defaultSize?: { w: number; h: number };
}

/**
 * The manifest that every module must export.
 * It serves as the module's entry point and definition.
 */
export interface ModuleManifest {
  // Core metadata
  id: string;
  name: string;
  version: string;
  description: string;

  // Functional definitions
  permissions?: string[];
  routes?: ModuleRoute[];
  navigation?: ModuleNavigationItem[];
  widgets?: ModuleWidget[];

  // Lifecycle hooks
  onActivate?: () => Promise<void>;
  onDeactivate?: () => Promise<void>;
  onConfigure?: (config: Record<string, unknown>) => Promise<void>;
}