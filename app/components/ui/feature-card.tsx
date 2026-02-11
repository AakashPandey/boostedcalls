"use client";

import { motion, useReducedMotion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  body?: string;
  value?: string;
  animateValue?: boolean;
  animateKey?: string;
}

export function FeatureCard({ icon: Icon, title, body, value, animateValue = false, animateKey }: FeatureCardProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-950"
      whileHover={reduceMotion ? undefined : { y: -4, boxShadow: "0 12px 30px rgba(0,0,0,0.12)" }}
      transition={{ type: "spring", stiffness: 260, damping: 18 }}
    >
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5" />
        <h3 className="text-base font-semibold">{title}</h3>
      </div>
      {value ? (
        <div className="mt-3 perspective-midrange">
          <motion.p
            key={animateKey ?? "static"}
            className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50"
            initial={
              animateValue && !reduceMotion
                ? { opacity: 0, rotateX: -75, y: 6 }
                : false
            }
            animate={
              animateValue && !reduceMotion
                ? { opacity: 1, rotateX: 0, y: 0 }
                : false
            }
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{ transformStyle: "preserve-3d" }}
          >
            {value}
          </motion.p>
        </div>
      ) : (
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{body}</p>
      )}
    </motion.div>
  );
}
