import { NextRequest } from "next/server";
import { eventEmitter } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const channels = searchParams.get("channels")?.split(",") || [];

  if (channels.length === 0) {
    return new Response("Missing channels parameter", { status: 400 });
  }

  const encoder = new TextEncoder();
  let unsubscribes: (() => void)[] = [];
  let isActive = true;

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "connected", channels })}\n\n`)
      );

      // Subscribe to each channel
      channels.forEach((channel) => {
        const unsubscribe = eventEmitter.subscribe(channel, (data) => {
          if (isActive) {
            try {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ channel, ...data })}\n\n`)
              );
            } catch (error) {
              // Stream might be closed
              console.error("Error sending SSE:", error);
            }
          }
        });
        unsubscribes.push(unsubscribe);
      });

      // Keep-alive ping every 30 seconds
      const pingInterval = setInterval(() => {
        if (isActive) {
          try {
            controller.enqueue(encoder.encode(`: ping\n\n`));
          } catch {
            clearInterval(pingInterval);
          }
        }
      }, 30000);

      // Cleanup on close
      request.signal.addEventListener("abort", () => {
        isActive = false;
        clearInterval(pingInterval);
        unsubscribes.forEach((unsub) => unsub());
      });
    },
    cancel() {
      isActive = false;
      unsubscribes.forEach((unsub) => unsub());
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
