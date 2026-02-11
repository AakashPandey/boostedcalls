"use client";
import React from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string | null;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        {label ? <label className="mb-2 block text-sm font-medium">{label}</label> : null}
        <input
          ref={ref}
          className={`w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 dark:border-white/10 dark:bg-[#0b0b0b] dark:text-zinc-50 ${className}`}
          {...props}
        />
        {error ? <p className="mt-1 text-xs text-red-500">{error}</p> : null}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
