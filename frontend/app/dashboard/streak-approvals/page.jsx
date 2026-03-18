"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import api from "../../../services/api";

const APPROVER_ROLES = ["MANAGER", "ADMIN", "SUPER_ADMIN"];

function timeLeft(deadline) {
  if (!deadline) return { label: "—", tone: "neutral" };
  const ms = new Date(deadline).getTime() - Date.now();
  if (ms <= 0) return { label: "Expired", tone: "danger" };
  const hours = ms / (1000 * 60 * 60);
  const h = Math.floor(hours);
  const m = Math.floor((hours - h) * 60);
  if (hours <= 6) return { label: `${h}h ${m}m`, tone: "danger" };
  if (hours <= 24) return { label: `${h}h ${m}m`, tone: "warn" };
  const d = Math.floor(hours / 24);
  return { label: `${d}d ${h % 24}h`, tone: "ok" };
}

const toneClass = {
  ok: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200",
  warn: "bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200",
  danger: "bg-red-50 text-red-700 dark:bg-red-500/20 dark:text-red-200",
  neutral: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100"
};

export default function StreakApprovalsPage() {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("PENDING");
  const [approvals, setApprovals] = useState([]);
  const [q, setQ] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("iqlead_user");
      const u = raw ? JSON.parse(raw) : null;
      setRole(u?.role || null);
    } catch {
      setRole(null);
    }
  }, []);

  const allowed = role && APPROVER_ROLES.includes(role);

  const load = () => {
    setLoading(true);
    api
      .get(`/streak-approvals/pending?status=${encodeURIComponent(status)}`)
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data)) setApprovals(res.data.data);
        else setApprovals([]);
      })
      .catch(() => setApprovals([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!allowed) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed, status]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return approvals;
    return approvals.filter((a) => {
      const lead = a.lead || {};
      const salesUser = a.salesUser || {};
      const fields = [
        `${lead.firstName || ""} ${lead.lastName || ""}`,
        lead.company || "",
        salesUser.name || "",
        String(a.wonAmount || ""),
        a.approvalStatus || ""
      ]
        .join(" ")
        .toLowerCase();
      return fields.includes(needle);
    });
  }, [approvals, q]);

  const approve = (id) => {
    setActionLoadingId(id);
    api
      .post(`/streak-approvals/${id}/approve`, { paymentReceived: true })
      .then(() => load())
      .finally(() => setActionLoadingId(null));
  };

  const reject = (id) => {
    const rejectionNote = window.prompt("Reason to reject?") || "";
    setActionLoadingId(id);
    api
      .post(`/streak-approvals/${id}/reject`, { rejectionNote })
      .then(() => load())
      .finally(() => setActionLoadingId(null));
  };

  if (role && !allowed) {
    return (
      <div className="rounded-2xl bg-white p-6 text-sm text-slate-600 shadow-sm dark:bg-slate-900 dark:text-slate-200">
        Not authorized.
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Won revenue approvals</h1>
          <p className="text-sm text-slate-500 dark:text-slate-300">Approve WON revenue within 72 hours to maintain streak.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search lead, company, user..."
            className="w-full max-w-[260px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="EXPIRED">Expired</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
        {loading ? (
          <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-300">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-300">No approvals.</div>
        ) : (
          <table className="min-w-[900px] w-full border-collapse text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900 dark:text-slate-300">
              <tr>
                <th className="border-b border-slate-200 px-4 py-3 text-left dark:border-slate-800">Lead</th>
                <th className="border-b border-slate-200 px-4 py-3 text-left dark:border-slate-800">Company</th>
                <th className="border-b border-slate-200 px-4 py-3 text-left dark:border-slate-800">Sales user</th>
                <th className="border-b border-slate-200 px-4 py-3 text-left dark:border-slate-800">Won amount</th>
                <th className="border-b border-slate-200 px-4 py-3 text-left dark:border-slate-800">Won at</th>
                <th className="border-b border-slate-200 px-4 py-3 text-left dark:border-slate-800">Deadline</th>
                <th className="border-b border-slate-200 px-4 py-3 text-left dark:border-slate-800">Time left</th>
                <th className="border-b border-slate-200 px-4 py-3 text-left dark:border-slate-800">Status</th>
                <th className="border-b border-slate-200 px-4 py-3 text-right dark:border-slate-800">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => {
                const lead = a.lead || {};
                const salesUser = a.salesUser || {};
                const left = timeLeft(a.approvalDeadlineAt);
                return (
                  <tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50/60 dark:border-slate-800 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-50">
                      <Link className="hover:underline" href={`/dashboard/leads/${lead.id}`}>
                        {lead.firstName || "—"} {lead.lastName || ""}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-200">{lead.company || "—"}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-200">{salesUser.name || "—"}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-100">₹ {Number(a.wonAmount || 0).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-200">{a.wonAt ? new Date(a.wonAt).toLocaleString() : "—"}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-200">{a.approvalDeadlineAt ? new Date(a.approvalDeadlineAt).toLocaleString() : "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${toneClass[left.tone]}`}>
                        {left.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-100">
                        {a.approvalStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {a.approvalStatus === "PENDING" ? (
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => approve(a.id)}
                            disabled={actionLoadingId === a.id}
                            className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
                          >
                            {actionLoadingId === a.id ? "..." : "Approve"}
                          </button>
                          <button
                            type="button"
                            onClick={() => reject(a.id)}
                            disabled={actionLoadingId === a.id}
                            className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

