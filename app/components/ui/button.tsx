"use client";
import React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "ghost";
};

export function Button({ className = "", variant = "default", disabled = false, ...props }: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";
  const variants: Record<string, string> = {
    default:
      "bg-foreground text-background hover:bg-foreground/90 dark:bg-zinc-800 dark:text-zinc-50",
    ghost: "bg-transparent border border-solid border-black/10 dark:border-white/10",
  };

  return <button className={`${base} ${variants[variant]} ${className}`} disabled={disabled} {...props} />;
}

export default Button;
