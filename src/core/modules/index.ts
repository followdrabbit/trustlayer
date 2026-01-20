/**
 * Module System Entry Point
 * Exports all module system functionality
 */

export * from './types';
export * from './event-bus';
export * from './service-registry';
export * from './module-loader';

// Re-export commonly used items
export { EventBus, eventBus, EventTypes } from './event-bus';
export { ServiceRegistry, serviceRegistry } from './service-registry';
export { ModuleLoader, moduleLoader } from './module-loader';
