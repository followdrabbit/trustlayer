/**
 * Event Bus
 * Lightweight event system for inter-module communication
 */

import type { ModuleEvent, EventListener } from './types';

export class EventBus {
  private listeners = new Map<string, Set<EventListener>>();
  private history: ModuleEvent[] = [];
  private maxHistorySize = 100;

  /**
   * Subscribe to an event
   */
  on<T = any>(eventType: string, listener: EventListener<T>): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    this.listeners.get(eventType)!.add(listener);

    // Return unsubscribe function
    return () => this.off(eventType, listener);
  }

  /**
   * Subscribe to an event (one-time)
   */
  once<T = any>(eventType: string, listener: EventListener<T>): () => void {
    const wrappedListener: EventListener<T> = async (event) => {
      this.off(eventType, wrappedListener);
      await listener(event);
    };

    return this.on(eventType, wrappedListener);
  }

  /**
   * Unsubscribe from an event
   */
  off<T = any>(eventType: string, listener: EventListener<T>): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.listeners.delete(eventType);
      }
    }
  }

  /**
   * Emit an event
   */
  async emit<T = any>(
    eventType: string,
    data?: T,
    options?: { module?: string; sync?: boolean }
  ): Promise<void> {
    const event: ModuleEvent<T> = {
      type: eventType,
      module: options?.module || 'unknown',
      data,
      timestamp: new Date(),
    };

    // Add to history
    this.history.push(event);
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }

    // Get listeners
    const listeners = this.listeners.get(eventType);
    if (!listeners || listeners.size === 0) {
      return;
    }

    // Execute listeners
    const promises: Promise<void>[] = [];

    for (const listener of listeners) {
      if (options?.sync) {
        // Synchronous execution
        try {
          await listener(event);
        } catch (error) {
          console.error(`Error in event listener for ${eventType}:`, error);
        }
      } else {
        // Asynchronous execution
        promises.push(
          (async () => {
            try {
              await listener(event);
            } catch (error) {
              console.error(`Error in event listener for ${eventType}:`, error);
            }
          })()
        );
      }
    }

    if (!options?.sync && promises.length > 0) {
      await Promise.all(promises);
    }
  }

  /**
   * Remove all listeners for an event type
   */
  removeAllListeners(eventType?: string): void {
    if (eventType) {
      this.listeners.delete(eventType);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Get all event types that have listeners
   */
  eventTypes(): string[] {
    return Array.from(this.listeners.keys());
  }

  /**
   * Get listener count for an event type
   */
  listenerCount(eventType: string): number {
    return this.listeners.get(eventType)?.size || 0;
  }

  /**
   * Get event history
   */
  getHistory(options?: { eventType?: string; module?: string; limit?: number }): ModuleEvent[] {
    let filtered = this.history;

    if (options?.eventType) {
      filtered = filtered.filter((e) => e.type === options.eventType);
    }

    if (options?.module) {
      filtered = filtered.filter((e) => e.module === options.module);
    }

    if (options?.limit) {
      filtered = filtered.slice(-options.limit);
    }

    return filtered;
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.history = [];
  }

  /**
   * Set max history size
   */
  setMaxHistorySize(size: number): void {
    this.maxHistorySize = size;
    while (this.history.length > size) {
      this.history.shift();
    }
  }
}

// Singleton instance
export const eventBus = new EventBus();

// Standard event types
export const EventTypes = {
  // Module lifecycle
  MODULE_LOADED: 'module:loaded',
  MODULE_ACTIVATED: 'module:activated',
  MODULE_DEACTIVATED: 'module:deactivated',
  MODULE_ERROR: 'module:error',

  // Governance module
  ASSESSMENT_CREATED: 'governance:assessment-created',
  ASSESSMENT_UPDATED: 'governance:assessment-updated',
  ASSESSMENT_SUBMITTED: 'governance:assessment-submitted',
  ASSESSMENT_DELETED: 'governance:assessment-deleted',

  // User events
  USER_LOGGED_IN: 'user:logged-in',
  USER_LOGGED_OUT: 'user:logged-out',
  USER_UPDATED: 'user:updated',

  // System events
  THEME_CHANGED: 'system:theme-changed',
  ORGANIZATION_CHANGED: 'system:organization-changed',
} as const;
