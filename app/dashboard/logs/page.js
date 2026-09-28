// app/dashboard/logs/page.js
"use client";

import React, { useState } from "react";
import Breadcrumb from "@/components/ui/Breadcrumb";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Table from "@/components/ui/Table";
import Modal from "@/components/ui/Modal";
import Alert from "@/components/ui/Alert";
import { useGetLogsQuery } from "@/redux";
import {
  Activity,
  RefreshCw,
  Download,
  Eye,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  UploadCloud,
  UserCheck,
  ShieldAlert,
} from "lucide-react";

export default function ActivityLogsPage() {
  const { data: logs = [], isFetching, refetch } = useGetLogsQuery();
  const [selectedLog, setSelectedLog] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [alertNotification, setAlertNotification] = useState(null);

  const handleRefresh = async () => {
    try {
      await refetch();
      setAlertNotification({
        type: "info",
        title: "Logs Refreshed via Redux",
        message: "Activity records updated from Redux RTK ledger.",
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

  // Reusable Table Columns Config
  const logColumns = [
    {
      header: "Action / Event",
      accessor: "action",
      render: (action, row) => (
        <div className="space-y-0.5">
          <span className="font-mono font-bold text-[11px] text-slate-800 tracking-tight">
            {action}
          </span>
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
      header: "Status",
      accessor: "status",
      render: (status) => {
        const isSuccess = status === "SUCCESS";
        const isWarning = status === "WARNING";
        return (
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${
              isSuccess
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : isWarning
                ? "bg-amber-50 text-amber-800 border border-amber-200"
                : "bg-blue-50 text-blue-700 border border-blue-200"
            }`}
          >
            {isSuccess ? (
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            ) : isWarning ? (
              <AlertTriangle className="w-3 h-3 text-amber-600" />
            ) : (
              <Activity className="w-3 h-3 text-blue-600" />
            )}
            {status}
          </span>
        );
      },
    },
    {
      header: "IP Address",
      accessor: "ipAddress",
      render: (ip) => <span className="font-mono text-[11px] text-slate-600">{ip}</span>,
    },
    {
      header: "Timestamp",
      accessor: "timestamp",
      render: (time) => <span className="text-[11px] text-slate-500 font-mono">{time}</span>,
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
          { label: "System Activity Logs" },
        ]}
      />

      {/* Header Banner with Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Activity & Audit Logs</h1>
          <p className="text-sm text-slate-500">
            Real-time audit tracking for template additions, uploads, validation stops, and batch runs[cite: 1].
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

      {/* Reusable Alert */}
      {alertNotification && (
        <Alert
          type={alertNotification.type}
          title={alertNotification.title}
          message={alertNotification.message}
        />
      )}

      {/* Audit Table Card */}
      <Card
        title="Recorded Activity Ledger"
        subtitle="Complete log of actions mapped directly to the proposed MySQL Activity_Logs table[cite: 1, 2]."
      >
        <Table
          columns={logColumns}
          data={logs}
          searchPlaceholder="Search by action, user, or IP address..."
          itemsPerPage={10}
        />
      </Card>

      {/* Log Detail Inspector Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Audit Event: ${selectedLog?.action || ""}`}
        maxWidth="max-w-lg"
      >
        {selectedLog && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Event ID:</span>
                <span className="font-mono font-semibold text-slate-800">{selectedLog.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Operator:</span>
                <span className="font-semibold text-slate-800">
                  @{selectedLog.performedBy} ({selectedLog.userRole})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Timestamp:</span>
                <span className="font-mono text-slate-700">{selectedLog.timestamp}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Origin IP:</span>
                <span className="font-mono text-slate-700">{selectedLog.ipAddress}</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-700 mb-1">Event Payload & Metadata</h4>
              <pre className="p-3 bg-slate-900 text-amber-200 rounded-lg text-xs font-mono overflow-x-auto max-h-56">
                {JSON.stringify(selectedLog.metadata, null, 2)}
              </pre>
            </div>

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