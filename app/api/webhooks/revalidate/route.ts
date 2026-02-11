import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { eventEmitter } from "@/lib/events";

export async function POST(request: NextRequest) {
  // Verify the webhook secret token
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token || token !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { type, callId } = body;

    // Validate the request body
    if (!type) {
      return NextResponse.json({ message: "Missing 'type' in request body" }, { status: 400 });
    }

    const revalidatedPaths: string[] = [];
    const notifiedChannels: string[] = [];

    switch (type) {
      case "call.updated":
      case "call.created":
      case "call.completed":
      case "call.failed":
        // Always revalidate the campaigns list page
        revalidatePath("/campaigns");
        revalidatedPaths.push("/campaigns");

        // Notify SSE clients subscribed to campaigns list
        eventEmitter.emit("campaigns", { type, callId, timestamp: Date.now() });
        notifiedChannels.push("campaigns");

        // If a specific callId is provided, also revalidate that call's detail page
        if (callId) {
          revalidatePath(`/campaigns/${callId}`);
          revalidatedPaths.push(`/campaigns/${callId}`);

          // Notify SSE clients subscribed to this specific call
          eventEmitter.emit(`call:${callId}`, { type, callId, timestamp: Date.now() });
          notifiedChannels.push(`call:${callId}`);
        }
        break;

      case "calls.bulk":
        // Revalidate campaigns page for bulk updates
        revalidatePath("/campaigns");
        revalidatedPaths.push("/campaigns");

        // Notify campaigns list subscribers
        eventEmitter.emit("campaigns", { type, callIds: body.callIds, timestamp: Date.now() });
        notifiedChannels.push("campaigns");

        // If multiple callIds provided, revalidate each
        if (body.callIds && Array.isArray(body.callIds)) {
          for (const id of body.callIds) {
            revalidatePath(`/campaigns/${id}`);
            revalidatedPaths.push(`/campaigns/${id}`);

            // Notify each call's subscribers
            eventEmitter.emit(`call:${id}`, { type, callId: id, timestamp: Date.now() });
            notifiedChannels.push(`call:${id}`);
          }
        }
        break;

      case "revalidate.all":
        // Revalidate all campaign-related pages
        revalidatePath("/campaigns", "page");
        revalidatePath("/campaigns", "layout");
        revalidatedPaths.push("/campaigns (full)");

        // Notify all campaigns subscribers
        eventEmitter.emit("campaigns", { type, timestamp: Date.now() });
        notifiedChannels.push("campaigns");
        break;

      default:
        return NextResponse.json(
          { message: `Unknown event type: ${type}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: "Revalidation triggered and SSE clients notified",
      revalidatedPaths,
      notifiedChannels,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// Also support GET for health checks
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token || token !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    status: "healthy",
    endpoint: "/api/webhooks/revalidate",
    supportedTypes: [
      "call.updated",
      "call.created", 
      "call.completed",
      "call.failed",
      "calls.bulk",
      "revalidate.all",
    ],
  });
}
