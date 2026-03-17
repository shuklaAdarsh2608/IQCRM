"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, User, Search } from "lucide-react";
import { motion } from "framer-motion";
import api from "../../services/api";
import { GoalRing } from "./GoalRing";



function formatTimeAgo(date) {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hr ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  return d.toLocaleDateString();
}

export function AdminDashboard() {
  const [summary, setSummary] = useState({
    newLeads: null,
    totalRevenue: null,
    assignedLeadsCount: null,
    wonLeadsCount: null,
    upcomingCallsCount: null
  });
  const [range, setRange] = useState("monthly");
  const [selectedDate, setSelectedDate] = useState(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [role, setRole] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [targetAmount, setTargetAmount] = useState(null);
  const [targetLoaded, setTargetLoaded] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [upcomingCalls, setUpcomingCalls] = useState([]);
  const [latestLeads, setLatestLeads] = useState([]);

  const revenuePercent =
    summary.totalRevenue && summary.totalRevenue > 0
      ? Math.min(
          100,
          Math.max(
            5,
            Math.round(Math.log10(Number(summary.totalRevenue) + 1) * 25)
          )
        )
      : 0;

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("iqlead_user");
      const user = raw ? JSON.parse(raw) : null;
      if (!user?.id) return;
      setRole(user.role);
      setCurrentUser(user);
      const now = new Date();
      api
        .get("/targets", {
          params: {
            userId: user.id,
            month: now.getMonth() + 1,
            year: now.getFullYear()
          }
        })
        .then((res) => {
          const t = res.data?.data?.[0];
          if (t) {
            setTargetAmount(Number(t.targetRevenue || 0));
          } else {
            setTargetAmount(null);
          }
        })
        .catch(() => {
          setTargetAmount(null);
        })
        .finally(() => setTargetLoaded(true));
    } catch {
      setTargetLoaded(true);
      setTargetAmount(null);
    }
  }, []);

  const fetchSummary = (nextRange, dateOverride, fromOverride, toOverride) => {
    api
      .get("/dashboard/summary", {
        params: {
          range: nextRange,
          date: dateOverride || selectedDate || undefined,
          from: fromOverride,
          to: toOverride
        }
      })
      .then((res) => {
        if (res.data?.success && res.data?.data) {
          setSummary((prev) => ({ ...prev, ...res.data.data }));
        }
      })
      .catch(() => {
        setSummary((prev) => ({
          ...prev,
          newLeads: null,
          totalRevenue: null,
          assignedLeadsCount: null,
          wonLeadsCount: null,
          upcomingCallsCount: null
        }));
      });
  };

  useEffect(() => {
    fetchSummary(range);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchLeaderboard = (nextRange, fromOverride, toOverride) => {
    const params = { range: nextRange };
    if (nextRange === "custom" && fromOverride && toOverride) {
      params.from = fromOverride;
      params.to = toOverride;
    }
    api
      .get("/dashboard/leaderboard", { params })
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          setLeaderboard(res.data.data);
        }
      })
      .catch(() => setLeaderboard([]));
  };

  useEffect(() => {
    fetchLeaderboard(range, fromDate, toDate);
  }, [range, fromDate, toDate]);

  useEffect(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 14);
    api
      .get("/leads/scheduled-calls", {
        params: { from: start.toISOString(), to: end.toISOString() }
      })
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          setUpcomingCalls(res.data.data.slice(0, 5));
        }
      })
      .catch(() => setUpcomingCalls([]));
  }, []);

  useEffect(() => {
    api
      .get("/dashboard/latest-leads")
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data?.data)) {
          setLatestLeads(res.data.data);
        }
      })
      .catch(() => setLatestLeads([]));
  }, []);

  return (
    <div className="space-y-4 text-slate-900 dark:text-slate-100">
      {/* Top filters row */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2 text-xs">
          {[
            { key: "today", label: "Today" },
            { key: "yesterday", label: "Yesterday" },
            { key: "weekly", label: "Weekly" },
            { key: "monthly", label: "Monthly" },
            { key: "all", label: "All time" }
          ].map((opt) => (
            <button
              key={opt.key}
              onClick={() => {
                setRange(opt.key);
                setSelectedDate(null);
                fetchSummary(opt.key);
              }}
              className={`rounded-full px-3 py-1 transition-colors ${
                range === opt.key
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-100"
                  : "bg-transparent text-slate-600 hover:bg-white/60 dark:text-slate-300 dark:hover:bg-slate-800/80"
              }`}
            >
              {opt.label}
            </button>
          ))}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-full bg-white/70 px-3 py-1 text-slate-700 shadow-sm dark:bg-slate-900/80 dark:text-slate-100">
              <CalendarDays className="h-3.5 w-3.5 shrink-0" />
              <span className="text-xs">From</span>
            </div>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="min-w-0 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700 outline-none transition-colors focus:ring-2 focus:ring-orange-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            <span className="text-xs text-slate-500 dark:text-slate-300">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="min-w-0 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700 outline-none transition-colors focus:ring-2 focus:ring-orange-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            <button
              type="button"
              onClick={() => {
                if (!fromDate || !toDate) return;
                setRange("custom");
                fetchSummary("custom", undefined, fromDate, toDate);
              }}
              className="rounded-full bg-white/80 px-3 py-1 text-xs text-slate-700 shadow-sm transition-colors hover:bg-white dark:bg-slate-900/80 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              Apply
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button className="rounded-full bg-white/70 px-3 py-1 text-slate-700 shadow-sm dark:bg-slate-900/80 dark:text-slate-100">
            All
          </button>
          <button className="flex items-center gap-2 rounded-full bg-white px-3 py-1 text-slate-700 shadow-sm dark:bg-slate-900/90 dark:text-slate-100">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-[11px] font-medium dark:bg-slate-700 dark:text-slate-50">
              {currentUser?.name
                ? currentUser.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()
                : "—"}
            </span>
            <span>{currentUser?.name || "User"}</span>
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="rounded-2xl bg-white p-4 text-sm shadow-sm dark:bg-slate-900/80 dark:border dark:border-slate-800"
        >
          <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            {summary.newLeads == null ? "—" : summary.newLeads}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">New Leads (this month)</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl bg-white p-4 text-sm shadow-sm dark:bg-slate-900/80 dark:border dark:border-slate-800"
        >
          <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            {summary.assignedLeadsCount == null ? "—" : summary.assignedLeadsCount}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">Assigned Leads</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl bg-white p-4 text-sm shadow-sm dark:bg-slate-900/80 dark:border dark:border-slate-800"
        >
          <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            {summary.wonLeadsCount == null ? "—" : summary.wonLeadsCount}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">Won Leads</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl bg-white p-4 text-sm shadow-sm dark:bg-slate-900/80 dark:border dark:border-slate-800"
        >
          <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            {summary.upcomingCallsCount == null ? "—" : summary.upcomingCallsCount}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">Upcoming Calls</p>
        </motion.div>
      </div>

      {/* Goals + Lead source */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900/80 dark:border dark:border-slate-800">
          {role === "SUPER_ADMIN" || role === "ADMIN" ? (
            <>
              <p className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-50">
                Total revenue
              </p>
              <div className="flex flex-col items-center justify-center py-4">
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
                  {summary.totalRevenue == null
                    ? "—"
                    : `₹${summary.totalRevenue.toLocaleString("en-IN")}`}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
                  Total deal value in selected period
                </p>
                <div className="mt-4 w-full space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-300">
                    <span>Revenue momentum</span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                      {revenuePercent > 0 ? `${revenuePercent}% of target*` : "No revenue yet"}
                    </span>
                  </div>
                  <div className="relative h-3 overflow-hidden rounded-full bg-slate-100 shadow-inner dark:bg-slate-800">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${revenuePercent}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-amber-300"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(255,255,255,0.6),transparent_40%),radial-gradient(circle_at_100%_0%,rgba(255,255,255,0.35),transparent_40%)] mix-blend-screen" />
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">
                    *Relative momentum based on current period revenue.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              <p className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-50">Goals</p>
              {targetLoaded ? (
                targetAmount != null ? (
                  <GoalRing
                    value={summary.totalRevenue || 0}
                    total={targetAmount}
                    label={`of ₹${targetAmount.toLocaleString()} this month`}
                    subLabel="Revenue achieved"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-4 text-xs text-slate-500 dark:text-slate-300">
                    No target set for this month
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center py-4 text-xs text-slate-500 dark:text-slate-300">
                  Loading target...
                </div>
              )}
            </>
          )}
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900/80 dark:border dark:border-slate-800">
          <p className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-50">
            Revenue Leaderboard
          </p>
          <div className="space-y-3 text-xs">
            {leaderboard.length === 0 ? (
              <p className="py-4 text-center text-slate-500 dark:text-slate-400">
                No revenue in selected period
              </p>
            ) : (
              leaderboard.map((entry, idx) => {
                const colors = ["bg-amber-400", "bg-slate-300", "bg-amber-700", "bg-slate-500"];
                const color = colors[idx] || colors[3];
                const rankStyles =
                  idx === 0
                    ? "bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-900"
                    : idx === 1
                      ? "bg-gradient-to-r from-slate-200 to-slate-400 text-slate-900"
                      : idx === 2
                        ? "bg-gradient-to-r from-amber-700 to-orange-500 text-white"
                        : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200";
                return (
                  <div key={entry.userId} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${rankStyles}`}
                        >
                          {idx + 1}
                        </span>
                        <p className="font-medium text-slate-800 dark:text-slate-100 truncate max-w-[120px]">
                          {entry.name}
                        </p>
                      </div>
                      <p className="font-medium text-slate-800 dark:text-slate-100 shrink-0">
                        ₹{Number(entry.revenue || 0).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 14 }).map((_, i) => (
                        <span
                          key={i}
                          className={`h-1.5 w-3 rounded-full ${color} ${
                            i % 3 === 0 ? "opacity-60" : i % 3 === 1 ? "opacity-70" : "opacity-80"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Upcoming meetings + latest leads */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900/80 dark:border dark:border-slate-800">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Upcoming Calls
            </p>
            <Link
              href="/calendar"
              className="text-xs text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300"
            >
              View calendar
            </Link>
          </div>
          <div className="space-y-3 text-xs">
            {upcomingCalls.length === 0 ? (
              <p className="py-4 text-center text-slate-500 dark:text-slate-400">
                No scheduled calls
              </p>
            ) : (
              upcomingCalls.map((c) => {
                const when = new Date(c.scheduledTime);
                const lead = c.lead;
                const title = lead
                  ? `${lead.firstName || ""} ${lead.lastName || ""} – ${c.agenda || "Call"}`.trim() || c.agenda || "Scheduled call"
                  : c.agenda || "Scheduled call";
                const diffMs = when - new Date();
                const diffMins = Math.round(diffMs / 60000);
                const timeStr =
                  diffMins > 0 && diffMins < 60
                    ? `In ${diffMins} min`
                    : diffMins >= 60 && diffMins < 1440
                      ? `In ${Math.floor(diffMins / 60)} hr`
                      : when.toLocaleString("en-IN", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        });
                return (
                  <Link
                    key={c.id}
                    href={lead?.id ? `/dashboard/leads/${lead.id}` : "/dashboard/leads"}
                    className="flex items-start gap-3 rounded-2xl bg-white p-3 shadow-sm transition hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800"
                  >
                    <div className="mt-0.5 h-6 w-6 shrink-0 rounded-lg bg-emerald-100 dark:bg-emerald-500/30" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400">{timeStr}</p>
                      <p className="text-[13px] font-medium text-slate-900 dark:text-slate-50 truncate">
                        {title}
                      </p>
                      {c.user?.name && (
                        <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                          {c.user.name}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900/80 dark:border dark:border-slate-800">
          <div className="mb-2">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">Latest Leads</p>
          </div>
          <div className="space-y-3 text-xs">
            {latestLeads.length === 0 ? (
              <p className="py-4 text-center text-slate-500 dark:text-slate-400">No leads yet</p>
            ) : (
              latestLeads.map((lead) => {
                const name = [lead.firstName, lead.lastName].filter(Boolean).join(" ") || "—";
                const initials = name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();
                return (
                  <Link
                    key={lead.id}
                    href={`/dashboard/leads/${lead.id}`}
                    className="flex items-center justify-between rounded-2xl bg-white p-3 shadow-sm transition hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-50">
                        {initials}
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-slate-900 dark:text-slate-50">
                          {name}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-300">
                          {formatTimeAgo(lead.createdAt)}
                        </p>
                      </div>
                    </div>
                    <Search className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-300" />
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

