// components/layout/Sidebar.jsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import {
  Award,
  FileSpreadsheet,
  Layers,
  Feather,
  Users,
  ShieldAlert,
  ShieldCheck,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { setMenus, setLoading, selectMenus } from "@/redux/slices/menuSlice";

// DB mein icon ka naam string hai, yahan se component milega
const ICON_MAP = { Layers, Feather, Award, FileSpreadsheet, Users, ShieldAlert };

const getMenus = () =>
  fetch("/api/menus", { credentials: "include", cache: "no-store" });

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const dispatch = useDispatch();

  const menus = useSelector(selectMenus);

  // Role, loading, error slice mein nahi hain, isliye local state
  const [userRole, setUserRole] = useState("user");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // ── Guard: agar menus pehle se Redux store mein hain toh fetch skip karo ──
    if (menus.length > 0) {
      setIsLoading(false);
      return;
    }

    // AbortController: React Strict Mode cleanup par fetch mid-flight cancel ho jaayegi
    const controller = new AbortController();
    const { signal } = controller;

    const loadMenus = async () => {
      setIsLoading(true);
      setError(null);
      dispatch(setLoading(true));

      try {
        let res = await fetch("/api/menus", {
          credentials: "include",
          cache: "no-store",
          signal,                // ← abort signal attach karo
        });

        // Access token expire ho toh ek baar refresh karke retry
        if (res.status === 401) {
          const refresh = await fetch("/api/auth/refresh", {
            method: "POST",
            credentials: "include",
            signal,              // ← refresh par bhi signal
          });
          if (refresh.ok) {
            res = await fetch("/api/menus", {
              credentials: "include",
              cache: "no-store",
              signal,
            });
          }
        }

        // Agar component unmount ho gaya (abort) toh aage mat jao
        if (signal.aborted) return;

        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(json.message || "Failed to load menus");
        }

        dispatch(setMenus(json.data ?? []));
        setUserRole(json.role ?? "user");
      } catch (err) {
        // AbortError sirf tab aata hai jab hum khud abort karte hain — ignore karo
        if (err.name === "AbortError") return;
        if (!signal.aborted) setError(err.message || "Failed to load menus");
      } finally {
        if (!signal.aborted) {
          setIsLoading(false);
          dispatch(setLoading(false));
        }
      }
    };

    loadMenus();

    // Cleanup: component unmount ya re-run par in-flight request cancel karo
    return () => controller.abort();
  }, [dispatch, retryCount]); // retryCount tabhi change hoga jab user "Retry" click kare

  // Mobile drawer me koi link click hote hi menu band ho jaye
  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  const isLinkActive = (href) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  return (
    <>
      {/* Mobile/Tablet Backdrop (Jab menu khula ho) */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-slate-50 border-r border-slate-200 flex flex-col justify-between p-4 transition-transform duration-300 ease-in-out",
          "lg:static lg:translate-x-0 lg:h-[calc(100vh-4rem)] lg:z-auto",
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        )}
      >
        <div className="space-y-4">
          {/* Mobile Header with Close Button */}
          <div className="flex items-center justify-between lg:hidden pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-1.5 rounded-lg text-white">
                <Award className="w-4 h-4" />
              </div>
              <span className="font-bold text-slate-900 text-sm">CertEngine</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Current Role Badge */}
          <div className="px-3 py-2 bg-white rounded-lg border border-slate-200 flex items-center gap-2 shadow-2xs">
            <ShieldCheck
              className={cn("w-4 h-4", userRole === "admin" ? "text-amber-500" : "text-blue-600")}
            />
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Current Role
              </p>
              <p className="text-xs font-semibold text-slate-800 capitalize">
                {isLoading ? "Loading..." : `${userRole} Portal`}
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {isLoading &&
              [1, 2, 3, 4].map((n) => (
                <div key={n} className="h-10 rounded-lg bg-slate-200/70 animate-pulse" />
              ))}

            {!isLoading && error && (
              <div className="px-3 py-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg">
                Menu load nahi hua.{" "}
                <button
                  onClick={() => setRetryCount((c) => c + 1)}
                  className="underline font-semibold"
                >
                  Retry
                </button>
              </div>
            )}

            {!isLoading &&
              !error &&
              menus.map((item) => {
                const Icon = ICON_MAP[item.icon] ?? Layers;
                const isActive = isLinkActive(item.href);
                // Admin ke liye /dashboard ka label "Admin Overview"
                const label =
                  item.href === "/dashboard" && userRole === "admin"
                    ? "Admin Overview"
                    : item.label;

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={handleLinkClick}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {label}
                  </Link>
                );
              })}
          </nav>
        </div>

        {/* Footer Info Box */}
        <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-500 shadow-2xs">
          <p className="font-semibold text-slate-700">Storage Optimization</p>
          <p className="mt-1">In-Memory PDF generation active. Auto-cleanup on download.</p>
        </div>
      </aside>
    </>
  );
}