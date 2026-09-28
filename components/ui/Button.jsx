// components/ui/Button.jsx
import React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = {
  primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:bg-blue-300",
  secondary: "bg-slate-800 hover:bg-slate-900 text-white disabled:bg-slate-400",
  outline: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:bg-slate-100",
  danger: "bg-red-600 hover:bg-red-700 text-white disabled:bg-red-300",
  ghost: "hover:bg-slate-100 text-slate-700",
};

const buttonSizes = {
  sm: "px-3 py-1.5 text-xs font-medium rounded-md",
  md: "px-4 py-2 text-sm font-semibold rounded-lg",
  lg: "px-6 py-3 text-base font-semibold rounded-lg",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  isLoading = false,
  disabled = false,
  icon: Icon,
  ...props
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer disabled:cursor-not-allowed",
        buttonVariants[variant],
        buttonSizes[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
      )}
      {!isLoading && Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
}