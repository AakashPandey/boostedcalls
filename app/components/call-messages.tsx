"use client";
import React from "react";

interface Message {
  role: "system" | "bot" | "user";
  time: number;
  message: string;
  duration?: number;
  secondsFromStart?: number;
}

interface CallMessagesProps {
  messages: Message[];
  customerName?: string;
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function CallMessages({ messages, customerName }: CallMessagesProps) {
  // Filter out system messages for display
  const chatMessages = messages.filter((m) => m.role !== "system");

  if (chatMessages.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-zinc-500 dark:text-zinc-400">
        No messages in this call.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {chatMessages.map((msg, idx) => {
        const isBot = msg.role === "bot";
        const isLeft = !isBot;
        const displayName = isBot ? "CallAI" : (customerName || "Customer");

        return (
          <div key={idx} className={`flex ${isLeft ? "justify-start" : "justify-end"}`}>
            <div
              className={`max-w-md rounded-lg px-4 py-3 ${
                isBot
                  ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
                  : "bg-blue-600 dark:bg-blue-700 text-white"
              }`}
            >
              <div className="text-sm font-medium mb-1 opacity-75">{displayName}</div>
              <p className="text-sm">{msg.message}</p>
              <div className="mt-2 text-xs opacity-60 flex gap-2">
                {msg.duration && <span>{formatDuration(msg.duration)}</span>}
                <span>{formatTime(msg.time)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
