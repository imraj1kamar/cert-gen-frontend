import React from "react";
import Card from "@/components/ui/Card";

export default function CertificateCanvasPreview({ record }) {
  if (!record) return null;

  return (
    <Card title="Sample Layout Preview" subtitle="Watermarked alignment verification[cite: 1]">
      <div className="relative aspect-[1.414/1] w-full max-w-2xl mx-auto border border-slate-300 rounded-lg shadow-inner bg-slate-900 text-amber-100 flex flex-col justify-between p-8 overflow-hidden">
        {/* Watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none select-none">
          <span className="text-7xl font-extrabold uppercase transform -rotate-45 tracking-widest text-white">
            SAMPLE
          </span>
        </div>

        {/* Certificate Header */}
        <div className="text-center space-y-1">
          <h2 className="text-lg tracking-wider text-amber-400 font-semibold">CERTIFICATE OF APPRECIATION</h2>
          <p className="text-xs uppercase tracking-widest text-slate-400">{record.awardCategory}</p>
        </div>

        {/* Certificate Body */}
        <div className="text-center space-y-2">
          <p className="text-xs text-slate-400">Awarded to</p>
          <h1 className="text-2xl font-bold tracking-wide text-white">{record.empName}</h1>
          <p className="text-xs font-mono text-slate-400">({record.empCode})</p>
          <p className="text-xs italic text-slate-300 max-w-md mx-auto pt-2">{record.citation || "In recognition for significant contribution to the organization."}</p>
          <p className="text-xs text-amber-400/80 font-medium">{record.month}</p>
        </div>

        {/* Signatures Row */}
        <div className="flex justify-between items-end border-t border-slate-700/50 pt-4">
          <div className="text-left space-y-0.5">
            <span className="text-xs italic text-slate-400 font-serif">[Signature Placeholder]</span>
            <p className="text-xs font-semibold text-slate-200">{record.signatory1}</p>
          </div>
          <div className="text-right space-y-0.5">
            <span className="text-xs italic text-slate-400 font-serif">[Signature Placeholder]</span>
            <p className="text-xs font-semibold text-slate-200">{record.signatory2}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}