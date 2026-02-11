"use client";
import React from "react";

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`w-full max-w-md rounded-2xl border border-black/6 bg-white p-8 shadow-sm dark:border-white/6 dark:bg-[#0b0b0b] ${className}`}>
      {children}
    </div>
  );
}

export default Card;
