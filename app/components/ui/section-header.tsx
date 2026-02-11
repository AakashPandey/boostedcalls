"use client";

import { ReactNode } from "react";

interface SectionHeaderProps {
  label: string;
  title: string;
  subtitle?: string;
  children?: ReactNode;
}

export function SectionHeader({ label, title, subtitle, children }: SectionHeaderProps) {
  return (
    <div className="mt-6 space-y-4">
      <p className="text-sm uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">{label}</p>
      <h2 className="text-3xl font-semibold leading-tight md:text-4xl">{title}</h2>
      {subtitle && <p className="max-w-xl text-base text-zinc-600 dark:text-zinc-400">{subtitle}</p>}
      {children}
    </div>
  );
}
