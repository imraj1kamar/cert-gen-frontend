// app/dashboard/logs/page.js
"use client";

import React, { useState } from "react";
import Breadcrumb from "@/components/ui/Breadcrumb";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Table from "@/components/ui/Table";
import Modal from "@/components/ui/Modal";
import Alert from "@/components/ui/Alert";
import { useLogs } from "@/apiService/apiHooks";
import {
  Activity,
  RefreshCw,
  Download,
  Eye,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  OctagonX,
  FileSpreadsheet,
  BarChart3,
} from "lucide-react";

export default function ActivityLogsPage() {
  const { data: logsResponse, isFetching, refetch } = useLogs();
  const logs = logsResponse?.data ?? logsResponse ?? [];

  const [selectedLog, setSelectedLog] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [alertNotification, setAlertNotification] = useState(null);

  const handleRefresh = async () => {
    try {
      await refetch();
      setAlertNotification({
        type: "info",
        title: "Logs Refreshed",
        message: "Activity records updated from database.",
      });
    } catch (err) {
      setAlertNotification({
        type: "error",
        title: "Refresh Failed",
        message: "Could not fetch updated logs.",
      });
    }
  };

  const handleExportLogs = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(logs, null, 2)
    )}`;
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute("download", `CertEngine_AuditLogs_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setAlertNotification({
      type: "success",
      title: "Logs Exported",
      message: "Audit file downloaded in JSON format.",
    });
  };

  const handleViewLogDetails = (log) => {
    setSelectedLog(log);
    setIsDetailModalOpen(true);
  };

  // ── Status badge renderer ───────────────────────────────────────────────────
  const StatusBadge = ({ status }) => {
    if (status === "SUCCESS")
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3" /> SUCCESS
        </span>
      );
    if (status === "CANCELLED")
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-200">
          <OctagonX className="w-3 h-3" /> CANCELLED
        </span>
      );
    if (status === "ERROR")
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
          <XCircle className="w-3 h-3" /> ERROR
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
        <Activity className="w-3 h-3" /> {status}
      </span>
    );
  };

  // ── Action badge renderer ───────────────────────────────────────────────────
  const ActionBadge = ({ action }) => {
    const map = {
      BATCH_GENERATE_COMPLETE: { label: "Batch Complete", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
      BATCH_GENERATE_CANCELLED: { label: "Batch Cancelled", color: "text-red-700 bg-red-50 border-red-200" },
      BATCH_GENERATE_ERROR: { label: "Batch Error", color: "text-amber-800 bg-amber-50 border-amber-200" },
    };
    const entry = map[action] ?? { label: action, color: "text-slate-700 bg-slate-50 border-slate-200" };
    return (
      <span className={`inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2 py-0.5 rounded border ${entry.color}`}>
        {entry.label}
      </span>
    );
  };

  // ── Table columns ───────────────────────────────────────────────────────────
  const logColumns = [
    {
      header: "Action",
      accessor: "action",
      render: (action, row) => (
        <div className="space-y-1">
          <ActionBadge action={action} />
          <p className="text-[11px] text-slate-500 line-clamp-1">{row.description}</p>
        </div>
      ),
    },
    {
      header: "Performed By",
      accessor: "performedBy",
      render: (performedBy, row) => (
        <div>
          <span className="font-semibold text-xs text-slate-800 font-mono">@{performedBy}</span>
          <p className="text-[10px] text-slate-400">{row.userRole}</p>
        </div>
      ),
    },
    {
      header: "Records",
      accessor: "totalRecords",
      render: (total, row) => (
        <div className="text-xs space-y-0.5">
          <div className="flex items-center gap-1 text-slate-600">
            <BarChart3 className="w-3 h-3" />
            <span className="font-semibold">{total ?? 0}</span> total
          </div>
          <div className="flex gap-2 text-[10px]">
            <span className="text-emerald-600 font-semibold">✓ {row.successCount ?? 0}</span>
            <span className="text-red-500 font-semibold">✗ {row.errorCount ?? 0}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Excel File",
      accessor: "archiveUrl",
      render: (archiveUrl) => {
        if (!archiveUrl) return <span className="text-[11px] text-slate-400 font-mono">—</span>;
        const fileName = archiveUrl.split('/').pop() || 'uploaded.xlsx';
        return (
          <a
            href={archiveUrl}
            download
            className="inline-flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 font-medium px-2 py-1 rounded-md transition-colors max-w-[160px] truncate"
            title={fileName}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">{fileName}</span>
          </a>
        );
      },
    },
    {
      header: "Status",
      accessor: "status",
      render: (status) => <StatusBadge status={status} />,
    },
    {
      header: "Timestamp",
      accessor: "timestamp",
      render: (time) => <span className="text-[11px] text-slate-500 font-mono whitespace-nowrap">{time}</span>,
    },
    {
      header: "Details",
      accessor: "id",
      sortable: false,
      render: (id, row) => (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleViewLogDetails(row)}
          icon={Eye}
          className="text-[11px] h-7 px-2"
        >
          Inspect
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Batch Generation Logs" },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Batch Generation Audit Logs</h1>
          <p className="text-sm text-slate-500">
            Permanent record of every certificate batch run — completed, cancelled, or errored.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="md"
            icon={RefreshCw}
            isLoading={isFetching}
            onClick={handleRefresh}
          >
            Refresh
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            icon={Download}
            onClick={handleExportLogs}
          >
            Export JSON
          </Button>
        </div>
      </div>

      {alertNotification && (
        <Alert
          type={alertNotification.type}
          title={alertNotification.title}
          message={alertNotification.message}
        />
      )}

      {/* Summary stats */}
      {logs.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: "Total Runs",
              value: logs.length,
              color: "text-indigo-600",
              bg: "bg-indigo-50 border-indigo-200",
            },
            {
              label: "Successful",
              value: logs.filter((l) => l.status === "SUCCESS").length,
              color: "text-emerald-600",
              bg: "bg-emerald-50 border-emerald-200",
            },
            {
              label: "Cancelled / Errored",
              value: logs.filter((l) => l.status !== "SUCCESS").length,
              color: "text-red-600",
              bg: "bg-red-50 border-red-200",
            },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl border px-5 py-4 ${s.bg}`}>
              <p className="text-xs text-slate-500 font-medium">{s.label}</p>
              <p className={`text-3xl font-bold tabular-nums mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Audit Table */}
      <Card
        title="Recorded Batch Activity"
        subtitle="Each row = one batch generation run. Click Inspect for full details."
      >
        <Table
          columns={logColumns}
          data={logs}
          searchPlaceholder="Search by action, user, or status..."
          itemsPerPage={15}
        />
      </Card>

      {/* Detail Inspector Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Log #${selectedLog?.id} — ${selectedLog?.action || ""}`}
        maxWidth="max-w-xl"
      >
        {selectedLog && (
          <div className="space-y-4">
            {/* Key-value summary */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-2">
              {[
                ["Event ID", `#${selectedLog.id}`],
                ["Action", selectedLog.action],
                ["Operator", `@${selectedLog.performedBy} (${selectedLog.userRole})`],
                ["Status", selectedLog.status],
                ["Timestamp", selectedLog.timestamp],
                ["Total Records", selectedLog.totalRecords ?? 0],
                ["Success", selectedLog.successCount ?? 0],
                ["Errors", selectedLog.errorCount ?? 0],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between gap-4">
                  <span className="text-slate-500 shrink-0">{label}:</span>
                  <span className="font-semibold text-slate-800 text-right font-mono">{val}</span>
                </div>
              ))}
              {selectedLog.archiveUrl && (
                <div className="flex justify-between gap-4 pt-1 border-t border-slate-200/60 items-center">
                  <span className="text-slate-500 shrink-0">Excel Archive:</span>
                  <a
                    href={selectedLog.archiveUrl}
                    download
                    className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 font-semibold px-2.5 py-1 rounded-md transition-colors"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                    Download {selectedLog.archiveUrl.split('/').pop()}
                  </a>
                </div>
              )}
            </div>

            {/* Description */}
            {selectedLog.description && (
              <div>
                <h4 className="text-xs font-semibold text-slate-700 mb-1">Description</h4>
                <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-2">
                  {selectedLog.description}
                </p>
              </div>
            )}

            {/* Execution Details / Failed rows */}
            {selectedLog.executionDetails && (
              <div>
                <h4 className="text-xs font-semibold text-slate-700 mb-1">Execution Details</h4>
                <pre className="p-3 bg-slate-900 text-amber-200 rounded-lg text-xs font-mono overflow-x-auto max-h-56">
                  {JSON.stringify(selectedLog.executionDetails, null, 2)}
                </pre>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsDetailModalOpen(false)}
              >
                Close Inspector
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}