/**
 * Module System Types
 * Type definitions for the modular architecture
 */

import type { ComponentType, LazyExoticComponent } from 'react';
import type { RouteObject } from 'react-router-dom';

/**
 * Module Permission
 */
export type Permission = string;

/**
 * Module Route Definition
 */
export interface ModuleRoute {
  path: string;
  component: LazyExoticComponent<ComponentType<any>> | ComponentType<any>;
  meta?: {
    requiresAuth?: boolean;
    roles?: string[];
    permissions?: Permission[];
    title?: string;
    description?: string;
  };
  children?: ModuleRoute[];
}

/**
 * Module Navigation Item
 */
export interface ModuleNavigationItem {
  label: string;
  path: string;
  icon?: string;
  order?: number;
  roles?: string[];
  children?: ModuleNavigationItem[];
}

/**
 * Module Widget Definition
 */
export interface ModuleWidget {
  id: string;
  name: string;
  description?: string;
  component: LazyExoticComponent<ComponentType<any>> | ComponentType<any>;
  defaultSize?: {
    w: number;
    h: number;
    minW?: number;
    minH?: number;
    maxW?: number;
    maxH?: number;
  };
  category?: string;
  icon?: string;
  configurable?: boolean;
  configSchema?: Record<string, any>;
}

/**
 * Module Configuration
 */
export interface ModuleConfig {
  enabled?: boolean;
  settings?: Record<string, any>;
}

/**
 * Module Manifest
 */
export interface ModuleManifest {
  // Metadata
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  license?: string;

  // Dependencies
  dependencies?: string[];
  peerDependencies?: string[];

  // Permissions
  permissions: Permission[];

  // Routes
  routes?: ModuleRoute[];

  // Navigation
  navigation?: ModuleNavigationItem[];

  // Widgets
  widgets?: ModuleWidget[];

  // Configuration
  config?: ModuleConfig;

  // Lifecycle hooks
  onActivate?: () => Promise<void> | void;
  onDeactivate?: () => Promise<void> | void;
  onConfigure?: (config: ModuleConfig) => Promise<void> | void;

  // Services
  services?: Record<string, any>;

  // Event handlers
  eventHandlers?: Record<string, Function>;
}

/**
 * Module Instance
 */
export interface ModuleInstance {
  manifest: ModuleManifest;
  status: 'loading' | 'active' | 'inactive' | 'error';
  error?: Error;
  loadedAt?: Date;
  activatedAt?: Date;
}

/**
 * Module Loader Options
 */
export interface ModuleLoaderOptions {
  autoActivate?: boolean;
  validatePermissions?: boolean;
  validateDependencies?: boolean;
}

/**
 * Event Bus Event
 */
export interface ModuleEvent<T = any> {
  type: string;
  module: string;
  data?: T;
  timestamp: Date;
}

/**
 * Event Bus Listener
 */
export type EventListener<T = any> = (event: ModuleEvent<T>) => void | Promise<void>;

/**
 * Service Definition
 */
export interface ServiceDefinition<T = any> {
  name: string;
  module: string;
  service: T;
  version?: string;
}
