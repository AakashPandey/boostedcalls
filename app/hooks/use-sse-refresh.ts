import { useCallback } from "react";
import { useSSE } from "./use-sse";

interface SSEEventData {
  id: string | number;
  [key: string]: any;
}

interface UseSSERefreshOptions {
  channelName: string;
  condition: boolean;
  onEvent?: (data: SSEEventData) => void;
}

export function useSSERefresh({
  channelName,
  condition,
  onEvent,
}: UseSSERefreshOptions) {
  const handleSSEEvent = useCallback(
    (data: any) => {
      if (onEvent) {
        onEvent(data);
      }
    },
    [onEvent]
  );

  useSSE({ channels: [channelName], onEvent: handleSSEEvent, enabled: condition });
}
