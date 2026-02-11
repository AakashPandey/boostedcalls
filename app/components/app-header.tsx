"use client";

import Link from "next/link";
import Image from "next/image";
import { LogoutButton } from "./logout-button";

interface AppHeaderProps {
  email?: string;
}

export default function AppHeader({ email }: AppHeaderProps) {
  return (
    <header className="border-b border-black/6 bg-white dark:border-white/6 dark:bg-black">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-4">
          <Image className="invert" src="/vercel.svg" alt="Vercel" width={22} height={22} priority />
          <span className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">BoostedCalls</span>
        </Link>
        <nav className="flex items-center gap-6">
          
          <Link
            href="/campaigns"
            className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            Campaigns
          </Link>
          
          <LogoutButton />
        </nav>
      </div>
    </header>
  );
}
