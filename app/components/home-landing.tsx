"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  PhoneCall,
  Sparkles,
  ShieldCheck,
  ClipboardCheck,
  Layers,
  AlertTriangle,
  Users,
  DollarSign,
  Banknote,
} from "lucide-react";
import { FeatureCard } from "@/app/components/ui/feature-card";
import { AnimatedLink } from "@/app/components/ui/animated-link";
import { SectionHeader } from "@/app/components/ui/section-header";
import { LineChart } from "@/app/components/ui/line-chart";
import { LogoutButton } from "./logout-button";

interface HomeLandingProps {
  isLoggedIn: boolean;
  userEmail: string | null;
  stats?: CallsStats | null;
}

interface CallsStatsCard {
  title: string;
  value: string;
}

interface CallsStatsLinePoint {
  x: number;
  y: number;
  label?: string;
}

interface CallsStatsLineChart {
  title: string;
  subtitle?: string;
  badge?: string;
  points: CallsStatsLinePoint[];
}

interface CallsStats {
  cards: CallsStatsCard[];
  lineChart: CallsStatsLineChart;
}



export function HomeLanding({ isLoggedIn, userEmail, stats }: HomeLandingProps) {
  const reduceMotion = useReducedMotion();
  const [cachedStats, setCachedStats] = useState<CallsStats | null>(null);
  const [statsChanged, setStatsChanged] = useState(false);
  const [statsHash, setStatsHash] = useState<string | null>(null);
  const [displayStats, setDisplayStats] = useState<CallsStats | null>(null);
  const [displayHash, setDisplayHash] = useState<string | null>(null);
  const updateTimeoutRef = useRef<number | null>(null);

  const storageKey = "boostedcalls.stats.v1";

  const container = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 12 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: reduceMotion ? 0 : 0.08,
        delayChildren: reduceMotion ? 0 : 0.05,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 10 },
    show: { opacity: 1, y: 0 },
  };

  const defaultStats: CallsStats = {
    cards: [
      { title: "Total Spent on Calls", value: "$50.00" },
      { title: "Calls made", value: "1,284" },
      { title: "Failed calls", value: "38" },
      { title: "Contacts", value: "4,902" },
    ],
    lineChart: {
      title: "Successful calls",
      subtitle: "+18% vs previous 14 days",
      badge: "Last 14 days",
      points: [
        { x: 0, y: 118, label: "Mon" },
        { x: 1, y: 102, label: "Tue" },
        { x: 2, y: 110, label: "Wed" },
        { x: 3, y: 82, label: "Thu" },
        { x: 4, y: 92, label: "Fri" },
        { x: 5, y: 58, label: "Sat" },
        { x: 6, y: 70, label: "Sun" },
        { x: 7, y: 40, label: "Mon" },
        { x: 8, y: 55, label: "Tue" },
        { x: 9, y: 61, label: "Wed" },
        { x: 10, y: 49, label: "Thu" },
        { x: 11, y: 66, label: "Fri" },
        { x: 12, y: 73, label: "Sat" },
        { x: 13, y: 59, label: "Sun" },
      ],
    },
  };

  const resolvedStats = isLoggedIn ? displayStats ?? cachedStats ?? defaultStats : null;

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as CallsStats;
      setCachedStats(parsed);
      setStatsHash(raw);
      setDisplayStats(parsed);
      setDisplayHash(raw);
    } catch {
      setCachedStats(null);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!stats) return;
    try {
      const nextRaw = JSON.stringify(stats);
      const prevRaw = window.localStorage.getItem(storageKey);
      const changed = Boolean(prevRaw && prevRaw !== nextRaw);
      setStatsChanged(changed);

       if (prevRaw) {
        try {
          const prevParsed = JSON.parse(prevRaw) as CallsStats;
          setCachedStats(prevParsed);
          setDisplayStats(prevParsed);
          setDisplayHash(prevRaw);
        } catch {
          setCachedStats(null);
        }
      }

      window.localStorage.setItem(storageKey, nextRaw);
      setStatsHash(nextRaw);

      if (updateTimeoutRef.current) {
        window.clearTimeout(updateTimeoutRef.current);
      }

      if (changed) {
        updateTimeoutRef.current = window.setTimeout(() => {
          setDisplayStats(stats);
          setDisplayHash(nextRaw);
          updateTimeoutRef.current = null;
        }, 600);
      } else {
        setDisplayStats(stats);
        setDisplayHash(nextRaw);
      }
    } catch {
      setStatsChanged(false);
    }
  }, [stats, storageKey]);

  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        window.clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);
  const lineChartSource = isLoggedIn ? resolvedStats?.lineChart ?? defaultStats.lineChart : null;
  const lineChartProps = lineChartSource
    ? {
        title: lineChartSource.title,
        subtitle: lineChartSource.subtitle ?? "",
        badge: lineChartSource.badge ?? "",
        points: lineChartSource.points.map((point) => ({
          x: point.x,
          y: point.y,
          label: point.label ?? "",
        })),
      }
    : null;

  const iconByTitle: Record<string, typeof PhoneCall> = {
    "Total Spent on Calls": Banknote,
    "Calls made": PhoneCall,
    "Failed calls": AlertTriangle,
    Contacts: Users,
  };

  const marketingFeatures = [
    {
      icon: PhoneCall,
      title: "Instant call launches",
      body: "Queue calls with a single click and keep momentum across your outreach pipeline.",
    },
    {
      icon: Sparkles,
      title: "Guided AI scripts",
      body: "Keep every call on-brand with structured prompts and dynamic goals.",
    },
    {
      icon: ClipboardCheck,
      title: "Outcome clarity",
      body: "Track call status, transcripts, and summaries for every campaign.",
    },
    {
      icon: ShieldCheck,
      title: "Secure by design",
      body: "Token-based access keeps your data protected end to end.",
    },
  ];

  const featureCards = isLoggedIn
    ? ((resolvedStats?.cards ?? defaultStats.cards) ?? []).map((card) => ({
        icon: iconByTitle[card.title] ?? PhoneCall,
        title: card.title,
        value: card.value,
      }))
    : marketingFeatures;

  const lineChartKey = statsChanged && displayHash ? `chart-${displayHash}` : "chart-static";

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 dark:bg-black dark:text-zinc-50">
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-8 md:flex-row md:items-center md:gap-12">
        <motion.section
          className="flex-1 md:flex md:flex-col md:justify-center"
          variants={container}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={item} className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Image className="invert" src="/vercel.svg" alt="Vercel" width={72} height={24} priority />
              <h1 className="text-3xl font-semibold tracking-tight">BoostedCalls</h1>
            </div>
          </motion.div>

          {isLoggedIn ? (
            <motion.div variants={item}>
              <SectionHeader label="Performance snapshot" title="" />
              {lineChartProps && (
                <LineChart
                  key={lineChartKey}
                  title={lineChartProps.title}
                  subtitle={lineChartProps.subtitle}
                  badge={lineChartProps.badge}
                  points={lineChartProps.points}
                />
              )}
            </motion.div>
          ) : (
            <motion.div variants={item} className="mt-6 space-y-4">
              <p className="text-sm uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">
                AI call automation
              </p>
              <h2 className="text-3xl font-semibold leading-tight md:text-4xl">
                Ship high-converting call campaigns in minutes.
              </h2>
              <p className="max-w-xl text-base text-zinc-600 dark:text-zinc-400">
                Design scripts, launch outbound calls, and track outcomes with a clean, black-and-white
                workflow made for focused teams.
              </p>
            </motion.div>
          )}

          <motion.div variants={item} className="mt-6 grid gap-4 sm:grid-cols-2">
            {featureCards.map((feature) => (
              <FeatureCard
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                value={"value" in feature ? feature.value : undefined}
                body={"body" in feature ? feature.body : undefined}
                animateValue={statsChanged}
                animateKey={statsChanged ? displayHash ?? feature.title : "static"}
              />
            ))}
          </motion.div>
        </motion.section>

        <motion.section
          className="-mt-7 w-full max-w-md self-center rounded-3xl border border-black/10 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-zinc-950"
          initial={{ opacity: 0, y: reduceMotion ? 0 : 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.5, ease: "easeOut" }}
        >
          {isLoggedIn ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Logged in as</p>
                  <p className="text-xl font-semibold">{userEmail}</p>
                </div>
                <LogoutButton />
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Jump back into your campaigns and monitor live call outcomes.
              </p>
              <div className="flex flex-col gap-3">
                <AnimatedLink href="/campaigns" variant="primary">
                  View Campaigns
                </AnimatedLink>
                <AnimatedLink href="/campaigns/make-call" variant="secondary">
                  Launch a Call
                </AnimatedLink>
              </div>
              <div className="border-t border-black/10 pt-4 text-xs text-zinc-500 dark:border-white/10 dark:text-zinc-400">
                Ready to scale? Create scripts and monitor outcomes in one place.
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="space-y-2">
                <p className="text-sm uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                  Get started
                </p>
                <h3 className="text-2xl font-semibold">Sign in to launch calls</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Use your username to access campaigns and start dialing instantly.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <AnimatedLink href="/login" variant="primary">
                  Log in
                </AnimatedLink>
                <AnimatedLink href="#" variant="secondary" disabled>
                  Sign up
                </AnimatedLink>
              </div>
              <div className="rounded-2xl border border-black/10 bg-zinc-50 p-3 text-xs text-zinc-600 dark:border-white/10 dark:bg-black dark:text-zinc-400">
                Need access? Ask your admin for an invite and start automating calls today.
              </div>
              <div className="border-t border-black/10 pt-4 text-xs text-center text-zinc-500 dark:border-white/10 dark:text-zinc-400">
                Built by Aakash Pandey (aakash.pandey@live.com)
              </div>
            </div>
          )}
        </motion.section>
      </main>
    </div>
  );
}
