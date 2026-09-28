// components/layout/Navbar.jsx
"use client";

import React, { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { Award, UserCircle, LogOut, Menu } from "lucide-react";
import { selectCurrentUser, setUser, clearUser } from "@/redux/slices/authSlice";
import { authApi } from "@/redux/api/authApi";

import { clearMenus } from "@/redux/slices/menuSlice";

export default function Navbar({ onMenuToggle }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const isLoggingOut = useRef(false);
  const hasFetched = useRef(false);

  useEffect(() => {
    // logout ho raha ho ya pehle fetch ho chuka ho, to dobara mat karo
    if (currentUser || isLoggingOut.current || hasFetched.current) return;
    hasFetched.current = true;

    authApi.getProfile()
      .then((res) => {
        if (isLoggingOut.current) return; // logout ke baad response ignore
        const userData = res?.data || res;
        if (userData) dispatch(setUser(userData.data || userData));
      })
      .catch(() => {
        if (!isLoggingOut.current) router.replace("/");
      });
  }, [currentUser, dispatch, router]);

  const handleLogout = async () => {
    isLoggingOut.current = true; // sabse pehle flag set karo
    try {
      await authApi.logout();
    } catch (err) {
      console.error("Logout API error:", err);
    } finally {
      dispatch(clearUser());
      dispatch(clearMenus());
      router.replace("/"); // push ki jagah replace, back button se wapas na aaye
    }
  };

  const userDisplay = currentUser || {
    username: "Loading...",
    role: "",
    displayName: "",
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-6 w-full">
      {/* Left: Mobile Hamburger Toggle + Brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none"
          aria-label="Toggle Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="bg-blue-600 p-2 rounded-lg text-white shadow-xs">
            <Award className="w-5 h-5" />
          </div>
          <span className="font-bold text-slate-900 text-base sm:text-lg tracking-tight">
            CertEngine
          </span>
        </div>
      </div>

      {/* Right: Profile Info & Sign out */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <UserCircle className="w-6 h-6 text-slate-400" />
          <div className="hidden sm:block text-left">
            <p className="font-semibold text-xs text-slate-800 leading-none">
              {userDisplay.displayName || userDisplay.username}
            </p>
            <span
              className={`inline-block text-[10px] font-bold uppercase mt-0.5 px-1.5 py-0.5 rounded ${
                userDisplay.role === "admin"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {userDisplay.role || "user"}
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
          title="Sign out"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}