"use client";

import { useEffect, useState } from "react";
import { CalendarDays, User, Search } from "lucide-react";
import { motion } from "framer-motion";
import api from "../../services/api";
import { GoalRing } from "./GoalRing";

const leadSources = [
  { label: "Email Parsing", value: 7896, color: "bg-orange-400" },
  { label: "API", value: 325, color: "bg-purple-400" },
  { label: "Lead Scrap", value: 24, color: "bg-slate-700" }
];

const upcomingMeetings = [
  {
    title: "Sam Saltman's Meeting - Sales Team",
    time: "In 30 min"
  }
];

const latestLeads = [
  { name: "Silvia Zieme", time: "Just Now" },
  { name: "Luke King", time: "1 Minute Ago" }
];

export function AdminDashboard() {
  const [summary, setSummary] = useState({ newLeads: null, totalRevenue: null });
  const [range, setRange] = useState("monthly");
  const [selectedDate, setSelectedDate] = useState(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [role, setRole] = useState(null);
  const [targetAmount, setTargetAmount] = useState(null);
  const [targetLoaded, setTargetLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("iqlead_user");
      const user = raw ? JSON.parse(raw) : null;
      if (!user?.id) return;
      setRole(user.role);
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
        setSummary((prev) => ({ ...prev, newLeads: null, totalRevenue: null }));
      });
  };

  useEffect(() => {
    fetchSummary(range);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            { key: "monthly", label: "Monthly" }
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
              JS
            </span>
            <span>John Sharts</span>
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="rounded-2xl bg-white/80 p-4 text-sm shadow-sm dark:bg-slate-900/80 dark:border dark:border-slate-800"
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
          className="rounded-2xl bg-white/80 p-4 text-sm shadow-sm dark:bg-slate-900/80 dark:border dark:border-slate-800"
        >
          <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">65</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">New Customers</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl bg-white/80 p-4 text-sm shadow-sm dark:bg-slate-900/80 dark:border dark:border-slate-800"
        >
          <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">628</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">Sent Invoices</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl bg-white/80 p-4 text-sm shadow-sm dark:bg-slate-900/80 dark:border dark:border-slate-800"
        >
          <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">5</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">Current Tasks</p>
        </motion.div>
      </div>

      {/* Goals + Lead source */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-white/80 p-4 shadow-sm dark:bg-slate-900/80 dark:border dark:border-slate-800">
          {role === "SUPER_ADMIN" || role === "ADMIN" ? (
            <>
              <p className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-50">
                Total revenue
              </p>
              <div className="flex flex-col items-center justify-center py-4">
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
                  {summary.totalRevenue == null
                    ? "—"
                    : `₹${summary.totalRevenue.toLocaleString()}`}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
                  Total deal value in selected period
                </p>
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

        <div className="rounded-2xl bg-white/80 p-4 shadow-sm dark:bg-slate-900/80 dark:border dark:border-slate-800">
          <p className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-50">Lead Source</p>
          <div className="space-y-3 text-xs">
            {leadSources.map((src) => (
              <div key={src.label} className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-800 dark:text-slate-100">{src.label}</p>
                  <p className="text-slate-500 dark:text-slate-300">{src.value}</p>
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 14 }).map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 w-3 rounded-full ${src.color} opacity-${
                        60 + (i % 3) * 10
                      }`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming meetings + latest leads */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-white/80 p-4 shadow-sm dark:bg-slate-900/80 dark:border dark:border-slate-800">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Upcoming Meetings
            </p>
          </div>
          <div className="space-y-3 text-xs">
            {upcomingMeetings.map((m) => (
              <div
                key={m.title}
                className="flex items-start gap-3 rounded-2xl bg-white p-3 shadow-sm dark:bg-slate-900"
              >
                <div className="mt-0.5 h-6 w-6 rounded-lg bg-emerald-100 dark:bg-emerald-500/30" />
                <div>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400">{m.time}</p>
                  <p className="text-[13px] font-medium text-slate-900 dark:text-slate-50">
                    {m.title}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white/80 p-4 shadow-sm dark:bg-slate-900/80 dark:border dark:border-slate-800">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">Latest Leads</p>
            <button className="text-xs text-orange-500 dark:text-orange-400">See All</button>
          </div>
          <div className="space-y-3 text-xs">
            {latestLeads.map((lead) => (
                <div
                  key={lead.name}
                  className="flex items-center justify-between rounded-2xl bg-white p-3 shadow-sm dark:bg-slate-900"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[11px] font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-50">
                    {lead.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                    <div>
                      <p className="text-[13px] font-medium text-slate-900 dark:text-slate-50">
                      {lead.name}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-300">{lead.time}</p>
                  </div>
                </div>
                <Search className="h-3.5 w-3.5 text-slate-400 dark:text-slate-300" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

