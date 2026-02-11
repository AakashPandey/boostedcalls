// Simple event emitter for SSE broadcasts
// In production with multiple instances, replace with Redis pub/sub

type EventCallback = (data: any) => void;

class EventEmitter {
  private listeners: Map<string, Set<EventCallback>> = new Map();

  subscribe(channel: string, callback: EventCallback): () => void {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, new Set());
    }
    this.listeners.get(channel)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(channel)?.delete(callback);
      if (this.listeners.get(channel)?.size === 0) {
        this.listeners.delete(channel);
      }
    };
  }

  emit(channel: string, data: any): void {
    this.listeners.get(channel)?.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error("Error in event callback:", error);
      }
    });
  }

  // Emit to multiple channels at once
  broadcast(channels: string[], data: any): void {
    channels.forEach((channel) => this.emit(channel, data));
  }
}

// Singleton instance
const globalForEvents = globalThis as unknown as { eventEmitter: EventEmitter };

export const eventEmitter = globalForEvents.eventEmitter || new EventEmitter();

if (process.env.NODE_ENV !== "production") {
  globalForEvents.eventEmitter = eventEmitter;
}
