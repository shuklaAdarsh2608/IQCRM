"use client";

import "../../globals.css";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { login as loginRequest } from "../../../services/authService";
import { PublicHeader } from "../../../components/layout/PublicHeader";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSessionModal, setShowSessionModal] = useState(false);

  const performLogin = async ({ forceTerminate = false } = {}) => {
    setError("");
    setLoading(true);
    try {
      const res = await loginRequest({ email, password, forceTerminate });
      if (typeof window !== "undefined") {
        const payload = res?.data?.data || res?.data || {};
        if (payload.token && payload.user) {
          window.localStorage.setItem("iqlead_token", payload.token);
          window.localStorage.setItem(
            "iqlead_user",
            JSON.stringify(payload.user)
          );
        }
      }
      router.push("/dashboard");
    } catch (err) {
      const code = err?.response?.data?.code;
      const message =
        err?.response?.data?.message ||
        "Unable to login. Please check credentials.";

      if (code === "SESSION_ALREADY_ACTIVE") {
        setShowSessionModal(true);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowSessionModal(false);
    await performLogin({ forceTerminate: false });
  };

  const handleTerminateAndLogin = async () => {
    setShowSessionModal(false);
    await performLogin({ forceTerminate: true });
  };

  const handleCancelModal = () => {
    setShowSessionModal(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#ffe3d2] via-[#ffeef0] to-[#fdf7ff] text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-100">
      <PublicHeader />
      <div className="flex items-center justify-center px-4 pb-10 pt-4 sm:pb-16 sm:pt-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-3xl bg-white/90 p-6 text-sm text-slate-800 shadow-[0_18px_60px_rgba(15,23,42,0.15)] ring-1 ring-slate-100 dark:bg-slate-900/95 dark:text-slate-100 dark:ring-slate-700 dark:shadow-[0_18px_60px_rgba(0,0,0,0.4)] sm:p-8"
        >
          <h1 className="mb-1 text-xl font-semibold text-slate-900 dark:text-white sm:text-2xl">
            Welcome back
          </h1>
          <p className="mb-6 text-xs text-slate-500 dark:text-slate-300 sm:text-[13px]">
            Sign in to access your IQLead CRM dashboard and manage your leads, targets and
            reports.
          </p>
          <form className="space-y-4 text-sm" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
                Email
              </label>
              <input
                type="email"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-200 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-orange-500 dark:focus:ring-orange-500/30"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
                Password
              </label>
              <input
                type="password"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-200 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-orange-500 dark:focus:ring-orange-500/30"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            <div className="flex items-center justify-start gap-2 text-[11px]">
              <label className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                <input type="checkbox" className="rounded border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:accent-orange-500" />
                <span>Remember me</span>
              </label>
            </div>
            {error && (
              <p className="text-[11px] text-red-500" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-slate-900 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-70 dark:bg-orange-500 dark:hover:bg-orange-600 dark:focus:ring-orange-500/50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </motion.div>
      </div>
      {showSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-2xl bg-white p-4 text-sm shadow-xl dark:bg-slate-900 dark:text-slate-100">
            <h2 className="mb-2 text-base font-semibold text-slate-900 dark:text-slate-50">
              Session already active
            </h2>
            <p className="mb-4 text-xs text-slate-600 dark:text-slate-300">
              This account is logged in on another device. If you continue, the previous
              session will be terminated.
            </p>
            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={handleCancelModal}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTerminateAndLogin}
                className="rounded-lg bg-orange-500 px-3 py-1.5 font-medium text-white hover:bg-orange-600 dark:bg-orange-500 dark:hover:bg-orange-600"
              >
                Terminate &amp; Login
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

