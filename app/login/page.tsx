"use client";
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion, useReducedMotion } from "framer-motion";
import { Lock, ShieldCheck, Sparkles } from "lucide-react";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { FeatureCard } from "@/app/components/ui/feature-card";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!username || !password) {
      setError("Please provide username and password.");
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error || "Invalid credentials");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 dark:bg-black dark:text-zinc-50">
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-8 md:flex-row md:items-center md:gap-12">
        <motion.section
          className="flex-1 md:flex md:flex-col md:justify-center"
          initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.5, ease: "easeOut" }}
        >
          <div className="flex items-center gap-4">
            <Image className="invert" src="/vercel.svg" alt="Vercel" width={72} height={24} priority />
            <h1 className="text-3xl font-semibold tracking-tight">BoostedCalls</h1>
          </div>

          <div className="mt-6 space-y-4">
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">
              Secure access
            </p>
            <h2 className="text-3xl font-semibold leading-tight md:text-4xl">
              Welcome back — launch outbound campaigns fast.
            </h2>
            <p className="max-w-lg text-base text-zinc-600 dark:text-zinc-400">
              Sign in to resume your campaigns and call outcomes.
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              {
                icon: Lock,
                title: "Trusted API Providers",
                body: "We use industry-leading providers for calling and ai services.",
              },
              {
                icon: ShieldCheck,
                title: "Protected data",
                body: "Your contact lists stays private and secure, only accessible to you.",
              },
            ].map((feature) => (
              <FeatureCard
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                body={feature.body}
              />
            ))}
          </div>
        </motion.section>

        <motion.section
          className="w-full max-w-md self-center"
          initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.55, ease: "easeOut" }}
        >
          <Card>
            <div className="mb-6">
              <h2 className="text-lg font-semibold">Login</h2>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Use your username to access your campaigns.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                label="Username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              {error ? <p className="text-sm text-red-500">{error}</p> : null}
              <div className="flex items-center justify-between gap-2">
                <Button type="submit" disabled={loading} className="cursor-pointer">
                  {loading ? "Signing in..." : "Sign in"}
                </Button>
                <Link href="/signup" className="text-sm text-zinc-600 dark:text-zinc-400">
                  Create account
                </Link>
              </div>
            </form>
          </Card>
        </motion.section>
      </main>
    </div>
  );
}

