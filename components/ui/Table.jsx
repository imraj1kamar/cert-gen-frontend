// components/ui/Table.jsx
"use client";

import React, { useState, useMemo } from "react";
import { Search, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";

export default function Table({
  columns = [],
  data = [],
  searchable = true,
  searchPlaceholder = "Search records...",
  itemsPerPage = 10,
  emptyMessage = "No records found.",
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(itemsPerPage);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // 1. Search Logic
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;

    return data.filter((item) =>
      columns.some((col) => {
        const val = item[col.accessor];
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(searchTerm.toLowerCase());
      })
    );
  }, [data, searchTerm, columns]);

  // 2. Sorting Logic
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.key] ?? "";
      const bVal = b[sortConfig.key] ?? "";

      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  // 3. Pagination Slicing
  const totalPages = Math.ceil(sortedData.length / rowsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return sortedData.slice(startIndex, startIndex + rowsPerPage);
  }, [sortedData, currentPage, rowsPerPage]);

  const handleSort = (accessor) => {
    setSortConfig((prev) => ({
      key: accessor,
      direction: prev.key === accessor && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Search badalne par page 1 par reset
  };

  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
      {/* Top Controls: Search & Rows per page */}
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 justify-between items-center">
        {searchable ? (
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
            />
          </div>
        ) : <div />}

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Rows per page:</span>
          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 focus:outline-none text-xs"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              {columns.map((col, colIdx) => (
                <th
                  key={col.key || col.header || `${col.accessor}-${colIdx}`}
                  onClick={() => col.sortable !== false && handleSort(col.accessor)}
                  className={`px-4 py-3 ${
                    col.sortable !== false ? "cursor-pointer select-none hover:bg-slate-100" : ""
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col.header}</span>
                    {col.sortable !== false && (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedData.length > 0 ? (
              paginatedData.map((row, idx) => (
                <tr key={row.id || idx} className="hover:bg-slate-50/70 transition-colors">
                  {columns.map((col, colIdx) => (
                    <td key={col.key || col.header || `${col.accessor}-${colIdx}`} className="px-4 py-3 text-xs text-slate-700">
                      {col.render ? col.render(row[col.accessor], row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-xs text-slate-400">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
        <div>
          Showing {sortedData.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} to{" "}
          {Math.min(currentPage * rowsPerPage, sortedData.length)} of {sortedData.length} entries
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1 rounded border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2 font-medium">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1 rounded border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}