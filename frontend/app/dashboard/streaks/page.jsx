"use client";

import { useEffect, useState } from "react";
import api from "../../../services/api";
import { Award, Flame, Timer, TrendingUp, Trophy, Users } from "lucide-react";

export default function MyStreakPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [activeLeadCount, setActiveLeadCount] = useState(null);
  const [wonLeadCount, setWonLeadCount] = useState(null);

  useEffect(() => {
    setLoading(true);
    api
      .get("/streaks/me")
      .then((res) => {
        if (res.data?.success) setData(res.data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadCounts = async () => {
      try {
        const [activeRes, wonRes] = await Promise.all([
          api.get("/leads", { params: { status: "ACTIVE", limit: 1, page: 1 } }),
          api.get("/leads", { params: { status: "WON", limit: 1, page: 1 } })
        ]);
        if (cancelled) return;
        setActiveLeadCount(Number(activeRes.data?.pagination?.total ?? 0));
        setWonLeadCount(Number(wonRes.data?.pagination?.total ?? 0));
      } catch {
        if (cancelled) return;
        setActiveLeadCount(0);
        setWonLeadCount(0);
      }
    };
    loadCounts();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-6 text-sm text-slate-600 shadow-sm dark:border dark:border-slate-800 dark:bg-slate-900/90 dark:text-slate-200">
        Loading...
      </div>
    );
  }

  const s = data?.streak;
  const counts = data?.counts;
  const current = Number(s?.currentStreakCount || 0);
  const longest = Number(s?.longestStreakCount || 0);
  const wins = Number(s?.totalApprovedWins || 0);
  const revenue = Number(s?.totalApprovedRevenue || 0);
  const pending = Number(counts?.pendingCount || 0);
  const expired = Number(counts?.expiredCount || 0);
  const status = (s?.streakStatus || "BROKEN").toUpperCase();

  const ringTotal = Math.max(longest, 1);
  const ringPct = Math.max(0, Math.min(100, Math.round((current / ringTotal) * 100)));

  const gauge = (val, max = 10) => {
    const v = Math.max(0, Math.min(max, Number(val || 0)));
    const pct = Math.round((v / max) * 100);
    return pct;
  };

  // Fun “skills” derived from real metrics (purely presentational)
  const explorationSkill = gauge(Math.min(10, Math.round(Math.log10(wins + 1) * 4)), 10);
  const contributionSkill = gauge(Math.min(10, Math.round(Math.log10(revenue + 1) * 2.5)), 10);

  const badges = [
    { key: "topStreak", label: "STREAK", value: `${current}D`, icon: Flame, tone: "from-amber-400 to-orange-500" },
    { key: "wins", label: "WINS", value: `${wins}`, icon: Trophy, tone: "from-emerald-400 to-teal-500" },
    { key: "revenue", label: "REVENUE", value: `₹ ${revenue.toLocaleString("en-IN")}`, icon: TrendingUp, tone: "from-sky-400 to-indigo-500" }
  ];

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">My streak</h1>
          <p className="text-sm text-slate-500 dark:text-slate-300">Revenue counts only after approval within 72 hours.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
            status === "ACTIVE"
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200"
              : "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-200"
          }`}>
            <Timer className="h-3.5 w-3.5" />
            {status}
          </span>
        </div>
      </div>

      {/* Hero + gauges + badges */}
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-300">CURRENT STREAK</p>
              <p className="mt-1 flex items-center gap-2 text-3xl font-semibold text-slate-900 dark:text-slate-50">
                <span>{current}</span>
                <Flame
                  className={
                    "h-7 w-7 " +
                    (status === "ACTIVE"
                      ? "text-orange-500 animate-pulse"
                      : "text-slate-400 dark:text-slate-300")
                  }
                />
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Longest: {longest} days · Approved wins: {wins}</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-100">
              <Award className="h-4 w-4 text-amber-500" />
              TOP {Math.max(1, Math.min(99, 100 - ringPct))}%
            </div>
          </div>

          {/* Ring */}
          <div className="mt-5 flex items-center justify-center">
            <div
              className="relative h-44 w-44 rounded-full"
              style={{
                background: `conic-gradient(${status === "ACTIVE" ? "#22c55e" : "#f97316"} ${ringPct * 3.6}deg, rgba(148,163,184,0.25) 0deg)`
              }}
            >
              <div className="absolute inset-3 rounded-full bg-white shadow-inner dark:bg-slate-950/60" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-3xl font-semibold text-slate-900 dark:text-slate-50">{current}</p>
                  <div className="mt-1 flex items-center justify-center gap-1.5 text-[11px] font-semibold tracking-wide text-slate-500 dark:text-slate-400">
                    <Flame
                      className={
                        "h-3.5 w-3.5 " +
                        (status === "ACTIVE"
                          ? "text-orange-500 animate-pulse"
                          : "text-slate-400 dark:text-slate-300")
                      }
                    />
                    <span>STREAK</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mini stats */}
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-950/40">
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">PENDING</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">{pending}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-950/40">
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">EXPIRED</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">{expired}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-950/40">
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">REVENUE</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">₹ {revenue.toLocaleString("en-IN")}</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
            <p className="text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-300">EXPLORATION SKILL</p>
            <div className="mt-3 h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="h-2.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-indigo-500" style={{ width: `${explorationSkill}%` }} />
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{Math.round((explorationSkill / 100) * 10)} / 10</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
            <p className="text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-300">CONTRIBUTION SKILL</p>
            <div className="mt-3 h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="h-2.5 rounded-full bg-gradient-to-r from-rose-500 to-amber-500" style={{ width: `${contributionSkill}%` }} />
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{Math.round((contributionSkill / 100) * 10)} / 10</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
            <p className="text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-300">LEADS</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-950/40">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">ACTIVE</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                  {activeLeadCount == null ? "—" : activeLeadCount}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-950/40">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">WON</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                  {wonLeadCount == null ? "—" : wonLeadCount}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/90">
          <p className="text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-300">ACHIEVEMENTS</p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {badges.map((b) => {
              const Icon = b.icon;
              return (
                <div key={b.key} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center dark:border-slate-800 dark:bg-slate-950/40">
                  <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${b.tone} text-white shadow-sm`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <p className="mt-2 text-[11px] font-semibold tracking-wide text-slate-500 dark:text-slate-400">{b.label}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-900 dark:text-slate-50">{b.value}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-3 text-white shadow-sm dark:border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-amber-300" />
                <p className="text-sm font-semibold">Top ways to keep streak</p>
              </div>
              <p className="text-xs text-white/80">Approve within 72h · Avoid gaps</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

