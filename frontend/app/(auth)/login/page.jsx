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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await loginRequest({ email, password });
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
      const message =
        err?.response?.data?.message || "Unable to login. Please check credentials.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-slate-900 dark:text-slate-100">
      <PublicHeader />
      <div className="flex items-center justify-center px-4 pb-10 pt-4 sm:pb-16 sm:pt-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-3xl bg-white/90 p-6 text-sm text-slate-800 shadow-[0_18px_60px_rgba(15,23,42,0.15)] ring-1 ring-slate-100 dark:bg-slate-950/90 dark:text-slate-100 dark:ring-slate-800 sm:p-8"
        >
          <h1 className="mb-1 text-xl font-semibold text-slate-900 sm:text-2xl">
            Welcome back
          </h1>
          <p className="mb-6 text-xs text-slate-500 sm:text-[13px]">
            Sign in to access your IQLead CRM dashboard and manage your leads, targets and
            reports.
          </p>
          <form className="space-y-4 text-sm" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Email
              </label>
              <input
                type="email"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Password
              </label>
              <input
                type="password"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            <div className="flex items-center justify-start gap-2 text-[11px]">
              <label className="flex items-center gap-1 text-slate-600">
                <input type="checkbox" className="rounded border-slate-300" />
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
              className="mt-2 w-full rounded-xl bg-slate-900 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

