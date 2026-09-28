import React from "react";

export default function ProgressBar({ progress = 0, label, description }) {
  const percentage = Math.min(100, Math.max(0, Math.round(progress)));

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between items-center text-sm">
        <span className="font-semibold text-slate-700">{label}</span>
        <span className="font-mono text-xs font-bold text-blue-600">{percentage}%</span>
      </div>
      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
        <div
          className="h-full bg-blue-600 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {description && <p className="text-xs text-slate-500">{description}</p>}
    </div>
  );
}