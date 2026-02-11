"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedLinkProps {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

export function AnimatedLink({
  href,
  children,
  variant = "primary",
  disabled = false,
  type,
}: AnimatedLinkProps) {
  const reduceMotion = useReducedMotion();

  const baseClasses = "rounded-full px-6 py-3 text-center text-sm font-medium transition";

  const variantClasses = {
    primary:
      "bg-black text-white shadow-sm hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:shadow-white/10",
    secondary:
      "border border-black/10 text-black hover:-translate-y-0.5 hover:bg-black/5 hover:shadow-lg hover:shadow-black/10 dark:border-white/10 dark:text-zinc-50 dark:hover:shadow-white/10",
  };

  if (type === "submit" || type === "reset") {
    return (
      <motion.button
        type={type}
        disabled={disabled}
        whileHover={reduceMotion ? undefined : { scale: 1.02 }}
        whileTap={reduceMotion ? undefined : { scale: 0.98 }}
        className={`${baseClasses} ${variantClasses[variant]}`}
      >
        {children}
      </motion.button>
    );
  }

  return (
    <motion.div
      whileHover={reduceMotion ? undefined : { scale: 1.02 }}
      whileTap={reduceMotion ? undefined : { scale: 0.98 }}
    >
      <Link href={href} className={`${baseClasses} ${variantClasses[variant]} block`}>
        {children}
      </Link>
    </motion.div>
  );
}
