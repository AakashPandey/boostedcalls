"use client";

import { useEffect, useRef, useCallback } from "react";

interface SSEEvent {
  type: string;
  channel?: string;
  callId?: string;
  callIds?: string[];
  timestamp?: number;
}

interface UseSSEOptions {
  channels: string[];
  onEvent: (event: SSEEvent) => void;
  enabled?: boolean;
}

export function useSSE({ channels, onEvent, enabled = true }: UseSSEOptions) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const onEventRef = useRef(onEvent);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const isClient = typeof window !== "undefined";

  // Keep callback ref updated
  onEventRef.current = onEvent;

  const connect = useCallback(() => {
    if (!isClient || !enabled || channels.length === 0) return;

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const channelsParam = channels.join(",");
    const eventSource = new EventSource(`/api/events/stream?channels=${channelsParam}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as SSEEvent;
        
        // Skip connection confirmation messages
        if (data.type === "connected") {
          console.log("[SSE] Connected to channels:", data.channel);
          reconnectAttempts.current = 0;
          return;
        }

        onEventRef.current(data);
      } catch (error) {
        console.error("[SSE] Error parsing event:", error);
      }
    };

    eventSource.onerror = () => {
      console.log("[SSE] Connection error, will reconnect...");
      eventSource.close();
      eventSourceRef.current = null;

      // Exponential backoff for reconnection
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
      reconnectAttempts.current++;

      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, delay);
    };

    eventSourceRef.current = eventSource;
  }, [channels, enabled, isClient]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [connect]);

  return {
    isConnected:
      isClient && typeof EventSource !== "undefined"
        ? eventSourceRef.current?.readyState === EventSource.OPEN
        : false,
  };
}
