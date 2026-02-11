"use client";
import React, { useState } from "react";

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

interface CallScriptAccordionProps {
    script: CallScript | null;
    loading?: boolean;
    error?: string | null;
}

export function CallScriptAccordion({ script, loading = false, error = null }: CallScriptAccordionProps) {
    const [isOpen, setIsOpen] = useState(false);

    if (error) {
        return (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-900/20">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">{error}</p>
            </div>
        );
    }

    if (!script) {
        return (
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Script not available</p>
            </div>
        );
    }

    return (
        <div className="rounded-lg border border-black/6 bg-white dark:border-white/6 dark:bg-black mb-6">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
            >
                <div className="flex flex-col items-start gap-2 flex-1">
                    <div>
                            <p className="text-xs text-left font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Script ID</p>
                            <p className="text-sm font-mono text-zinc-600 dark:text-zinc-400">{script.id}</p>
                        </div>


                    {script.description && (
                        <span className="text-sm text-zinc-500 dark:text-zinc-400">{script.description}</span>
                    )}
                </div>
                <svg
                    className={`w-5 h-5 text-zinc-600 dark:text-zinc-400 transition-transform shrink-0 ml-4 ${isOpen ? "" : "rotate-180"}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
            </button>

            {isOpen && (
                <div className="border-t border-black/6 dark:border-white/6 px-6 py-4 space-y-6">
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">
                        Name
                    </p>                    <p className="text-sm text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900 rounded p-3">
                        {script.name}
                    </p>
                    {/* First Message */}
                    <div>
                        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">
                            First Message
                        </p>
                        <p className="text-sm text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900 rounded p-3">
                            {script.firstMessage}
                        </p>
                    </div>

                    {/* Custom Prompt */}
                    <div>
                        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">
                            Custom Prompt
                        </p>
                        <p className="text-sm text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900 rounded p-3">
                            {script.customPrompt}
                        </p>
                    </div>

                    {/* Call Goals */}
                    {script.callGoals && script.callGoals.length > 0 && (
                        <div>
                            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">
                                Call Goals
                            </p>
                            <div className="space-y-3">
                                {script.callGoals.map((goal, idx) => (
                                    <div key={idx} className="bg-zinc-50 dark:bg-zinc-900 rounded p-4">
                                        <h4 className="font-medium text-black dark:text-zinc-50 mb-1">{goal.name}</h4>
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">{goal.description}</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Success:</span>
                                            <span className="text-sm text-zinc-700 dark:text-zinc-300">{goal.successCriteria}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
