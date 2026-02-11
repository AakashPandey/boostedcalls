"use client";

import { Suspense } from "react";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { PhoneCall, UserPlus, Save } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { LogoutButton } from "../../components/logout-button";

function CreateContactContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reduceMotion = useReducedMotion();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [metadata, setMetadata] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [contactId, setContactId] = useState<string | null>(null);
  const [loadingContact, setLoadingContact] = useState(false);

  useEffect(() => {
    const id = searchParams.get("contactId");
    if (!id) {
      setIsEditMode(false);
      setContactId(null);
      return;
    }

    let isActive = true;
    setIsEditMode(true);
    setContactId(id);
    setLoadingContact(true);
    setError(null);

    fetch(`/api/contacts/${id}`)
      .then(async (res) => {
        if (res.status === 401) {
          router.push("/api/auth/logout");
          return null;
        }

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || "Failed to load contact");
        }

        return res.json();
      })
      .then((data) => {
        if (!data || !isActive) return;
        setName(data.name ?? "");
        setPhone(data.phone ?? "");
        setEmail(data.email ?? "");
        setMetadata(data.metadata ?? "");
      })
      .catch((err) => {
        if (!isActive) return;
        const message = err instanceof Error ? err.message : "Failed to load contact";
        setError(message);
      })
      .finally(() => {
        if (!isActive) return;
        setLoadingContact(false);
      });

    return () => {
      isActive = false;
    };
  }, [router, searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim() || !phone.trim()) {
      setError("Name and phone are required");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const endpoint = isEditMode && contactId ? `/api/contacts/${contactId}` : "/api/contacts";
      const method = isEditMode && contactId ? "PUT" : "POST";
      const res = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || null,
          metadata: metadata.trim() || null,
        }),
      });

      if (res.status === 401) {
        router.push("/api/auth/logout");
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || (isEditMode ? "Failed to update contact" : "Failed to create contact"));
      }

      const data = await res.json().catch(() => ({}));
      const nextContactId = (data?.id as string | undefined) ?? contactId;
      const nextUrl = nextContactId
        ? `/campaigns/make-call?contact=${nextContactId}`
        : "/campaigns/make-call";
      router.push(nextUrl);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create contact";
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

              <p className="text-sm uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">Contact setup</p>
              <h2 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50 mt-2">
                {isEditMode ? "Edit Contact" : "Create Contact"}
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
                {isEditMode
                  ? "Update the contact details and save changes."
                  : "Capture key contact details so you can place calls quickly."}
              </p>
            </div>

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-900/20">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">

              <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-950 space-y-4">

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Taylor Johnson"
                    disabled={loadingContact}
                    className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-950 px-4 py-2 text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black/20 dark:focus:border-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g., +1 (555) 555-5555"
                    disabled={loadingContact}
                    className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-950 px-4 py-2 text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black/20 dark:focus:border-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g., taylor@example.com"
                    disabled={loadingContact}
                    className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-950 px-4 py-2 text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black/20 dark:focus:border-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={metadata}
                    onChange={(e) => setMetadata(e.target.value)}
                    placeholder="Additional context or notes about this contact"
                    rows={3}
                    disabled={loadingContact}
                    className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-950 px-4 py-2 text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black/20 dark:focus:border-white resize-none"
                  />
                </div>
              </div>


            </form>
          </motion.div>

          <motion.aside
            className="space-y-3"
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={reduceMotion ? false : { opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.4, ease: "easeOut", delay: reduceMotion ? 0 : 0.05 }}
          >
            <br />
            <br />
            <br />
            <br />
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400 mb-3">Preview</p>

            <div className="rounded-3xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-950">
              <div className="flex items-start gap-3">
                <div className="shrink-0 flex items-center justify-center h-10 w-10 rounded-lg bg-zinc-100 dark:bg-zinc-900">
                  <UserPlus className="h-5 w-5 text-zinc-600 dark:text-zinc-300" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-black dark:text-zinc-50 truncate">{name ? name : "Name"}</p>
                  <div className="mt-1 flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                    <PhoneCall className="h-4 w-4" />
                    <span className="truncate">{phone ? phone : "Phone number"}</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => formRef.current?.requestSubmit()}
              disabled={submitting || loadingContact || !name.trim() || !phone.trim()}
              className="cursor-pointer w-full inline-flex items-center justify-center gap-2 rounded-full bg-black px-4 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-zinc-50 dark:text-zinc-900"
            >
              {isEditMode ? <Save className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
              {submitting
                ? (isEditMode ? "Saving Contact..." : "Creating Contact...")
                : (isEditMode ? "Save Contact" : "Create Contact")}
            </button>
          </motion.aside>
        </div>
      </motion.main>
    </div>
  );
}

export default function CreateContactPage() {
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
      <CreateContactContent />
    </Suspense>
  );
}
