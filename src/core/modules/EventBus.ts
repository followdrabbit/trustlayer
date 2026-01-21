/**
 * Simple Event Bus for inter-module communication.
 * Allows modules to publish and subscribe to events without direct coupling.
 */

type EventHandler<T = any> = (data: T) => void;

class EventBusService {
  private handlers: Map<string, Set<EventHandler>> = new Map();

  /**
   * Subscribe to an event.
   * @param event The event name (e.g., 'governance:assessment-completed')
   * @param handler The callback function
   * @returns A function to unsubscribe
   */
  on<T = any>(event: string, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);

    return () => this.off(event, handler);
  }

  /**
   * Unsubscribe from an event.
   */
  off<T = any>(event: string, handler: EventHandler<T>): void {
    this.handlers.get(event)?.delete(handler);
  }

  /**
   * Publish an event.
   */
  emit<T = any>(event: string, data?: T): void {
    this.handlers.get(event)?.forEach((handler) => handler(data));
  }
}

export const EventBus = new EventBusService();