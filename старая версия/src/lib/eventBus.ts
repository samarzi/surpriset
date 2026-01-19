// Simple event bus for global state management
type EventCallback = (data?: unknown) => void;

class EventBus {
  private events: Map<string, EventCallback[]> = new Map();

  on(event: string, callback: EventCallback) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(callback);
  }

  off(event: string, callback: EventCallback) {
    const callbacks = this.events.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event: string, data?: unknown) {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event callback for ${event}:`, error);
        }
      });
    }
    
    // Also emit as DOM event for compatibility
    window.dispatchEvent(new CustomEvent(event, { detail: data }));
  }

  clear() {
    this.events.clear();
  }
}

export const eventBus = new EventBus();

// Event types
export const EVENTS = {
  PRODUCTS_REFRESH: 'products-refresh',
  LIKES_UPDATED: 'likes-updated',
  PRODUCT_UPDATED: 'product-updated',
  ADMIN_DATA_CHANGED: 'admin-data-changed'
} as const;