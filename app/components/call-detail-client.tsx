"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import {
    Phone,
    Clock,
    DollarSign,
    Calendar,
    User,
    FileText,
    Play,
    Pause,
    Volume2,
    ChevronDown,
    AlertCircle,
    Mic,
    Bot,
    Sparkles,
    ScrollText,
    BarChart3,
    Zap,
    PhoneOff,
} from "lucide-react";
import { useSSE } from "@/app/hooks/use-sse";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Message {
    role: "system" | "bot" | "user";
    time: number;
    message: string;
    duration?: number;
    secondsFromStart?: number;
}

interface CostBreakdown {
    llm?: number;
    stt?: number;
    tts?: number;
    vapi?: number;
    total?: number;
    transport?: number;
    ttsCharacters?: number;
    llmPromptTokens?: number;
    llmCompletionTokens?: number;
    llmCachedPromptTokens?: number;
    chat?: number;
    knowledgeBaseCost?: number;
    voicemailDetectionCost?: number;
}

interface CallDetail {
    id: string;
    userId?: string;
    user_id?: number;
    contactId?: string;
    contact_id?: string;
    contact?: string;
    scriptId?: string;
    script_id?: string;
    script?: string;
    vapi_call_id?: string;
    assistant_id?: string;
    phone_number_id?: string;
    status: string;
    outcome: string | null;
    transcript: string | null;
    summary: string | null;
    analysis: string | null;
    durationSeconds: number | null;
    duration_seconds?: number | null;
    startedAt: string | null;
    started_at?: string | null;
    endedAt: string | null;
    ended_at?: string | null;
    createdAt?: string;
    created_at?: string;
    updatedAt?: string;
    updated_at?: string;
    error_message?: string | null;
    metadata: {
        messages: Message[];
        recordingUrl: string;
        stereoRecordingUrl: string;
        cost: number;
        costBreakdown?: CostBreakdown;
    } | string | null;
}

interface Contact {
    id: string;
    userId: string;
    name: string;
    phone: string;
    email: string;
    metadata: string | null;
}

interface CallScript {
    id: string;
    userId: string;
    name: string;
    description: string | null;
    customPrompt: string;
    firstMessage: string;
    callGoals: Array<{
        name: string;
        description: string;
        successCriteria: string;
    }>;
    createdAt: string;
    updatedAt: string;
}

