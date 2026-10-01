"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import Modal from "@/components/ui/Modal";
import { CheckCircle, XCircle, Loader2, AlertTriangle, Download, FileText, OctagonX } from "lucide-react";

// ─── helpers ────────────────────────────────────────────────────────────────
const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

function StatusBadge({ status }) {
  if (status === "success")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
        <CheckCircle className="w-3 h-3" /> Done
      </span>
    );
  if (status === "error")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
        <XCircle className="w-3 h-3" /> Failed
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
      <Loader2 className="w-3 h-3 animate-spin" /> Processing
    </span>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function GenerationProgressModal({
  isOpen,
  onClose,
  totalRecords,
  isGenerating,
  jobId,
}) {
  const [progress, setProgress] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [rows, setRows] = useState([]); // { rowNo, empName, empCode, category, bandType, packetName, month, status, reason, elapsed, fileSize }
  const [failedDetails, setFailedDetails] = useState([]);
  const [phase, setPhase] = useState("idle"); // idle | running | done | error_complete | cancelled
  const [statusMsg, setStatusMsg] = useState("Initializing...");
  const [activeRowNo, setActiveRowNo] = useState(null);

  const esRef = useRef(null);
  const logBoxRef = useRef(null);
  const rowsMapRef = useRef({});    // rowNo → rowIndex in rows[]
  const nextRowIndexRef = useRef(0); // always tracks the next append index synchronously

  // Auto-scroll log box
  const scrollLog = useCallback(() => {
    if (logBoxRef.current) {
      logBoxRef.current.scrollTop = logBoxRef.current.scrollHeight;
    }
  }, []);

  const reset = useCallback(() => {
    setProgress(0);
    setSuccessCount(0);
    setErrorCount(0);
    setRows([]);
    setFailedDetails([]);
    setPhase("idle");
    setStatusMsg("Initializing...");
    setActiveRowNo(null);
    rowsMapRef.current = {};
    nextRowIndexRef.current = 0;
  }, []);

  // Panic Stop: backend ko cancel signal bhejo, SSE stream band karo
  const handlePanicStop = useCallback(async () => {
    if (!jobId) return;
    // SSE turant band karo taaki UI turant react kare
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
    setPhase("cancelled");
    setStatusMsg("🛑 Cancellation requested — stopping after current record...");
    try {
      await fetch("/api/generate/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ jobId }),
      });
    } catch (_) {
      // silently ignore — flag server-side set ho hi jaayega
    }
  }, [jobId]);

  // Connect SSE when modal opens and jobId is ready
  useEffect(() => {
    if (!isOpen || !jobId) return;
    reset();
    setPhase("running");
    setStatusMsg("Connecting to server...");

    const es = new EventSource(`/api/generate/progress?jobId=${jobId}`);
    esRef.current = es;

    es.onmessage = (e) => {
      let data;
      try { data = JSON.parse(e.data); } catch { return; }

      switch (data.type) {
        case "connected":
          setStatusMsg("Connected — processing records...");
          break;

        case "info":
          setStatusMsg(data.msg);
          break;

        case "row_start": {
          const { rowNo, empName, empCode, category, bandType, packetName, month } = data;

          // Guard against duplicate row_start on SSE reconnect:
          // If this rowNo already has a slot, reuse it instead of appending a new one.
          let idx = rowsMapRef.current[rowNo];
          if (idx === undefined) {
            idx = nextRowIndexRef.current;
            nextRowIndexRef.current += 1;
            rowsMapRef.current[rowNo] = idx;
          }

          setActiveRowNo(rowNo);
          setRows((prev) => {
            const updated = [...prev];
            updated[idx] = { rowNo, empName, empCode, category, bandType, packetName, month, status: "processing" };
            return updated;
          });
          setStatusMsg(`Processing [${rowNo}/${totalRecords}] ${empName} (${empCode})`);
          setTimeout(scrollLog, 50);
          break;
        }

        case "row_done": {
          const { rowNo, status, reason, elapsed, fileSize } = data;
          setRows((prev) => {
            const idx = rowsMapRef.current[rowNo];
            if (idx === undefined) return prev;
            const updated = [...prev];
            updated[idx] = { ...updated[idx], status, reason, elapsed, fileSize };
            return updated;
          });
          if (status === "error") {
            setFailedDetails((prev) => [...prev, data]);
          }
          setActiveRowNo(null);
          setTimeout(scrollLog, 50);
          break;
        }

        case "progress":
          setProgress(clamp(data.progress, 0, 100));
          setSuccessCount(data.successCount);
          setErrorCount(data.errorCount);
          if (data.errors?.length) setFailedDetails(data.errors);
          break;

        case "complete":
          setProgress(100);
          setSuccessCount(data.successCount);
          setErrorCount(data.errorCount);
          if (data.errors?.length) setFailedDetails(data.errors);
          setPhase("done");
          setStatusMsg("✅ All certificates generated successfully!");
          es.close();
          break;

        case "error_complete":
          setProgress(data.progress);
          setSuccessCount(data.successCount);
          setErrorCount(data.errorCount);
          if (data.errors?.length) setFailedDetails(data.errors);
          setPhase("error_complete");
          setStatusMsg(`⚠️ Completed with ${data.errorCount} error(s).`);
          es.close();
          break;

        case "cancelled":
          setProgress(data.progress ?? progress);
          setSuccessCount(data.successCount ?? successCount);
          setErrorCount(data.errorCount ?? errorCount);
          setPhase("cancelled");
          setStatusMsg(`🛑 Stopped by user — ${data.successCount ?? successCount} generated, ${data.errorCount ?? errorCount} failed.`);
          es.close();
          break;

        case "error":
          setPhase("error_complete");
          setStatusMsg(`❌ ${data.msg}`);
          es.close();
          break;

        default:
          break;
      }
    };

    es.onerror = () => {
      if (phase === "done" || phase === "error_complete") return;
      
      // es.close(); <--- ISKO HATA DIYA HAI TAAKI AUTO-RECONNECT HO SAKE
      
      setStatusMsg("[!] Connection drop detected. Auto-reconnecting to server...");
    };

    return () => {
      es.close();
      esRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, jobId]);

  const isDone = phase === "done" || phase === "error_complete" || phase === "cancelled";
  const progressDisplay = Math.round(progress);

  // ── colour helpers
  const progressColor =
    phase === "done"
      ? "#10b981"
      : phase === "error_complete"
      ? "#f59e0b"
      : phase === "cancelled"
      ? "#ef4444"
      : "#6366f1";

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => isDone && onClose()}
      title="Certificate Batch Engine"
    >
      <div className="space-y-5" style={{ minWidth: 540 }}>

        {/* ── Top stats row ── */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            label="Total"
            value={totalRecords}
            icon={<FileText className="w-4 h-4 text-slate-500" />}
            color="#6366f1"
          />
          <StatCard
            label="Success"
            value={successCount}
            icon={<CheckCircle className="w-4 h-4 text-emerald-500" />}
            color="#10b981"
          />
          <StatCard
            label="Failed"
            value={errorCount}
            icon={<XCircle className="w-4 h-4 text-red-500" />}
            color="#ef4444"
          />
        </div>

        {/* ── Progress bar ── */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-sm font-semibold text-slate-700">
              {isDone ? (phase === "done" ? "Completed" : "Completed with errors") : "Processing…"}
            </span>
            <span
              className="text-lg font-bold tabular-nums"
              style={{ color: progressColor }}
            >
              {progressDisplay}%
            </span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progressDisplay}%`,
                background: `linear-gradient(90deg, ${progressColor}aa, ${progressColor})`,
              }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1.5 truncate">{statusMsg}</p>
        </div>

        {/* ── Row log ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Record Log
            </h3>
            <span className="text-xs text-slate-400">{rows.length} / {totalRecords} loaded</span>
          </div>
          <div
            ref={logBoxRef}
            className="border border-slate-200 rounded-xl overflow-y-auto bg-slate-50"
            style={{ height: 260 }}
          >
            {rows.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="text-sm">Waiting for records...</span>
              </div>
            ) : (
              <table className="w-full text-xs border-collapse">
                <thead className="sticky top-0 bg-white border-b border-slate-200 z-10">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600 w-12">#</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">Employee</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">Category</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">Packet</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600 w-24">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, index) => (
                    <tr
                      key={`row-${r.rowNo}-${index}`}
                      className={`border-b border-slate-100 transition-colors ${
                        r.status === "error"
                          ? "bg-red-50"
                          : r.status === "processing"
                          ? "bg-blue-50 animate-pulse"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="px-3 py-2 text-slate-400 font-mono">{r.rowNo}</td>
                      <td className="px-3 py-2">
                        <div className="font-semibold text-slate-800 leading-tight">{r.empName}</div>
                        <div className="text-slate-400 font-mono">{r.empCode}</div>
                      </td>
                      <td className="px-3 py-2 text-slate-600">{r.category}</td>
                      <td className="px-3 py-2 text-slate-500 truncate max-w-[120px]">{r.packetName}</td>
                      <td className="px-3 py-2">
                        <StatusBadge status={r.status} />
                        {r.status === "success" && r.elapsed && (
                          <div className="text-slate-400 text-[10px] mt-0.5">{r.elapsed}</div>
                        )}
                        {r.status === "error" && r.reason && (
                          <div className="text-red-600 text-[10px] mt-0.5 leading-tight" title={r.reason}>
                            {r.reason.length > 40 ? r.reason.slice(0, 40) + "…" : r.reason}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ── Failed rows detail panel ── */}
        {failedDetails.length > 0 && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              <span className="text-xs font-semibold text-red-700">
                {failedDetails.length} Failed Record{failedDetails.length > 1 ? "s" : ""}
              </span>
            </div>
            <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
              {failedDetails.map((f, i) => (
                <div key={i} className="flex gap-2 text-xs">
                  <span className="font-mono text-red-400 shrink-0">Row {f.rowNo}</span>
                  <span className="font-semibold text-red-800 shrink-0">{f.empName}</span>
                  <span className="text-red-600 leading-tight">{f.reason}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Footer buttons ── */}
        <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-100">
          {/* Left side: Panic Stop — sirf tab dikhega jab chal raha ho */}
          <div>
            {phase === "running" && (
              <button
                onClick={handlePanicStop}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 active:scale-95 transition-all"
              >
                <OctagonX className="w-4 h-4" />
                Panic Stop
              </button>
            )}
            {phase === "cancelled" && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600">
                <OctagonX className="w-3.5 h-3.5" /> Generation stopped
              </span>
            )}
          </div>

          {/* Right side: action button */}
          {!isDone ? (
            <button
              disabled
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-slate-100 text-slate-400 cursor-not-allowed"
            >
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing in background…
            </button>
          ) : (
            <button
              onClick={onClose}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: progressColor }}
            >
              <Download className="w-4 h-4" />
              {phase === "done" ? "Done — Close" : phase === "cancelled" ? "Dismiss" : "Close"}
            </button>
          )}
        </div>
        </div>
      
    </Modal>
  );
}

// ─── Small stat card ─────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color }) {
  return (
    <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
      <div className="p-1.5 rounded-lg bg-slate-50">{icon}</div>
      <div>
        <div className="text-xl font-bold tabular-nums" style={{ color }}>
          {value ?? 0}
        </div>
        <div className="text-xs text-slate-500 font-medium">{label}</div>
      </div>
    </div>
  );
}