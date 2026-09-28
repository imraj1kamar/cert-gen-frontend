// app/dashboard/layout.js
"use client";

import React, { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";

export default function DashboardLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* 1. Navbar Top par full-width rahega */}
      <Navbar onMenuToggle={() => setIsSidebarOpen((prev) => !prev)} />

      {/* 2. Main content container (Navbar ke niche) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Responsive Sidebar (Desktop par fixed, Mobile/Tablet par sliding drawer) */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Dynamic page content */}
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 md:px-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}