interface CallDetailClientProps {
    initialCall: CallDetail;
    initialContact: Contact | null;
    initialScript: CallScript | null;
    contactError: string | null;
    scriptError: string | null;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatDate(dateString: string | null): string {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatShortDate(dateString: string | null): string {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function calculateDuration(messages: Message[]): string {
    if (messages.length === 0) return "0s";
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg.secondsFromStart) return "0s";
    const seconds = Math.floor(lastMsg.secondsFromStart);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
}

function formatAudioTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDurationFromSecs(totalSeconds: number | null | undefined): string {
    if (!totalSeconds || totalSeconds <= 0) return "0s";
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

function parseMetadata(raw: any): {
    messages: Message[];
    recordingUrl: string;
    stereoRecordingUrl: string;
    cost: number;
    costBreakdown?: CostBreakdown;
} | null {
    if (!raw) return null;
    if (typeof raw === "string") {
        try {
            return JSON.parse(raw);
        } catch {
            return null;
        }
    }
    return raw;
}

function parseAnalysis(raw: string | null): Record<string, { name: string; result: string }> | null {
    if (!raw) return null;
    try {
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        return parsed?.structuredOutputs ?? null;
    } catch {
        return null;
    }
}

function getStatusConfig(status: string) {
    const map: Record<string, { bg: string; text: string; dot: string; label: string }> = {
        completed: { bg: "bg-emerald-100 dark:bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500", label: "Completed" },
        failed: { bg: "bg-red-100 dark:bg-red-500/10", text: "text-red-700 dark:text-red-400", dot: "bg-red-500", label: "Failed" },
        pending: { bg: "bg-amber-100 dark:bg-amber-500/10", text: "text-amber-700 dark:text-amber-400", dot: "bg-amber-500 animate-pulse", label: "Pending" },
        queued: { bg: "bg-amber-100 dark:bg-amber-500/10", text: "text-amber-700 dark:text-amber-400", dot: "bg-amber-500 animate-pulse", label: "Queued" },
        initiated: { bg: "bg-blue-100 dark:bg-blue-500/10", text: "text-blue-700 dark:text-blue-400", dot: "bg-blue-500 animate-pulse", label: "Initiated" },
        ringing: { bg: "bg-blue-100 dark:bg-blue-500/10", text: "text-blue-700 dark:text-blue-400", dot: "bg-blue-500 animate-pulse", label: "Ringing" },
        "in-progress": { bg: "bg-blue-100 dark:bg-blue-500/10", text: "text-blue-700 dark:text-blue-400", dot: "bg-blue-500 animate-pulse", label: "In Progress" },
    };
    return map[status] || map.pending;
}

/* ------------------------------------------------------------------ */
/*  Audio Player                                                       */
/* ------------------------------------------------------------------ */

function AudioPlayer({ src }: { src: string }) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [playing, setPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const onTimeUpdate = () => setCurrentTime(audio.currentTime);
        const onDuration = () => setDuration(audio.duration || 0);
        const onEnded = () => setPlaying(false);

        audio.addEventListener("timeupdate", onTimeUpdate);
        audio.addEventListener("loadedmetadata", onDuration);
        audio.addEventListener("ended", onEnded);

        return () => {
            audio.removeEventListener("timeupdate", onTimeUpdate);
            audio.removeEventListener("loadedmetadata", onDuration);
            audio.removeEventListener("ended", onEnded);
        };
    }, []);

    const toggle = () => {
        const audio = audioRef.current;
        if (!audio) return;
        if (playing) {
            audio.pause();
        } else {
            audio.play();
        }
        setPlaying(!playing);
    };

    const seek = (e: React.MouseEvent<HTMLDivElement>) => {
        const audio = audioRef.current;
        if (!audio || !duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const pct = (e.clientX - rect.left) / rect.width;
        audio.currentTime = pct * duration;
    };

    const progress = duration ? (currentTime / duration) * 100 : 0;

    return (
        <div className="flex items-center gap-3">
            <audio ref={audioRef} src={src} preload="metadata" />

            <button
                onClick={toggle}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black/5 text-zinc-900 transition hover:bg-black/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
            >
                {playing ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
            </button>

            <div className="flex-1 space-y-1">
                <div
                    className="group relative h-1.5 cursor-pointer rounded-full bg-black/10 dark:bg-white/10"
                    onClick={seek}
                >
                    <div
                        className="absolute inset-y-0 left-0 rounded-full bg-black/60 dark:bg-white/70 transition-all"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <div className="flex justify-between text-[10px] text-zinc-500">
                    <span>{formatAudioTime(currentTime)}</span>
                    <span>{formatAudioTime(duration)}</span>
                </div>
            </div>

            <Volume2 className="h-4 w-4 shrink-0 text-zinc-400" />
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Section Wrapper                                                    */
/* ------------------------------------------------------------------ */

function Section({
    children,
    delay = 0,
}: {
    children: React.ReactNode;
    delay?: number;
}) {
    const reduceMotion = useReducedMotion();
    return (
        <motion.div
            className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-950"
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            animate={reduceMotion ? false : { opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: reduceMotion ? 0 : delay }}
        >
            {children}
        </motion.div>
    );
}

/* ------------------------------------------------------------------ */
/*  Collapsible Section                                                */
/* ------------------------------------------------------------------ */

function CollapsibleSection({
    title,
    icon: Icon,
    children,
    defaultOpen = false,
    delay = 0,
}: {
    title: string;
    icon: React.ElementType;
    children: React.ReactNode;
    defaultOpen?: boolean;
    delay?: number;
}) {
    const [open, setOpen] = useState(defaultOpen);
    const reduceMotion = useReducedMotion();

    return (
        <motion.div
            className="rounded-3xl border border-black/10 bg-white overflow-hidden shadow-sm dark:border-white/10 dark:bg-zinc-950"
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            animate={reduceMotion ? false : { opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: reduceMotion ? 0 : delay }}
        >
            <button
                onClick={() => setOpen(!open)}
                className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-white/5"
            >
                <div className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-200">{title}</span>
                </div>
                <ChevronDown
                    className={`h-4 w-4 text-zinc-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                />
            </button>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <div className="border-t border-black/6 px-5 py-4 dark:border-white/6">{children}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

/* ------------------------------------------------------------------ */
/*  Chat Messages (inline)                                             */
/* ------------------------------------------------------------------ */

function ChatBubble({ msg, customerName, index }: { msg: Message; customerName: string; index: number }) {
    const isBot = msg.role === "bot";
    const reduceMotion = useReducedMotion();

    return (
        <motion.div
            className={`flex ${isBot ? "justify-start" : "justify-end"}`}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={reduceMotion ? false : { opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: reduceMotion ? 0 : index * 0.03 }}
        >
            <div className={`max-w-[80%] space-y-1 ${isBot ? "" : "items-end text-right"}`}>
                <div className="flex items-center gap-1.5 px-1">
                    {isBot ? (
                        <Bot className="h-3 w-3 text-zinc-400" />
                    ) : (
                        <Mic className="h-3 w-3 text-zinc-400" />
                    )}
                    <span className="text-[11px] font-medium text-zinc-500">
                        {isBot ? "AI Agent" : customerName}
                    </span>
                    {msg.secondsFromStart !== undefined && (
                        <span className="text-[10px] text-zinc-400">
                            {formatAudioTime(msg.secondsFromStart)}
                        </span>
                    )}
                </div>
                <div
                    className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${isBot
                        ? "bg-zinc-100 text-zinc-900 dark:bg-white/5 dark:text-zinc-200"
                        : "bg-zinc-900 text-white dark:bg-white/10 dark:text-zinc-100"
                        }`}
                >
                    {msg.message}
                </div>
            </div>
        </motion.div>
    );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function CallDetailClient({
    initialCall,
    initialContact,
    initialScript,
    contactError,
    scriptError,
}: CallDetailClientProps) {
    const router = useRouter();
    const reduceMotion = useReducedMotion();
    const [call, setCall] = useState<CallDetail>(initialCall);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [contact, setContact] = useState<Contact | null>(initialContact);
    const [script, setScript] = useState<CallScript | null>(initialScript);

    const pendingStatuses = ["pending", "queued", "initiated", "ringing", "in-progress"];
    const shouldSubscribe = pendingStatuses.includes(call.status);

    /* SSE live update */
    const handleSSEEvent = useCallback(
        async (event: any) => {
            if (event.callId && event.callId !== call.id) return;
            setIsRefreshing(true);
            try {
                const res = await fetch(`/api/calls/${call.id}`);
                if (res.status === 401) {
                    router.push("/api/auth/logout");
                    return;
                }
                if (res.ok) {
                    const updated = await res.json();
                    setCall((prev) => ({
                        ...prev,
                        ...updated,
                        status: updated.status ?? prev.status,
                        outcome: updated.outcome ?? prev.outcome,
                        startedAt: updated.startedAt ?? updated.started_at ?? prev.startedAt,
                        endedAt: updated.endedAt ?? updated.ended_at ?? prev.endedAt,
                        durationSeconds: updated.durationSeconds ?? updated.duration_seconds ?? prev.durationSeconds,
                        summary: updated.summary ?? prev.summary,
                        transcript: updated.transcript ?? prev.transcript,
                        analysis: updated.analysis ?? prev.analysis,
                        error_message: updated.error_message ?? prev.error_message,
                        metadata: updated.metadata ?? prev.metadata,
                    }));
                }
            } catch (err) {
                console.error("[SSE] Error refreshing call:", err);
            } finally {
                setIsRefreshing(false);
            }
        },
        [call.id, router],
    );

    useSSE({
        channels: [`call:${call.id}`],
        onEvent: handleSSEEvent,
        enabled: shouldSubscribe,
    });

    /* Computed */
    const meta = parseMetadata(call.metadata);
    const messages = meta?.messages ?? [];
    const chatMessages = messages.filter((m) => m.role !== "system");
    const statusCfg = getStatusConfig(call.status);
    const recordingUrl = meta?.recordingUrl || meta?.stereoRecordingUrl || "";

    const durationSecs = call.durationSeconds ?? call.duration_seconds ?? null;
    const duration = durationSecs ? formatDurationFromSecs(durationSecs) : calculateDuration(messages);

    const createdAt = call.createdAt ?? call.created_at ?? null;
    const startedAt = call.startedAt ?? call.started_at ?? null;
    const endedAt = call.endedAt ?? call.ended_at ?? null;
    const cost = meta?.cost ?? 0;
    const costBreakdown = meta?.costBreakdown ?? null;
    const summary = call.summary ?? null;
    const transcript = call.transcript ?? null;
    const analysis = parseAnalysis(call.analysis ?? null);
    const errorMessage = call.error_message ?? null;

    const contactName = contact?.name ?? "Customer";

    /* Render */
    return (
        <div className="pb-4 space-y-3">
            {/* ── Top: Summary + Contact (two-column) ─────────────────── */}
            <Section delay={0}>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px] items-start">
                    {/* LEFT: status + stats + summary */}
                    <div className="flex flex-col gap-4 min-w-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${statusCfg.bg} ${statusCfg.text}`}>
                                    <span className={`inline-block h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
                                    {statusCfg.label}
                                    {call.outcome && ` · ${call.outcome}`}
                                </div>
                                {isRefreshing && (
                                    <svg className="h-3.5 w-3.5 animate-spin text-zinc-500" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                )}
                            </div>

                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                            <div className="rounded-xl bg-zinc-50 px-3.5 py-3 dark:bg-white/5">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <Clock className="h-3 w-3 text-zinc-400" />
                                    <span className="text-[10px] uppercase tracking-wider text-zinc-500">Duration</span>
                                </div>
                                <p className="text-lg font-semibold text-zinc-900 dark:text-white">{duration}</p>
                            </div>
                            <div className="rounded-xl bg-zinc-50 px-3.5 py-3 dark:bg-white/5">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <Phone className="h-3 w-3 text-zinc-400" />
                                    <span className="text-[10px] uppercase tracking-wider text-zinc-500">Started</span>
                                </div>
                                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{formatShortDate(startedAt)}</p>
                            </div>
                            <div className="rounded-xl bg-zinc-50 px-3.5 py-3 dark:bg-white/5">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <PhoneOff className="h-3 w-3 text-zinc-400" />
                                    <span className="text-[10px] uppercase tracking-wider text-zinc-500">Ended</span>
                                </div>
                                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{formatShortDate(endedAt)}</p>
                            </div>
                            <div className="rounded-xl bg-zinc-50 px-3.5 py-3 dark:bg-white/5">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <DollarSign className="h-3 w-3 text-zinc-400" />
                                    <span className="text-[10px] uppercase tracking-wider text-zinc-500">Cost</span>
                                </div>
                                <p className="text-lg font-semibold text-zinc-900 dark:text-white">${typeof cost === "number" ? cost.toFixed(4) : cost}</p>
                            </div>
                            <div className="rounded-xl bg-zinc-50 px-3.5 py-3 dark:bg-white/5">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <Calendar className="h-3 w-3 text-zinc-400" />
                                    <span className="text-[10px] uppercase tracking-wider text-zinc-500">Created</span>
                                </div>
                                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{formatShortDate(createdAt)}</p>
                            </div>
                        </div>

                        {summary && (
                            <div>
                                <div className="flex items-center gap-2 mb-3 mt-1">
                                    <Sparkles className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-200">AI Summary</span>
                                </div>
                                <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{summary}</p>
                            </div>
                        )}
                    </div>

                    {/* RIGHT: persistent contact card */}
                    <div className="min-w-0 mt-4">
                        <div className="rounded-2xl border border-black/6 bg-white px-4 py-4 dark:border-white/6 dark:bg-black">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-zinc-500 uppercase tracking-wider">Contact</p>
                                    <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-1">{contact?.name ?? "Customer"}</p>
                                </div>

                                <div className="text-right">
                                    <p className="text-[11px] text-zinc-500">{contact?.phone ?? "—"}</p>
                                    <p className="text-[11px] text-zinc-400 mt-1">{contact?.email ?? "—"}</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-start gap-0.5">
                                <span className="font-mono text-[11px] text-zinc-400" title={call.id}>
                                    ID: {call.id?.slice(0, 4)}…{call.id?.slice(-4)}
                                </span>
                                {call.vapi_call_id && (
                                    <span className="font-mono text-[10px] text-zinc-400/70" title={call.vapi_call_id}>
                                        VAPI: {call.vapi_call_id.slice(0, 4)}…{call.vapi_call_id.slice(-4)}
                                    </span>
                                )}
                            </div>
                            {contact?.metadata && (
                                <div className="mt-3 pt-3 border-t border-black/6 dark:border-white/6">
                                    <p className="text-xs text-zinc-500 uppercase tracking-wider">Notes</p>
                                    <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-1">{contact.metadata}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Section>

            {/* ── Full-width: Error Message ────────────────────────────── */}
            {errorMessage && (
                <Section delay={0.03}>
                    <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                        <div>
                            <span className="text-sm font-medium text-red-700 dark:text-red-400">Error</span>
                            <p className="text-sm text-red-600 dark:text-red-300 mt-0.5">{errorMessage}</p>
                        </div>
                    </div>
                </Section>
            )}


            {/* ── Two-Column Grid ──────────────────────────────────────── */}
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_380px]">
                {/* ── LEFT COLUMN: Conversation & media ────────────────── */}
                <div className="space-y-3 min-w-0">
                    {/* Recording */}
                    {recordingUrl && (
                        <Section delay={0.06}>
                            <div className="flex items-center gap-2 mb-3">
                                <Mic className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-200">Voice Recording</span>
                            </div>
                            <AudioPlayer src={recordingUrl} />
                        </Section>
                    )}

                                        {/* Script Details */}
                    {script && (
                        <CollapsibleSection title={`Script — ${script.name}`} icon={FileText} delay={0.11}>
                            <div className="space-y-4">
                                {script.description && (
                                    <div>
                                        <span className="text-[10px] uppercase tracking-wider text-zinc-500">Description</span>
                                        <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-0.5">{script.description}</p>
                                    </div>
                                )}
                                <div>
                                    <span className="text-[10px] uppercase tracking-wider text-zinc-500">First Message</span>
                                    <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-0.5 italic">
                                        &quot;{script.firstMessage ?? (script as any).first_message ?? "—"}&quot;
                                    </p>
                                </div>
                                <div>
                                    <span className="text-[10px] uppercase tracking-wider text-zinc-500">Custom Prompt</span>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-0.5 whitespace-pre-wrap">
                                        {script.customPrompt ?? (script as any).custom_prompt ?? "—"}
                                    </p>
                                </div>
                                {((script.callGoals ?? (script as any).call_goals) || []).length > 0 && (
                                    <div>
                                        <span className="text-[10px] uppercase tracking-wider text-zinc-500">Call Goals</span>
                                        <div className="mt-2 space-y-2">
                                            {(script.callGoals ?? (script as any).call_goals ?? []).map(
                                                (goal: any, idx: number) => (
                                                    <div
                                                        key={idx}
                                                        className="rounded-xl bg-zinc-50 px-3.5 py-2.5 dark:bg-white/5"
                                                    >
                                                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-200">{goal.name}</p>
                                                        {goal.description && (
                                                            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">{goal.description}</p>
                                                        )}
                                                        {(goal.successCriteria ?? goal.success_criteria) && (
                                                            <p className="text-[11px] text-zinc-500 mt-1">
                                                                Success: {goal.successCriteria ?? goal.success_criteria}
                                                            </p>
                                                        )}
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CollapsibleSection>
                    )}

                    {scriptError && (
                        <motion.div
                            className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-center gap-2 dark:border-amber-500/20 dark:bg-amber-500/5"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                            <p className="text-sm text-amber-800 dark:text-amber-300">{scriptError}</p>
                        </motion.div>
                    )}

                    {/* Conversation */}
                    <Section delay={0.08}>
                        <div className="flex items-center gap-2 mb-4">
                            <Phone className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-200">Conversation</span>
                            <span className="ml-auto text-[11px] text-zinc-400">{chatMessages.length} messages</span>
                        </div>

                        {chatMessages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <Phone className="h-8 w-8 text-zinc-300 dark:text-zinc-700 mb-3" />
                                <p className="text-sm text-zinc-500">No messages recorded for this call.</p>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                                {chatMessages.map((msg, idx) => (
                                    <ChatBubble
                                        key={idx}
                                        msg={msg}
                                        customerName={contactName}
                                        index={idx}
                                    />
                                ))}
                            </div>
                        )}
                    </Section>

                    {/* here */}

                </div>

                {/* ── RIGHT COLUMN: Details & metadata ─────────────────── */}
                <div className="space-y-3 min-w-0">
                    {/* Analysis / Structured Outputs */}
                    {analysis && Object.keys(analysis).length > 0 && (
                        <CollapsibleSection title="Analysis" icon={BarChart3} defaultOpen delay={0.07}>
                            <div className="space-y-3">
                                {Object.entries(analysis).map(([key, value]) => (
                                    <div key={key} className="rounded-xl bg-zinc-50 px-3.5 py-3 dark:bg-white/5">
                                        <p className="text-xs font-medium text-zinc-500 mb-1">{value.name}</p>
                                        <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{value.result}</p>
                                    </div>
                                ))}
                            </div>
                        </CollapsibleSection>
                    )}

                    {/* Contact is shown persistently in the top-right card now. */}

                    {contactError && (
                        <motion.div
                            className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-center gap-2 dark:border-amber-500/20 dark:bg-amber-500/5"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                            <p className="text-sm text-amber-800 dark:text-amber-300">{contactError}</p>
                        </motion.div>
                    )}

                    {/* Cost Breakdown */}
                    {costBreakdown && (
                        <CollapsibleSection title="Cost Breakdown" icon={Zap} defaultOpen delay={0.13}>
                            <div className="grid grid-cols-2 gap-2">
                                {costBreakdown.llm !== undefined && costBreakdown.llm > 0 && (
                                    <div className="rounded-xl bg-zinc-50 px-3 py-2.5 dark:bg-white/5">
                                        <span className="text-[10px] uppercase tracking-wider text-zinc-500">LLM</span>
                                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-200">${costBreakdown.llm.toFixed(4)}</p>
                                    </div>
                                )}
                                {costBreakdown.stt !== undefined && costBreakdown.stt > 0 && (
                                    <div className="rounded-xl bg-zinc-50 px-3 py-2.5 dark:bg-white/5">
                                        <span className="text-[10px] uppercase tracking-wider text-zinc-500">STT</span>
                                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-200">${costBreakdown.stt.toFixed(4)}</p>
                                    </div>
                                )}
                                {costBreakdown.tts !== undefined && costBreakdown.tts > 0 && (
                                    <div className="rounded-xl bg-zinc-50 px-3 py-2.5 dark:bg-white/5">
                                        <span className="text-[10px] uppercase tracking-wider text-zinc-500">TTS</span>
                                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-200">${costBreakdown.tts.toFixed(4)}</p>
                                    </div>
                                )}
                                {costBreakdown.vapi !== undefined && costBreakdown.vapi > 0 && (
                                    <div className="rounded-xl bg-zinc-50 px-3 py-2.5 dark:bg-white/5">
                                        <span className="text-[10px] uppercase tracking-wider text-zinc-500">VAPI</span>
                                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-200">${costBreakdown.vapi.toFixed(4)}</p>
                                    </div>
                                )}
                                {costBreakdown.transport !== undefined && costBreakdown.transport > 0 && (
                                    <div className="rounded-xl bg-zinc-50 px-3 py-2.5 dark:bg-white/5">
                                        <span className="text-[10px] uppercase tracking-wider text-zinc-500">Transport</span>
                                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-200">${costBreakdown.transport.toFixed(4)}</p>
                                    </div>
                                )}
                                {costBreakdown.total !== undefined && (
                                    <div className="rounded-xl bg-zinc-50 px-3 py-2.5 dark:bg-white/5">
                                        <span className="text-[10px] uppercase tracking-wider text-zinc-500">Total</span>
                                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-200">${costBreakdown.total.toFixed(4)}</p>
                                    </div>
                                )}
                            </div>
                            {costBreakdown.ttsCharacters !== undefined && (
                                <div className="mt-3 pt-3 border-t border-black/6 dark:border-white/6 grid grid-cols-2 gap-2">
                                    {costBreakdown.ttsCharacters > 0 && (
                                        <div>
                                            <span className="text-[10px] uppercase tracking-wider text-zinc-500">TTS Chars</span>
                                            <p className="text-sm text-zinc-700 dark:text-zinc-300">{costBreakdown.ttsCharacters.toLocaleString()}</p>
                                        </div>
                                    )}
                                    {costBreakdown.llmPromptTokens !== undefined && costBreakdown.llmPromptTokens > 0 && (
                                        <div>
                                            <span className="text-[10px] uppercase tracking-wider text-zinc-500">Prompt Tokens</span>
                                            <p className="text-sm text-zinc-700 dark:text-zinc-300">{costBreakdown.llmPromptTokens.toLocaleString()}</p>
                                        </div>
                                    )}
                                    {costBreakdown.llmCompletionTokens !== undefined && costBreakdown.llmCompletionTokens > 0 && (
                                        <div>
                                            <span className="text-[10px] uppercase tracking-wider text-zinc-500">Completion Tokens</span>
                                            <p className="text-sm text-zinc-700 dark:text-zinc-300">{costBreakdown.llmCompletionTokens.toLocaleString()}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CollapsibleSection>
                    )}

                    {/* Transcript */}
                    {transcript && (
                        <CollapsibleSection title="Full Transcript" icon={ScrollText} delay={0.1}>
                            <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                                {transcript}
                            </p>
                        </CollapsibleSection>
                    )}




                </div>
            </div>
        </div>
    );
}
