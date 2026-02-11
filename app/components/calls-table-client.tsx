"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSSE } from "@/app/hooks/use-sse";
import { CallsTable } from "./calls-table";
import { RefreshIndicator } from "@/app/components/ui/refresh-indicator";
import { motion, useReducedMotion } from "framer-motion";

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
}

interface CallsTableClientProps {
  initialCalls: Call[];
}

export function CallsTableClient({ initialCalls }: CallsTableClientProps) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [calls, setCalls] = useState<Call[]>(initialCalls);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const pendingStatuses = ["pending", "queued", "initiated", "ringing", "in-progress"];
  const hasPendingCalls = calls.some((call) => pendingStatuses.includes(call.status));


  const handleSSEEvent = useCallback(
    async (event: any) => {
      console.log("[SSE] Campaigns received event:", event);

      setIsRefreshing(true);
      try {
        const res = await fetch("/api/calls");
        if (res.status === 401) {
          router.push("/api/auth/logout");
          return;
        }
        if (res.ok) {
          const updatedCalls = await res.json();
          // Sort by most recent first
          updatedCalls.sort(
            (a: Call, b: Call) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setCalls(updatedCalls);
        }
      } catch (error) {
        console.error("[SSE] Error refreshing calls:", error);
      } finally {
        setIsRefreshing(false);
      }
    },
    [router]
  );

  // Subscribe to SSE for campaigns updates (only while there are pending calls)
  useSSE({
    channels: ["campaigns"],
    onEvent: handleSSEEvent,
    enabled: hasPendingCalls,
  });

  return (
    <motion.div
      className="relative"
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={reduceMotion ? false : { opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.4, ease: "easeOut" }}
    >
      <div className="absolute top-0 right-0 -mt-8">
        <RefreshIndicator isRefreshing={isRefreshing} />
      </div>
      <CallsTable calls={calls} />
    </motion.div>
  );
}
