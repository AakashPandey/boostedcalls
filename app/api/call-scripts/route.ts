import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/scripts/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${(session.user as any).accessToken}`,
      },
    });

    if (res.status === 401) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!res.ok) {
      return NextResponse.json({ message: "Failed to fetch scripts" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to fetch scripts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const payload = {
      name: body.name,
      description: body.description ?? null,
      custom_prompt: body.custom_prompt ?? body.customPrompt ?? null,
      first_message: body.first_message ?? body.firstMessage ?? null,
      call_goals: body.call_goals ?? body.callGoals ?? null,
    };

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/scripts/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${(session.user as any).accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (res.status === 401) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return NextResponse.json(
        { message: errorData.message || "Failed to create script" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to create script" }, { status: 500 });
  }
}
