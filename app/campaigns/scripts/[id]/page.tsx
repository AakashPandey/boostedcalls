"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { LogoutButton } from "../../../components/logout-button";

interface CallGoal {
  name: string;
  description: string;
  successCriteria: string;
}

interface CallScript {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  customPrompt: string;
  firstMessage: string;
  callGoals: CallGoal[];
  createdAt: string;
  updatedAt: string;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ScriptPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [script, setScript] = useState<CallScript | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scriptId, setScriptId] = useState<string>("");

  useEffect(() => {
    async function fetchScript() {
      const { id } = await params;
      setScriptId(id);
      
      try {
        const res = await fetch(`/api/call-scripts/${id}`);

        if (res.status === 401) {
          router.push("/api/auth/logout");
          return;
        }

        if (!res.ok) {
          throw new Error("Failed to fetch script");
        }

        const data = await res.json();
        setScript(data);
      } catch (err: any) {
        setError(err.message || "Failed to load script");
      } finally {
        setLoading(false);
      }
    }

    fetchScript();
  }, [params, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
        <header className="border-b border-black/6 bg-white dark:border-white/6 dark:bg-black">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Image className="invert" src="/vercel.svg" alt="Vercel" width={22} height={22} priority />
              <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">CallAI</h1>
            </div>
            <nav className="flex items-center gap-6">
              <Link href="/" className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">
                Home
              </Link>
              <Link href="/campaigns" className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">
                Campaigns
              </Link>
              <LogoutButton />
            </nav>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <p className="text-zinc-500 dark:text-zinc-400">Loading...</p>
        </main>
      </div>
    );
  }

  if (error || !script) {
    return (
      <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
        <header className="border-b border-black/6 bg-white dark:border-white/6 dark:bg-black">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Image className="invert" src="/vercel.svg" alt="Vercel" width={22} height={22} priority />
              <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">CallAI</h1>
            </div>
            <nav className="flex items-center gap-6">
              <Link href="/" className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">
                Home
              </Link>
              <Link href="/campaigns" className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">
                Campaigns
              </Link>
              <LogoutButton />
            </nav>
          </div>
        </header>
        <main className="flex-1 max-w-2xl w-full mx-auto px-6 py-12">
          <Link href="/campaigns/make-call" className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 mb-6 inline-block">
            ← Back to Make a Call
          </Link>
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-900/20">
            <p className="text-sm text-red-800 dark:text-red-200">{error || "Script not found"}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <header className="border-b border-black/6 bg-white dark:border-white/6 dark:bg-black">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Image className="invert" src="/vercel.svg" alt="Vercel" width={22} height={22} priority />
            <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">CallAI</h1>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/" className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">
              Home
            </Link>
            <Link href="/campaigns" className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">
              Campaigns
            </Link>
            <LogoutButton />
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-6 py-12">
        <Link href="/campaigns/make-call" className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 mb-6 inline-block">
          ← Back to Make a Call
        </Link>

        {/* Script Header */}
        <div className="rounded-lg border border-black/6 bg-white p-6 dark:border-white/6 dark:bg-black mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-semibold text-black dark:text-zinc-50 mb-1">{script.name}</h2>
              {script.description && (
                <p className="text-zinc-600 dark:text-zinc-400">{script.description}</p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1">ID</p>
              <p className="font-mono text-zinc-600 dark:text-zinc-400">{script.id.slice(0, 12)}...</p>
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1">Created</p>
              <p className="text-zinc-600 dark:text-zinc-400">{formatDate(script.createdAt)}</p>
            </div>
          </div>
        </div>

        {/* First Message */}
        <div className="rounded-lg border border-black/6 bg-white p-6 dark:border-white/6 dark:bg-black mb-6">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">
            First Message
          </p>
          <p className="text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4 italic">
            &quot;{script.firstMessage}&quot;
          </p>
        </div>

        {/* Custom Prompt */}
        <div className="rounded-lg border border-black/6 bg-white p-6 dark:border-white/6 dark:bg-black mb-6">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">
            Custom Prompt
          </p>
          <p className="text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4 whitespace-pre-wrap">
            {script.customPrompt}
          </p>
        </div>

        {/* Call Goals */}
        {script.callGoals && script.callGoals.length > 0 && (
          <div className="rounded-lg border border-black/6 bg-white p-6 dark:border-white/6 dark:bg-black mb-6">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-4">
              Call Goals ({script.callGoals.length})
            </p>
            <div className="space-y-4">
              {script.callGoals.map((goal, idx) => (
                <div key={idx} className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4">
                  <h4 className="font-medium text-black dark:text-zinc-50 mb-2">{goal.name}</h4>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">{goal.description}</p>
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                      Success:
                    </span>
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">{goal.successCriteria}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Link
            href="/campaigns/make-call"
            className="flex-1 text-center rounded-lg border border-zinc-300 dark:border-zinc-600 px-4 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Back to Make a Call
          </Link>
          <Link
            href={`/campaigns/make-call?script=${scriptId}`}
            className="flex-1 text-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Use This Script
          </Link>
        </div>
      </main>
    </div>
  );
}
