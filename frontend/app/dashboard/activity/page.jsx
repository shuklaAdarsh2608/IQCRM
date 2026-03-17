"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import api from "../../../services/api";
import { Select } from "../../../components/ui/Select";

const EVENT_LABELS = {
  LOGIN: "Login",
  LOGOUT: "Logout",
  LEAD_UPDATED: "Lead updated",
  LEAD_CREATED: "Lead created",
  LEAD_DELETED: "Lead deleted",
  NOTE_ADDED: "Note added"
};

export default function ActivityLogPage() {
  const [role, setRole] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("all");
   const [page, setPage] = useState(1);
   const pageSize = 25;

  const users = useMemo(() => {
    const map = new Map();
    logs.forEach((l) => {
      if (l.user) map.set(l.user.id, l.user);
    });
    return Array.from(map.values());
  }, [logs]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("iqlead_user");
      if (!raw) return;
      const user = JSON.parse(raw);
      setRole(user?.role || null);
    } catch {
      setRole(null);
    }
  }, []);

  const isAdmin = role === "SUPER_ADMIN" || role === "ADMIN";

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const params = new URLSearchParams();
    if (selectedUserId !== "all") {
      params.set("userId", selectedUserId);
    }

    api
      .get(`/activity-logs?${params.toString()}`)
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          setLogs(res.data.data);
        } else {
          setLogs([]);
        }
      })
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [isAdmin, selectedUserId]);

  const handleExport = async () => {
    if (!isAdmin || exporting) return;
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (selectedUserId !== "all") {
        params.set("userId", selectedUserId);
      }
      const url = params.toString()
        ? `/activity-logs/export?${params.toString()}`
        : `/activity-logs/export`;

      const res = await api.get(url, { responseType: "blob" });
      const blob = new Blob([res.data], {
        type: res.headers["content-type"] || "text/csv;charset=utf-8;"
      });
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download =
        res.headers["content-disposition"]?.split("filename=")?.[1]?.replace(/"/g, "") ||
        "activity-log.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } finally {
      setExporting(false);
    }
  };

  if (role && !isAdmin) {
    return null;
  }

  const totalPages = Math.max(1, Math.ceil(logs.length / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const paginatedLogs = logs.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-800 shadow-sm dark:border-slate-800 dark:bg-slate-900/90 dark:text-slate-100 sm:p-5"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-semibold text-slate-900 dark:text-slate-50 sm:text-lg">
            Activity log
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-300">
            View login, logout and lead activity across your workspace.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Select
            label="User"
            options={[
              { value: "all", label: "All users" },
              ...users.map((u) => ({
                value: String(u.id),
                label: u.name
              }))
            ]}
            value={selectedUserId}
            onChange={(v) => setSelectedUserId(String(v))}
            placeholder="All users"
            className="w-auto min-w-[140px] [&>button]:px-4 [&>button]:py-1.5 [&>button]:text-xs"
          />
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting || !isAdmin}
            className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-4 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-orange-500 hover:border-orange-500 hover:text-white disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-orange-500 dark:hover:border-orange-500 dark:hover:text-white dark:disabled:border-slate-700 dark:disabled:text-slate-500"
          >
            {exporting ? "Exporting…" : "Export log"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-400 border-t-transparent" />
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-xl bg-slate-50 py-10 text-center text-xs text-slate-500 dark:bg-slate-900 dark:text-slate-300">
          No activity recorded yet.
        </div>
      ) : (
        <>
          <div className="space-y-3">
          {paginatedLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[11px] dark:border-slate-700 dark:bg-slate-800/60"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[11px] font-semibold text-slate-700 dark:bg-slate-600 dark:text-slate-100">
                {log.user?.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("") || "U"}
              </div>
              <div className="min-w-0 flex-1 py-0.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-slate-800 dark:text-slate-50">
                    {log.user?.name || "Unknown user"}
                  </p>
                  <span className="shrink-0 text-[10px] text-slate-500 dark:text-slate-400">
                    {log.createdAt ? new Date(log.createdAt).toLocaleString() : ""}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-300">
                  {EVENT_LABELS[log.action] || log.action}
                  {log.lead && (
                    <>
                      {" "}
                      · Lead #{log.lead.id} {log.lead.firstName} {log.lead.lastName}
                    </>
                  )}
                </p>
                {log.details && (
                  <p className="mt-1 line-clamp-3 text-[11px] text-slate-500 dark:text-slate-400">
                    {log.details}
                  </p>
                )}
              </div>
            </div>
          ))}
          </div>
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between gap-3 text-[11px] text-slate-600 dark:text-slate-300">
              <span>
                Page {safePage} of {totalPages} · Showing{" "}
                {paginatedLogs.length} of {logs.length} events
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}

