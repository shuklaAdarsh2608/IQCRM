"use client";

import { useEffect, useState } from "react";
import api from "../../../services/api";

export default function MyStreakPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    setLoading(true);
    api
      .get("/streaks/me")
      .then((res) => {
        if (res.data?.success) setData(res.data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-6 text-sm text-slate-600 shadow-sm dark:bg-slate-900 dark:text-slate-200">
        Loading...
      </div>
    );
  }

  const s = data?.streak;
  const counts = data?.counts;
  const recent = data?.recent || [];

  return (
    <div className="min-w-0 space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">My streak</h1>
        <p className="text-sm text-slate-500 dark:text-slate-300">Approved WON revenue maintains your streak.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900/80 dark:border dark:border-slate-800">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-300">Current streak</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-50">{Number(s?.currentStreakCount || 0)}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">{s?.streakStatus || "—"}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900/80 dark:border dark:border-slate-800">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-300">Longest streak</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-50">{Number(s?.longestStreakCount || 0)}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900/80 dark:border dark:border-slate-800">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-300">Approved wins</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-50">{Number(s?.totalApprovedWins || 0)}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900/80 dark:border dark:border-slate-800">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-300">Approved revenue</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-50">₹ {Number(s?.totalApprovedRevenue || 0).toLocaleString("en-IN")}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">Pending: {Number(counts?.pendingCount || 0)} · Expired: {Number(counts?.expiredCount || 0)}</p>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900/80 dark:border dark:border-slate-800">
        <p className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-50">Recent activity</p>
        {recent.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-300">No streak events yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {recent.map((r) => (
              <li key={r.id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900/40">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-medium text-slate-800 dark:text-slate-100">{r.actionType}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-300">{r.created_at ? new Date(r.created_at).toLocaleString() : ""}</div>
                </div>
                <div className="mt-1 text-xs text-slate-600 dark:text-slate-200">
                  Streak: {r.streakBefore} → {r.streakAfter}
                  {r.revenueAmount != null ? ` · ₹ ${Number(r.revenueAmount).toLocaleString("en-IN")}` : ""}
                  {r.lead ? ` · Lead: ${r.lead.firstName || ""} ${r.lead.lastName || ""}` : ""}
                </div>
                {r.note && <div className="mt-1 text-xs text-slate-500 dark:text-slate-300">{r.note}</div>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

