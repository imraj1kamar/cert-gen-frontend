// components/ui/Alert.jsx
import React from "react";
import { AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const alertStyles = {
  error: "bg-red-50 border-red-200 text-red-800",
  warning: "bg-amber-50 border-amber-200 text-amber-800",
  success: "bg-emerald-50 border-emerald-200 text-emerald-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
};

const alertIcons = {
  error: XCircle,
  warning: AlertTriangle,
  success: CheckCircle,
  info: Info,
};

export default function Alert({ type = "info", title, message, details = [], className }) {
  const Icon = alertIcons[type];

  return (
    <div className={cn("border p-4 rounded-xl flex gap-3 shadow-xs", alertStyles[type], className)}>
      <Icon className="w-5 h-5 shrink-0 mt-0.5" />
      <div className="text-sm space-y-1 w-full">
        {title && <h4 className="font-semibold text-base">{title}</h4>}
        {message && <p>{message}</p>}
        {details.length > 0 && (
          <ul className="list-disc pl-5 mt-2 space-y-1 font-mono text-xs max-h-40 overflow-y-auto">
            {details.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}