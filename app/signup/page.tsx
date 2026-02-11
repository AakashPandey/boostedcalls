"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!email || !password || !confirm) {
      setError("Please fill all fields.");
      setLoading(false);
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError("Enter a valid email.");
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const contentType = res.headers.get("content-type");
        let errorMessage = "Signup failed";
        
        if (contentType?.includes("application/json")) {
          try {
            const errorData = await res.json();
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            errorMessage = `Server error (${res.status})`;
          }
        } else {
          errorMessage = `Server error (${res.status})`;
        }
        throw new Error(errorMessage);
      }

      setShowConfirmation(true);
    } catch (err: any) {
      setError(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  function handleConfirmation() {
    router.push("/login");
  }

  if (showConfirmation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <Card>
          <div className="mb-6">
            <h2 className="text-lg font-semibold">Verify Your Email</h2>
          </div>
          <div className="flex flex-col gap-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              A verification email has been sent to <span className="font-semibold">{email}</span>. Please check your inbox and confirm your email address.
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-500">
              Once confirmed, you'll be able to log in.
            </p>
            <Button onClick={handleConfirmation} className="w-full">
              Go to Login
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <Card>
        <div className="mb-6">
          <h2 className="text-lg font-semibold">CallAI — Sign up</h2>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          <Input
            label="Confirm password"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            disabled={loading}
          />
          {error ? <p className="text-sm text-red-500">{error}</p> : null}
          <div className="flex items-center justify-between gap-2">
            <Button type="submit" disabled={loading}>{loading ? "Creating account..." : "Create account"}</Button>
            <Link href="/login" className="text-sm text-zinc-600 dark:text-zinc-400">
              Sign in
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}

