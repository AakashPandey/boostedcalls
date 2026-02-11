"use client";
import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Call {
    id: string;
    contactId?: string;
    contactPhone?: string;
    contact_phone?: string;
    contact?: {
        phone?: string;
    };
    status: "failed" | "completed" | "pending" | "in-progress" | "queued" | "initiated" | "ringing";
    outcome: string | null;
    startedAt: string | null;
    endedAt: string | null;
    createdAt: string;
    created_at?: string | null;
    ended_at?: string | null;
}

interface CallsTableProps {
    calls: Call[];
}

function formatDate(dateString?: string | null): string {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatId(value?: string): string {
    if (!value) return "—";
    const start = value.slice(0, 5);
    const end = value.slice(-5);
    return `${start}...${end}`;
}

function getCreatedAt(call: Call): string | null {
    return call.createdAt ?? call.created_at ?? null;
}

function getEndedAt(call: Call): string | null {
    return call.endedAt ?? call.ended_at ?? null;
}

function formatDuration(call: Call): string {
    if (call.status === "failed") return "0s";
    const createdAt = getCreatedAt(call);
    const endedAt = getEndedAt(call);
    if (!createdAt || !endedAt) return "—";
    const start = new Date(createdAt).getTime();
    const end = new Date(endedAt).getTime();
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return "—";
    const totalSeconds = Math.floor((end - start) / 1000);
    if (totalSeconds <= 0) return "0s";
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

function formatPhone(call: Call): string {
    const phone = call.contactPhone ?? call.contact_phone ?? call.contact?.phone;
    if (phone) return phone;
    return call.contactId ? formatId(call.contactId) : "—";
}

function StatusBadge({ status }: { status: string }) {
    const colors: Record<string, { bg: string; text: string }> = {
        completed: { bg: "bg-green-100 dark:bg-green-900", text: "text-green-700 dark:text-green-200" },
        failed: { bg: "bg-red-100 dark:bg-red-900", text: "text-red-700 dark:text-red-200" },
        pending: { bg: "bg-yellow-100 dark:bg-yellow-900", text: "text-yellow-700 dark:text-yellow-200" },
        queued: { bg: "bg-yellow-100 dark:bg-yellow-900", text: "text-yellow-700 dark:text-yellow-200" },
        initiated: { bg: "bg-blue-100 dark:bg-blue-900", text: "text-blue-700 dark:text-blue-200" },
        ringing: { bg: "bg-blue-100 dark:bg-blue-900", text: "text-blue-700 dark:text-blue-200" },
        "in-progress": { bg: "bg-blue-100 dark:bg-blue-900", text: "text-blue-700 dark:text-blue-200" },
    };

    const color = colors[status] || colors.pending;
    const pendingStatuses = ['pending', 'queued', 'initiated', 'ringing', 'in-progress'] as const;
    const isPending = pendingStatuses.includes(status as typeof pendingStatuses[number]);

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${color.bg} ${color.text}`}>
            {isPending && (
                <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
            )}
            {status}
        </span>
    );
}

export function CallsTable({ calls }: CallsTableProps) {
    const router = useRouter();

    if (calls.length === 0) {
        return (
            <div className="flex items-center justify-center py-12 text-zinc-500 dark:text-zinc-400">
                No calls found. Start a new campaign to get started.
            </div>
        );
    }

    return (
        <div className="w-full overflow-x-auto border border-black/6 rounded-lg dark:border-white/6">
            <table className="w-full text-sm">
                <thead className="border-b border-black/6 dark:border-white/6 bg-zinc-50 dark:bg-zinc-900">
                    <tr>
                        <th className="px-6 py-3 text-left font-semibold text-zinc-900 dark:text-zinc-50">Call ID</th>
                        <th className="px-6 py-3 text-left font-semibold text-zinc-900 dark:text-zinc-50">Contact</th>
                        <th className="px-6 py-3 text-left font-semibold text-zinc-900 dark:text-zinc-50">Status</th>
                        <th className="px-6 py-3 text-left font-semibold text-zinc-900 dark:text-zinc-50">Created At</th>
                        <th className="px-6 py-3 text-left font-semibold text-zinc-900 dark:text-zinc-50">Duration</th>
                    </tr>
                </thead>
                <tbody>
                    {calls.map((call, idx) => (
                        <tr key={call.id} onClick={() => router.push(`/campaigns/${call.id}`)} className={`cursor-pointer transition-colors bg-white dark:bg-black hover:bg-zinc-50 dark:hover:bg-zinc-900`}>
                            <td className="px-6 py-4">
                                <span className="text-zinc-900 dark:text-zinc-50 font-mono text-xs">
                                    {formatId(call.id)}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400 font-mono text-xs">
                                {formatPhone(call)}
                            </td>
                            <td className="px-6 py-4">
                                <StatusBadge status={call.status} />
                            </td>
                            <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                                {formatDate(getCreatedAt(call))}
                            </td>
                            <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                                {formatDuration(call)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
