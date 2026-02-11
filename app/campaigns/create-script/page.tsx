"use client";

import { Suspense } from "react";
import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { FilePlus2, Save } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { LogoutButton } from "../../components/logout-button";

interface CallGoal {
  name: string;
  description: string;
  successCriteria: string;
}

function CreateScriptContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reduceMotion = useReducedMotion();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [firstMessage, setFirstMessage] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [callGoals, setCallGoals] = useState<CallGoal[]>([
    { name: "", description: "", successCriteria: "" },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [scriptId, setScriptId] = useState<string | null>(null);
  const [loadingScript, setLoadingScript] = useState(false);

  useEffect(() => {
    const id = searchParams.get("scriptId");
    if (!id) {
      setIsEditMode(false);
      setScriptId(null);
      return;
    }

    let isActive = true;
    setIsEditMode(true);
    setScriptId(id);
    setLoadingScript(true);
    setError(null);

    fetch(`/api/call-scripts/${id}`)
      .then(async (res) => {
        if (res.status === 401) {
          router.push("/api/auth/logout");
          return null;
        }

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || "Failed to load script");
        }

        return res.json();
      })
      .then((data) => {
        if (!data || !isActive) return;
        setName(data.name ?? "");
        setDescription(data.description ?? "");
        setFirstMessage(data.firstMessage ?? data.first_message ?? "");
        setCustomPrompt(data.customPrompt ?? data.custom_prompt ?? "");
        const goals = data.callGoals ?? data.call_goals ?? [];
        if (Array.isArray(goals) && goals.length > 0) {
          setCallGoals(
            goals.map((goal: any) => ({
              name: goal?.name ?? "",
              description: goal?.description ?? "",
              successCriteria: goal?.successCriteria ?? goal?.success_criteria ?? "",
            }))
          );
        } else {
          setCallGoals([{ name: "", description: "", successCriteria: "" }]);
        }
      })
      .catch((err) => {
        if (!isActive) return;
        const message = err instanceof Error ? err.message : "Failed to load script";
        setError(message);
      })
      .finally(() => {
        if (!isActive) return;
        setLoadingScript(false);
      });

    return () => {
      isActive = false;
    };
  }, [router, searchParams]);

  function addGoal() {
    setCallGoals([...callGoals, { name: "", description: "", successCriteria: "" }]);
  }

  function removeGoal(index: number) {
    if (callGoals.length > 1) {
      setCallGoals(callGoals.filter((_, i) => i !== index));
    }
  }

  function updateGoal(index: number, field: keyof CallGoal, value: string) {
    const updated = [...callGoals];
    updated[index][field] = value;
    setCallGoals(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!name.trim() || !firstMessage.trim() || !customPrompt.trim()) {
      setError("Name, first message, and custom prompt are required");
      return;
    }

    // Filter out empty goals
    const validGoals = callGoals.filter(
      (g) => g.name.trim() && g.description.trim() && g.successCriteria.trim()
    );

    setSubmitting(true);
    setError(null);

    try {
      const endpoint = isEditMode && scriptId ? `/api/call-scripts/${scriptId}` : "/api/call-scripts";
      const method = isEditMode && scriptId ? "PUT" : "POST";
      const res = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          firstMessage: firstMessage.trim(),
          customPrompt: customPrompt.trim(),
          callGoals: validGoals,
        }),
      });

      if (res.status === 401) {
        router.push("/api/auth/logout");
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || (isEditMode ? "Failed to update script" : "Failed to create script"));
      }

      const data = await res.json().catch(() => ({}));
      const nextScriptId = (data?.id as string | undefined) ?? scriptId;
      const nextUrl = nextScriptId
        ? `/campaigns/make-call?script=${nextScriptId}`
        : "/campaigns/make-call";
      router.push(nextUrl);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create script";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <header className="border-b border-black/6 bg-white dark:border-white/6 dark:bg-black">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-4">
            <Image className="invert" src="/vercel.svg" alt="Vercel" width={22} height={22} priority />
            <span className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">BoostedCalls</span>
          </Link>
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

      <motion.main
        className="flex-1 max-w-6xl w-full mx-auto px-6 py-8"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={reduceMotion ? false : { opacity: 1 }}
        transition={{ duration: reduceMotion ? 0 : 0.35, delay: reduceMotion ? 0 : 0.1 }}
      >
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <motion.div
            className="space-y-4"
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={reduceMotion ? false : { opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.4, ease: "easeOut" }}
          >
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">Script setup</p>
              <h2 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50 mt-2">
                {isEditMode ? "Edit Call Script" : "Create Call Script"}
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
                {isEditMode
                  ? "Update the script details and save changes."
                  : "Define the script details and goals for your outbound calls."}
              </p>
            </div>

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-900/20">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
              <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-950 space-y-4">
                <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Basic Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Script Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Car Service Appointment"
                    disabled={loadingScript}
                    className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-950 px-4 py-2 text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black/20 dark:focus:border-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of this script"
                    disabled={loadingScript}
                    className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-950 px-4 py-2 text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black/20 dark:focus:border-white"
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-950 space-y-4">
                <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Call Content</h3>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    First Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={firstMessage}
                    onChange={(e) => setFirstMessage(e.target.value)}
                    placeholder="e.g., Hi, this is James from Car Service Station"
                    rows={2}
                    disabled={loadingScript}
                    className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-950 px-4 py-2 text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black/20 dark:focus:border-white resize-none"
                  />
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    The opening message the AI will use to start the call
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Custom Prompt <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="e.g., We are calling to schedule an appointment for your car service..."
                    rows={4}
                    disabled={loadingScript}
                    className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-950 px-4 py-2 text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black/20 dark:focus:border-white resize-none"
                  />
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Instructions for the AI on how to conduct the call
                  </p>
                </div>
              </div>

              {/* Call Goals moved to aside */}
            </form>
          </motion.div>

          <motion.aside
            className="space-y-3 mt-3"
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={reduceMotion ? false : { opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.4, ease: "easeOut", delay: reduceMotion ? 0 : 0.05 }}
          >
            
            <div className="mt-24 rounded-3xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-950">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Call Goals</h3>
                <button
                  type="button"
                  onClick={addGoal}
                  className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 font-medium"
                >
                  + Add Goal
                </button>
              </div>

              <div className="space-y-4">
                
                {callGoals.map((goal, index) => (
                  <div key={index} className="p-4 border border-black/10 dark:border-white/10 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Goal {index + 1}</span>
                      {callGoals.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeGoal(index)}
                          className="text-sm text-red-600 hover:text-red-700 dark:text-red-400"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      value={goal.name}
                      onChange={(e) => updateGoal(index, "name", e.target.value)}
                      placeholder="Goal name (e.g., Schedule Appointment)"
                      disabled={loadingScript}
                      className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black/20 dark:focus:border-white"
                    />

                    <input
                      type="text"
                      value={goal.description}
                      onChange={(e) => updateGoal(index, "description", e.target.value)}
                      placeholder="Description (e.g., Get the customer to book an appointment)"
                      disabled={loadingScript}
                      className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black/20 dark:focus:border-white"
                    />

                    <input
                      type="text"
                      value={goal.successCriteria}
                      onChange={(e) => updateGoal(index, "successCriteria", e.target.value)}
                      placeholder="Success criteria (e.g., Customer confirms date and time)"
                      disabled={loadingScript}
                      className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black/20 dark:focus:border-white"
                    />
                  </div>
                ))}
              </div>

              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-3">Goals help track what the call should achieve. Empty goals will be ignored.</p>
            </div>

            <div>
              <button
                type="button"
                onClick={() => formRef.current?.requestSubmit()}
                disabled={submitting || loadingScript || !name.trim() || !firstMessage.trim() || !customPrompt.trim()}
                className="mt-2 cursor-pointer w-full inline-flex items-center justify-center gap-2 rounded-full bg-black px-4 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-zinc-50 dark:text-zinc-900"
              >
                {isEditMode ? <Save className="h-4 w-4" /> : <FilePlus2 className="h-4 w-4" />}
                {submitting
                  ? (isEditMode ? "Saving Script..." : "Creating Script...")
                  : (isEditMode ? "Save Script" : "Create Script")}
              </button>
            </div>
          </motion.aside>
        </div>
      </motion.main>
    </div>
  );
}

export default function CreateScriptPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
        <header className="border-b border-black/6 bg-white dark:border-white/6 dark:bg-black">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Image className="invert" src="/vercel.svg" alt="Vercel" width={22} height={22} priority />
              <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">BoostedCalls</h1>
            </div>
          </div>
        </header>
        <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
          <div className="h-8 w-48 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        </main>
      </div>
    }>
      <CreateScriptContent />
    </Suspense>
  );
}
