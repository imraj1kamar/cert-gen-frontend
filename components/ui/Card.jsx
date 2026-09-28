// components/ui/Card.jsx
import React from "react";
import { cn } from "@/lib/utils";

export default function Card({ children, title, subtitle, className, headerAction }) {
  return (
    <div className={cn("bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden", className)}>
      {(title || subtitle || headerAction) && (
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            {title && <h3 className="font-semibold text-slate-800 text-base">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}