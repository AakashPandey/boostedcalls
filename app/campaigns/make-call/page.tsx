"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { PhoneCall, UserPlus, FilePlus2, ChevronDown, PencilLine, Search, CheckCircle, X } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { LogoutButton } from "../../components/logout-button";

interface CallScript {
  id: string;
  name: string;
  description: string | null;
  customPrompt: string;
  firstMessage: string;
  callGoals?: Array<{
    name?: string;
  }>;
  custom_prompt?: string;
  first_message?: string;
  call_goals?: Array<{
    name?: string;
  }>;
}

interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string;
  metadata: string | null;
}

function MakeCallContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scriptFromUrl = searchParams.get("script");
  const contactFromUrl = searchParams.get("contact");
  const reduceMotion = useReducedMotion();
  const [scripts, setScripts] = useState<CallScript[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedScript, setSelectedScript] = useState<string>(scriptFromUrl || "");
  const [selectedContact, setSelectedContact] = useState<string>(contactFromUrl || "");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showScriptPicker, setShowScriptPicker] = useState(false);
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [contactQuery, setContactQuery] = useState("");
  const [scriptQuery, setScriptQuery] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "contact" | "script"; id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [scriptsRes, contactsRes] = await Promise.all([
          fetch("/api/call-scripts"),
          fetch("/api/contacts"),
        ]);

        if (scriptsRes.status === 401 || contactsRes.status === 401) {
          router.push("/api/auth/logout");
          return;
        }

        if (!scriptsRes.ok || !contactsRes.ok) {
          throw new Error("Failed to fetch data");
        }

        const scriptsData = await scriptsRes.json();
        const contactsData = await contactsRes.json();

        setScripts(scriptsData);
        setContacts(contactsData);
        if (contactFromUrl) {
          setSelectedContact(contactFromUrl);
        }
        if (scriptFromUrl) {
          setSelectedScript(scriptFromUrl);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [router, contactFromUrl, scriptFromUrl]);

  useEffect(() => {
    if (contactFromUrl) {
      setSelectedContact(contactFromUrl);
    }
  }, [contactFromUrl]);

  useEffect(() => {
    if (scriptFromUrl) {
      setSelectedScript(scriptFromUrl);
    }
  }, [scriptFromUrl]);

  const selectedScriptData = scripts.find((s) => s.id === selectedScript);
  const selectedContactData = contacts.find((c) => c.id === selectedContact);
  const selectedScriptFirstMessage =
    selectedScriptData?.firstMessage ?? (selectedScriptData as any)?.first_message ?? "";
  const selectedScriptCustomPrompt =
    selectedScriptData?.customPrompt ?? (selectedScriptData as any)?.custom_prompt ?? "";
  const selectedScriptGoals =
    selectedScriptData?.callGoals ?? (selectedScriptData as any)?.call_goals ?? [];
  const filteredContacts = contacts.filter((contact) => {
    if (!contactQuery.trim()) return true;
    const query = contactQuery.trim().toLowerCase();
    return (
      contact.name.toLowerCase().includes(query) ||
      contact.phone.toLowerCase().includes(query)
    );
  });
  const filteredScripts = scripts.filter((script) => {
    if (!scriptQuery.trim()) return true;
    const query = scriptQuery.trim().toLowerCase();
    return script.name.toLowerCase().includes(query);
  });

  async function handleDelete() {
    if (!deleteConfirm) return;

    setIsDeleting(true);
    setError(null);

    try {
      const endpoint =
        deleteConfirm.type === "contact"
          ? `/api/contacts/${deleteConfirm.id}/`
          : `/api/call-scripts/${deleteConfirm.id}/`;

      const res = await fetch(endpoint, {
        method: "DELETE",
      });

      if (res.status === 401) {
        router.push("/api/auth/logout");
        return;
      }

      if (!res.ok) {
        try {
          const data = await res.json();
          throw new Error(data.message || `Failed to delete ${deleteConfirm.type}`);
        } catch (parseError) {
          throw new Error(`Failed to delete ${deleteConfirm.type} (${res.status})`);
        }
      }

      // Remove from state
      if (deleteConfirm.type === "contact") {
        setContacts(contacts.filter((c) => c.id !== deleteConfirm.id));
        if (selectedContact === deleteConfirm.id) {
          setSelectedContact("");
        }
      } else {
        setScripts(scripts.filter((s) => s.id !== deleteConfirm.id));
        if (selectedScript === deleteConfirm.id) {
          setSelectedScript("");
        }
      }

      setDeleteConfirm(null);
    } catch (err: any) {
      setError(err.message || `Failed to delete ${deleteConfirm.type}`);
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleMakeCall() {
    if (!selectedScript || !selectedContact) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/calls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contactId: selectedContact,
          scriptId: selectedScript,
        }),
      });

      if (res.status === 401) {
        router.push("/api/auth/logout");
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to place call");
      }

      router.push("/campaigns");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to place call");
      setShowConfirmation(false);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
        <header className="border-b border-black/6 bg-white dark:border-white/6 dark:bg-black">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Image className="invert" src="/vercel.svg" alt="Vercel" width={22} height={22} priority />
              <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">BoostedCalls</h1>
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
        <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="h-3 w-24 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-8 w-56 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-4 w-96 max-w-full rounded-lg bg-zinc-200 dark:bg-zinc-800" />
              </div>
              <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-950 space-y-3">
                <div className="h-4 w-24 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-6 w-48 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-4 w-64 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
              </div>
              <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-950 space-y-3">
                <div className="h-4 w-24 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-6 w-48 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-4 w-64 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-4 w-72 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
              </div>
            </div>
            <aside className="space-y-4">
              <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950 space-y-3">
                <div className="h-4 w-28 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-6 w-40 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-4 w-56 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-10 w-full rounded-full bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-10 w-full rounded-full bg-zinc-200 dark:bg-zinc-800" />
              </div>
              <div className="h-12 w-full rounded-full bg-zinc-200 dark:bg-zinc-800" />
            </aside>
          </div>
        </main>
      </div>
    );
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
        {/* <Link href="/campaigns" className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 mb-6 inline-block">
          ← Back to Campaigns
        </Link> */}

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <motion.div
            className="space-y-4"
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={reduceMotion ? false : { opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.4, ease: "easeOut" }}
          >
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">Call setup</p>
              <h2 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50 mt-2">Make a Call</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
                Select a script and a contact, preview the details, then place your call.
              </p>
            </div>

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-900/20">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-950 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Contact</p>
                  <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    {selectedContactData ? selectedContactData.name : "No contact selected"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {selectedContactData && (
                    <button
                      onClick={() => router.push(`/campaigns/create-contact?contactId=${selectedContactData.id}`)}
                      className="inline-flex items-center gap-2 rounded-full border border-black/10 px-3 py-2 text-sm text-zinc-700 hover:bg-black/5 dark:border-white/10 dark:text-zinc-200 dark:hover:bg-white/5"
                    >
                      <PencilLine className="h-4 w-4" />
                      Edit Contact
                    </button>
                  )}
                  <button
                    onClick={() => setShowContactPicker(true)}
                    className="inline-flex items-center gap-2 rounded-full border border-black/10 px-4 py-2 text-sm text-zinc-700 hover:bg-black/5 dark:border-white/10 dark:text-zinc-200 dark:hover:bg-white/5"
                  >
                    <ChevronDown className="h-4 w-4" />
                    {selectedContactData ? "Change" : "Select"}
                  </button>
                </div>
              </div>
              {selectedContactData ? (
                <div className="space-y-1">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{selectedContactData.phone}</p>
                  {selectedContactData.email && (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{selectedContactData.email}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Pick the contact you want to call.
                </p>
              )}
            </div>

            <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-950 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Script</p>
                  <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    {selectedScriptData ? selectedScriptData.name : "No script selected"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {selectedScriptData && (
                    <button
                      onClick={() => router.push(`/campaigns/create-script?scriptId=${selectedScriptData.id}`)}
                      className="inline-flex items-center gap-2 rounded-full border border-black/10 px-3 py-2 text-sm text-zinc-700 hover:bg-black/5 dark:border-white/10 dark:text-zinc-200 dark:hover:bg-white/5"
                    >
                      <PencilLine className="h-4 w-4" />
                      Edit Script
                    </button>
                  )}
                  <button
                    onClick={() => setShowScriptPicker(true)}
                    className="inline-flex items-center gap-2 rounded-full border border-black/10 px-4 py-2 text-sm text-zinc-700 hover:bg-black/5 dark:border-white/10 dark:text-zinc-200 dark:hover:bg-white/5"
                  >
                    <ChevronDown className="h-4 w-4" />
                    {selectedScriptData ? "Change" : "Select"}
                  </button>
                </div>
              </div>
              {selectedScriptData ? (
                <div className="max-h-48 overflow-y-auto pr-2 space-y-3">
                  {selectedScriptData.description && (
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Description</p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">{selectedScriptData.description}</p>
                    </div>
                  )}
                  {selectedScriptFirstMessage && (
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">First message</p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 italic">
                        &quot;{selectedScriptFirstMessage}&quot;
                      </p>
                    </div>
                  )}
                  {selectedScriptCustomPrompt && (
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Custom prompt</p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">{selectedScriptCustomPrompt}</p>
                    </div>
                  )}
                  {selectedScriptGoals.length > 0 && (
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Goals</p>
                      <ul className="list-disc pl-4 text-sm text-zinc-600 dark:text-zinc-400">
                        {selectedScriptGoals.map((goal: any, index: number) => (
                          <li key={`${goal?.name ?? "goal"}-${index}`}>{goal?.name ?? "Goal"}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Choose a call script to generate the conversation flow.
                </p>
              )}
            </div>
          </motion.div>

          <motion.aside
            className="space-y-2"
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={reduceMotion ? false : { opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.4, ease: "easeOut", delay: reduceMotion ? 0 : 0.05 }}
          >

             <p className="text-sm uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">Quick actions</p>
              <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                Add new data
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 ">
                Need a fresh script or contact? Create them here.
              </p>
            
              <br />
            <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950">
             
              <div className="mt-2 flex flex-col gap-3">
                <Link
                  href="/campaigns/create-contact"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-black/10 px-4 py-3 text-center text-sm font-medium text-zinc-900 transition hover:-translate-y-0.5 hover:bg-black/5 dark:border-white/10 dark:text-zinc-50 dark:hover:bg-white/5"
                >
                  <UserPlus className="h-4 w-4" />
                  Add a New Contact
                </Link>
                <Link
                  href="/campaigns/create-script"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-black/10 px-4 py-3 text-center text-sm font-medium text-zinc-900 transition hover:-translate-y-0.5 hover:bg-black/5 dark:border-white/10 dark:text-zinc-50 dark:hover:bg-white/5"
                >
                  <FilePlus2 className="h-4 w-4" />
                  Add a New Script
                </Link>
              </div>
            </div>
            <br />
            <button
              onClick={() => setShowConfirmation(true)}
              disabled={!selectedScript || !selectedContact}
              className="cursor-pointer w-full inline-flex items-center justify-center gap-2 rounded-full bg-black px-4 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-zinc-50 dark:text-zinc-900"
            >
              <PhoneCall className="h-4 w-4" />
              Place Call
            </button>
          </motion.aside>
        </div>
      </motion.main>

      {/* Confirmation Modal */}
      {showConfirmation && selectedScriptData && selectedContactData && (
        <motion.div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={reduceMotion ? false : { opacity: 1 }}
          transition={{ duration: reduceMotion ? 0 : 0.2 }}
        >
          <motion.div
            className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full p-6 shadow-xl"
            initial={reduceMotion ? false : { opacity: 0, y: 14, scale: 0.98 }}
            animate={reduceMotion ? false : { opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: reduceMotion ? 0 : 0.3, ease: "easeOut" }}
          >
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-4">Confirm Call</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1">
                  Script
                </p>
                <p className="text-zinc-900 dark:text-zinc-50 font-medium">{selectedScriptData.name}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1">
                  Contact
                </p>
                <p className="text-zinc-900 dark:text-zinc-50 font-medium">{selectedContactData.name}</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{selectedContactData.phone}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1">
                  First Message
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 italic">
                  &quot;{selectedScriptFirstMessage}&quot;
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmation(false)}
                disabled={submitting}
                className="flex-1 rounded-full border border-zinc-300 dark:border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleMakeCall}
                disabled={submitting}
                className="flex-1 rounded-full bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90 disabled:opacity-50 transition-colors dark:bg-zinc-50 dark:text-zinc-900"
              >
                {submitting ? "Placing Call..." : "Place Call"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {showScriptPicker && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/60 p-4"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={reduceMotion ? false : { opacity: 1 }}
          transition={{ duration: reduceMotion ? 0 : 0.2 }}
          onClick={() => setShowScriptPicker(false)}
        >
          <div className="mx-auto flex h-full max-w-3xl items-center justify-center">
            <motion.div
              className="w-full rounded-3xl border border-black/10 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-zinc-950"
              initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.98 }}
              animate={reduceMotion ? false : { opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: reduceMotion ? 0 : 0.25, ease: "easeOut" }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">Select script</p>
                  {/* <h3 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Call scripts</h3> */}
                </div>
                <button
                  onClick={() => setShowScriptPicker(false)}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-black/10 px-3 py-1 text-sm text-zinc-700 hover:bg-black/5 dark:border-white/10 dark:text-zinc-200 dark:hover:bg-white/5"
                >
                  <X className="h-4 w-4" />
                  Close
                </button>
              </div>
              <div className="relative mt-4">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 dark:text-zinc-400" />
                <input
                  value={scriptQuery}
                  onChange={(event) => setScriptQuery(event.target.value)}
                  placeholder="Search scripts by name"
                  className="w-full rounded-full border border-black/10 bg-white px-10 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black/20 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-white"
                />
              </div>
              <div className="mt-4 max-h-[60vh] overflow-y-auto space-y-3 pr-2">
                {filteredScripts.length === 0 ? (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {scripts.length === 0 ? "No scripts available" : "No scripts match your search"}
                  </p>
                ) : (
                  filteredScripts.map((script) => (
                    <div
                      key={script.id}
                      className={`w-full rounded-2xl border p-4 text-left transition cursor-pointer ${
                        selectedScript === script.id
                          ? "border-black bg-black/5 dark:border-white/20 dark:bg-white/5"
                          : "border-black/10 hover:border-black/20 dark:border-white/10 dark:hover:border-white/20"
                      }`}
                      onClick={() => {
                        setSelectedScript(script.id);
                        setShowScriptPicker(false);
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="font-medium text-zinc-900 dark:text-zinc-50">{script.name}</p>
                          {script.description && (
                            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{script.description}</p>
                          )}
                          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 italic">
                            &quot;{(script as any).firstMessage ?? (script as any).first_message}&quot;
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirm({
                                type: "script",
                                id: script.id,
                                name: script.name,
                              });
                            }}
                            className="inline-flex items-center gap-1 rounded-full border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-900/20"
                            title="Delete script"
                          >
                            <X className="h-3 w-3" />
                            Delete
                          </button>
                          <span className="inline-flex items-center gap-1 rounded-full border border-black/10 px-3 py-1 text-xs text-zinc-600 dark:border-white/10 dark:text-zinc-400">
                            <CheckCircle className="h-3.5 w-3.5" />
                            Select
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}

      {showContactPicker && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/60 p-4"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={reduceMotion ? false : { opacity: 1 }}
          transition={{ duration: reduceMotion ? 0 : 0.2 }}
          onClick={() => setShowContactPicker(false)}
        >
          <div className="mx-auto flex h-full max-w-3xl items-center justify-center">
            <motion.div
              className="w-full rounded-3xl border border-black/10 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-zinc-950"
              initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.98 }}
              animate={reduceMotion ? false : { opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: reduceMotion ? 0 : 0.25, ease: "easeOut" }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">Select contact</p>
                  {/* <h3 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Contacts</h3> */}
                </div>
                <button
                  onClick={() => setShowContactPicker(false)}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-black/10 px-3 py-1 text-sm text-zinc-700 hover:bg-black/5 dark:border-white/10 dark:text-zinc-200 dark:hover:bg-white/5"
                >
                  <X className="h-4 w-4" />
                  Close
                </button>
              </div>
              <div className="relative mt-4">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 dark:text-zinc-400" />
                <input
                  value={contactQuery}
                  onChange={(event) => setContactQuery(event.target.value)}
                  placeholder="Search by name or phone"
                  className="w-full rounded-full border border-black/10 bg-white px-10 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black/20 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-white"
                />
              </div>
              <div className="mt-4 max-h-[60vh] overflow-y-auto space-y-3 pr-2">
                {filteredContacts.length === 0 ? (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {contacts.length === 0 ? "No contacts available" : "No contacts match your search"}
                  </p>
                ) : (
                  filteredContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className={`w-full rounded-2xl border p-4 text-left transition cursor-pointer ${
                        selectedContact === contact.id
                          ? "border-black bg-black/5 dark:border-white/20 dark:bg-white/5"
                          : "border-black/10 hover:border-black/20 dark:border-white/10 dark:hover:border-white/20"
                      }`}
                      onClick={() => {
                        setSelectedContact(contact.id);
                        setShowContactPicker(false);
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="font-medium text-zinc-900 dark:text-zinc-50">{contact.name}</p>
                          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{contact.phone}</p>
                          {contact.email && (
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">{contact.email}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirm({
                                type: "contact",
                                id: contact.id,
                                name: contact.name,
                              });
                            }}
                            className="inline-flex items-center gap-1 rounded-full border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-900/20"
                            title="Delete contact"
                          >
                            <X className="h-3 w-3" />
                            Delete
                          </button>
                          <span className="inline-flex items-center gap-1 rounded-full border border-black/10 px-3 py-1 text-xs text-zinc-600 dark:border-white/10 dark:text-zinc-400">
                            <CheckCircle className="h-3.5 w-3.5" />
                            Select
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <motion.div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={reduceMotion ? false : { opacity: 1 }}
          transition={{ duration: reduceMotion ? 0 : 0.2 }}
        >
          <motion.div
            className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full p-6 shadow-xl"
            initial={reduceMotion ? false : { opacity: 0, y: 14, scale: 0.98 }}
            animate={reduceMotion ? false : { opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: reduceMotion ? 0 : 0.3, ease: "easeOut" }}
          >
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
              Delete {deleteConfirm.type === "contact" ? "Contact" : "Script"}?
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
              Are you sure you want to delete <span className="font-semibold">{deleteConfirm.name}</span>? This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={isDeleting}
                className="flex-1 rounded-full border border-zinc-300 dark:border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

export default function MakeCallPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
        <header className="border-b border-black/6 bg-white dark:border-white/6 dark:bg-black">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Image className="invert" src="/vercel.svg" alt="Vercel" width={22} height={22} priority />
              <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">BoostedCalls</h1>
            </div>
          </div>
        </header>
        <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="h-3 w-24 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-8 w-56 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-4 w-96 max-w-full rounded-lg bg-zinc-200 dark:bg-zinc-800" />
              </div>
              <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-950 space-y-3">
                <div className="h-4 w-24 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-6 w-48 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-4 w-64 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
              </div>
              <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-950 space-y-3">
                <div className="h-4 w-24 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-6 w-48 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-4 w-64 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-4 w-72 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
              </div>
            </div>
            <aside className="space-y-4">
              <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950 space-y-3">
                <div className="h-4 w-28 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-6 w-40 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-4 w-56 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-10 w-full rounded-full bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-10 w-full rounded-full bg-zinc-200 dark:bg-zinc-800" />
              </div>
              <div className="h-12 w-full rounded-full bg-zinc-200 dark:bg-zinc-800" />
            </aside>
          </div>
        </main>
      </div>
    }>
      <MakeCallContent />
    </Suspense>
  );
}
