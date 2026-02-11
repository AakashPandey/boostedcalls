import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.toString();
    const url = `${process.env.NEXT_PUBLIC_API_URL}/calls/${query ? `?${query}` : ""}`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${(session.user as any).accessToken}`,
      },
      cache: "no-store",
    });

    if (res.status === 401) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return NextResponse.json(
        { message: errorData.message || "Failed to fetch calls" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Failed to fetch calls" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const contactId = body.contact_id ?? body.contactId;
    const scriptId = body.script_id ?? body.scriptId ?? null;
    const assistantId = body.assistant_id ?? body.assistantId ?? process.env.VAPI_ASSISTANT_ID;
    const phoneNumberId =
      body.phone_number_id ?? body.phoneNumberId ?? process.env.VAPI_PHONE_NUMBER_ID;
    const customPrompt = body.custom_prompt ?? body.customPrompt ?? null;
    const firstMessage = body.first_message ?? body.firstMessage ?? null;
    const callGoals = body.call_goals ?? body.callGoals ?? null;
    const metadata = body.metadata ?? null;

    if (!contactId) {
      return NextResponse.json({ message: "Contact is required" }, { status: 400 });
    }

    if (!assistantId || !phoneNumberId) {
      return NextResponse.json(
        { message: "Assistant and phone number are required" },
        { status: 400 }
      );
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/calls/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${(session.user as any).accessToken}`,
      },
      body: JSON.stringify({
        contact_id: contactId,
        assistant_id: assistantId,
        phone_number_id: phoneNumberId,
        script_id: scriptId,
        custom_prompt: customPrompt,
        first_message: firstMessage,
        call_goals: callGoals,
        metadata,
      }),
    });

    if (res.status === 401) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return NextResponse.json(
        { message: errorData.message || "Failed to place call" },
        { status: res.status }
      );
    }

    const data = await res.json();
    
    // Revalidate the campaigns page to show the new call
    revalidatePath("/campaigns");

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to place call" }, { status: 500 });
  }
}
