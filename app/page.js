// app/page.js
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { Award, Lock, User, ArrowRight, ShieldCheck } from "lucide-react";
import DynamicForm from "@/components/ui/DynamicForm";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import { authApi } from "@/redux/api/authApi"; // ⭐️ Redux API layer se import
import { setUser } from "@/redux/slices/authSlice"; // ⭐️ Redux slice import

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loginFields = [
    {
      name: "username",
      label: "Username",
      type: "text",
      placeholder: "Enter your username",
      required: true,
      icon: User,
    },
    {
      name: "password",
      label: "Password",
      type: "password",
      placeholder: "••••••••",
      required: true,
      icon: Lock,
    },
  ];

  const handleLogin = async (e) => {
    e?.preventDefault();
    setErrorMessage("");

    const trimmedUser = formData.username.trim();
    const trimmedPass = formData.password.trim();

    if (!trimmedUser || !trimmedPass) {
      setErrorMessage("Please enter both username and password.");
      return;
    }

    setIsLoading(true);

    try {
      // ⭐️ authApi ke zariye login request
      const response = await authApi.login({
        username: trimmedUser,
        password: trimmedPass,
      });

      const userData = response?.data || response;

      if (userData?.success || userData) {
        // 1. Save user data in Redux store
        dispatch(setUser(userData.data || userData));

        // 2. Redirect to dashboard
        router.push("/dashboard");
      } else {
        setErrorMessage(userData?.message || "Invalid credentials.");
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Invalid credentials. Please check your username and password.";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-slate-900">
      {/* Left Branding / Overview Banner */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-8 lg:p-16 flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-500/20">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="font-bold text-white text-xl tracking-tight">CertEngine</span>
            <span className="block text-[11px] font-mono text-blue-400">Automated Processing System</span>
          </div>
        </div>

        <div className="my-12 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-medium">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            Enterprise Authentication Portal
          </div>
          <h1 className="text-3xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            High-Volume Dynamic Certificate Engine
          </h1>
          <p className="text-slate-400 text-sm lg:text-base leading-relaxed max-w-lg">
            Streamlined 3-tier grouping, automated template mapping, and in-memory async generation built for batches of 7,000+ records.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800/80">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Storage Strategy</p>
              <p className="text-sm font-medium text-slate-300 mt-0.5">In-Memory ZIP Packaging</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Validation</p>
              <p className="text-sm font-medium text-slate-300 mt-0.5">Real-Time Halt & Alert</p>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-500">
          &copy; {new Date().getFullYear()} Automated Certificate Engine. All rights reserved.
        </div>
      </div>

      {/* Right Login Form */}
      <div className="w-full lg:w-1/2 bg-white flex items-center justify-center p-6 sm:p-10 lg:p-12 min-h-screen">
        <div className="w-full max-w-md space-y-6">
          <div className="flex lg:hidden items-center gap-2.5 mb-2">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <Award className="w-5 h-5" />
            </div>
            <span className="font-bold text-slate-900 text-lg">CertEngine</span>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Sign In</h2>
            <p className="text-sm text-slate-500 mt-1">Enter your credentials to access your dashboard.</p>
          </div>

          {errorMessage && (
            <Alert
              type="error"
              title="Authentication Failed"
              message={errorMessage}
            />
          )}

          <DynamicForm
            fields={loginFields}
            formData={formData}
            onChange={setFormData}
            onSubmit={handleLogin}
            submitButton={
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full mt-4"
                isLoading={isLoading}
                icon={ArrowRight}
              >
                Sign In to Account
              </Button>
            }
          />
        </div>
      </div>
    </div>
  );
}