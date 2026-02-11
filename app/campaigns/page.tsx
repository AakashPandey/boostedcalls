import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { LogoutButton } from "../components/logout-button";
import { CallsTableClient } from "../components/calls-table-client";
import { PhoneCall } from "lucide-react";

export default async function CampaignsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  let calls = [];
  let error: string | null = null;

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/calls/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${(session.user as any).accessToken}`,
      },
    });

    if (!res.ok) {
      // Handle expired/invalid token - logout and redirect to login
      if (res.status === 401) {
        redirect("/api/auth/logout");
      }
      const contentType = res.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        try {
          const errorData = await res.json();
          error = errorData.message || "Failed to fetch calls";
        } catch (e) {
          error = `Server error (${res.status})`;
        }
      } else {
        error = `Server error (${res.status})`;
      }
    } else {
      const data = await res.json();
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
          ? data.results
          : Array.isArray(data?.items)
            ? data.items
            : Array.isArray(data?.data)
              ? data.data
              : Array.isArray(data?.calls)
                ? data.calls
                : Array.isArray(data?.data?.results)
                  ? data.data.results
                  : [];
      calls = list;
      // Sort by most recent first
      calls.sort((a: any, b: any) => {
        const aDate = a?.createdAt ?? a?.created_at;
        const bDate = b?.createdAt ?? b?.created_at;
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      });
    }
  } catch (err: any) {
    // Rethrow redirect errors (they use a special NEXT_REDIRECT error)
    if (err?.digest?.startsWith("NEXT_REDIRECT")) {
      throw err;
    }
    error = err.message || "Failed to fetch calls";
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      {/* Header */}
      <header className="border-b border-black/6 bg-white dark:border-white/6 dark:bg-black">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-4">
            <Image className="invert" src="/vercel.svg" alt="Vercel" width={22} height={22} priority />
            <span className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">BoostedCalls</span>
          </Link>
          <nav className="flex items-center gap-6">
            
            <LogoutButton />
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50 mb-2">Campaigns</h2>
            <p className="text-zinc-600 dark:text-zinc-400">
              View all calls made by {session.user.email}
            </p>
          </div>
          <Link
            href="/campaigns/make-call"
            className="gap-2 inline-flex items-center justify-center rounded-full bg-black px-4 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 dark:bg-zinc-50 dark:text-zinc-900"
          >
            <PhoneCall className="h-4 w-4" />
            Make a Call
          </Link>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-900/20">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        ) : (
          <CallsTableClient initialCalls={calls} />
        )}
      </main>
    </div>
  );
}
