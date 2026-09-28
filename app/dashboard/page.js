// app/dashboard/page.js
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Breadcrumb from "@/components/ui/Breadcrumb";
import {
  Users,
  ShieldCheck,
  FileSpreadsheet,
  Feather,
  Award,
  ArrowRight,
  Activity,
} from "lucide-react";

export default function DashboardOverviewPage() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const session = localStorage.getItem("cert_user");
    if (session) {
      try {
        setCurrentUser(JSON.parse(session));
      } catch (e) {}
    }
  }, []);

  const isAdmin = currentUser?.role === "admin";

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Overview" }]} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome, {currentUser?.displayName || "User"}
          </h1>
          <p className="text-sm text-slate-500">
            {isAdmin
              ? "System oversight, access controls, and activity audit trails[cite: 1]."
              : "Generate certificates, manage templates, and upload signatories[cite: 1]."}
          </p>
        </div>

        {!isAdmin && (
          <Link href="/dashboard/generate">
            <Button variant="primary" icon={ArrowRight}>
              Process New Batch
            </Button>
          </Link>
        )}
      </div>

      {/* Role-Specific Metric Cards */}
      {isAdmin ? (
        /* Admin View */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card className="border-l-4 border-l-blue-600">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Registered Users</p>
                <h4 className="text-2xl font-bold text-slate-900">12</h4>
                <Link href="/dashboard/users" className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                  Manage users &rarr;[cite: 1]
                </Link>
              </div>
            </div>
          </Card>

          <Card className="border-l-4 border-l-amber-500">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-amber-500" />
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Batches Processed</p>
                <h4 className="text-2xl font-bold text-slate-900">48</h4>
                <Link href="/dashboard/logs" className="text-xs text-amber-600 hover:underline mt-1 inline-block">
                  View audit logs &rarr;[cite: 1]
                </Link>
              </div>
            </div>
          </Card>

          <Card className="border-l-4 border-l-emerald-600">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-emerald-600" />
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Engine Status</p>
                <h4 className="text-2xl font-bold text-emerald-600">Healthy</h4>
                <p className="text-xs text-slate-400 mt-1">In-Memory Async ready[cite: 1]</p>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        /* Operations User View */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card className="border-l-4 border-l-blue-600">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Certificate Engine</p>
                <h4 className="text-lg font-bold text-slate-900">3-Tier Grouping</h4>
                <Link href="/dashboard/generate" className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                  Upload Excel sheet &rarr;[cite: 1]
                </Link>
              </div>
            </div>
          </Card>

          <Card className="border-l-4 border-l-purple-600">
            <div className="flex items-center gap-3">
              <Feather className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Saved Signatories</p>
                <h4 className="text-2xl font-bold text-slate-900">4</h4>
                <Link href="/dashboard/materials" className="text-xs text-purple-600 hover:underline mt-1 inline-block">
                  Add or edit signatures &rarr;[cite: 1]
                </Link>
              </div>
            </div>
          </Card>

          <Card className="border-l-4 border-l-amber-500">
            <div className="flex items-center gap-3">
              <Award className="w-8 h-8 text-amber-500" />
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Active Templates</p>
                <h4 className="text-2xl font-bold text-slate-900">4</h4>
                <Link href="/dashboard/templates" className="text-xs text-amber-600 hover:underline mt-1 inline-block">
                  Manage PDF templates &rarr;[cite: 1]
                </Link>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}