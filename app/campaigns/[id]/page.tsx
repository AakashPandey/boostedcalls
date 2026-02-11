import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CallDetailClient } from "../../components/call-detail-client";
import AppHeader from "../../components/app-header";
import { ChevronLeft } from "lucide-react";

interface Contact {
  id: string;
  userId: string;
  name: string;
  phone: string;
  email: string;
  metadata: string | null;
  createdAt: string;
  updatedAt: string;
}

export default async function CallDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Handle token refresh failure
  if ((session as any).error === "RefreshAccessTokenError") {
    redirect("/api/auth/logout");
  }

  let call: any = null;
  let error: string | null = null;
  let script: any = null;
  let scriptError: string | null = null;
  let contact: Contact | null = null;
  let contactError: string | null = null;

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/calls/${id}/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${(session.user as any).accessToken}`,
      },
    });

    if (!res.ok) {
      if (res.status === 401) {
        redirect("/api/auth/logout");
      }
      const contentType = res.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        try {
          const errorData = await res.json();
          error = errorData.message || "Failed to fetch call details";
        } catch (e) {
          error = `Server error (${res.status})`;
        }
      } else {
        error = `Server error (${res.status})`;
      }
    } else {
      call = await res.json();

      const contactId =
        call?.contactId ?? (call as any)?.contact_id ?? (call as any)?.contact?.id ?? null;
      const scriptId =
        call?.scriptId ?? (call as any)?.script_id ?? (call as any)?.script?.id ?? null;

      // Fetch contact details
      if (call && contactId) {
        try {
          const contactRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/contacts/${contactId}/`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${(session.user as any).accessToken}`,
            },
          });

          if (contactRes.ok) {
            contact = await contactRes.json();
          } else if (contactRes.status === 401) {
            redirect("/api/auth/logout");
          } else {
            contactError = "Failed to fetch contact";
          }
        } catch (err: any) {
          contactError = err.message || "Failed to fetch contact";
        }
      }

      // Fetch script if scriptId exists
      if (call && scriptId) {
        try {
          const scriptRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/scripts/${scriptId}/`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${(session.user as any).accessToken}`,
            },
          });

          if (scriptRes.ok) {
            script = await scriptRes.json();
          } else if (scriptRes.status === 401) {
            redirect("/api/auth/logout");
          } else {
            scriptError = "Failed to fetch script";
          }
        } catch (err: any) {
          scriptError = err.message || "Failed to fetch script";
        }
      }
    }
  } catch (err: any) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) {
      throw err;
    }
    error = err.message || "Failed to fetch call details";
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
        <AppHeader email={session.user.email ?? undefined} />
        <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
          <Link
            href="/campaigns"
            className="flex items-center gap-1 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 mb-6 w-fit"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Calls
          </Link>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-900/20">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        </main>
      </div>
    );
  }

  if (!call) {
    return (
      <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
        <AppHeader email={session.user.email ?? undefined} />
        <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
          <Link
            href="/campaigns"
            className="flex items-center gap-1 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 mb-6 w-fit"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Calls
          </Link>

          <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
            <p className="text-zinc-500 dark:text-zinc-400">Call not found.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <AppHeader email={session.user.email ?? undefined} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        

        <CallDetailClient
          initialCall={call}
          initialContact={contact}
          initialScript={script}
          contactError={contactError}
          scriptError={scriptError}
        />
      </main>
    </div>
  );
}
