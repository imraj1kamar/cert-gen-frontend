import React from "react";
import Card from "@/components/ui/Card";
import { Users, Layers, Award } from "lucide-react";

export default function SummaryDataGrid({ summary }) {
  if (!summary) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="border-l-4 border-l-blue-600">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-blue-600" />
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase">Total Records</p>
            <h4 className="text-2xl font-bold text-slate-900">{summary.totalRecords}</h4>
          </div>
        </div>
      </Card>

      <Card className="border-l-4 border-l-emerald-600">
        <div className="flex items-center gap-3">
          <Layers className="w-8 h-8 text-emerald-600" />
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase">Bands Detected</p>
            <div className="flex gap-2 flex-wrap mt-1">
              {Object.entries(summary.bands).map(([band, count]) => (
                <span key={band} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-semibold">
                  {band}: {count}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card className="border-l-4 border-l-amber-500">
        <div className="flex items-center gap-3">
          <Award className="w-8 h-8 text-amber-500" />
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase">Categories</p>
            <div className="flex gap-2 flex-wrap mt-1">
              {Object.entries(summary.categories).map(([cat, count]) => (
                <span key={cat} className="text-xs bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md font-semibold">
                  {cat}: {count}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}