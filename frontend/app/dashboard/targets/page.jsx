"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import api from "../../../services/api";
import { Select } from "../../../components/ui/Select";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

const TARGET_ROLES = ["TEAM_LEADER", "USER"];
const MANAGER_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER"];

export default function TargetsPage() {
  const now = new Date();
  const [allowed, setAllowed] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [amount, setAmount] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingTarget, setLoadingTarget] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("iqlead_user");
      const user = raw ? JSON.parse(raw) : null;
      const canManage = user && MANAGER_ROLES.includes(user.role);
      setAllowed(canManage);
      if (!canManage) {
        // non-managers should not be here
        window.location.replace("/dashboard");
      }
    } catch {
      setAllowed(false);
      window.location.replace("/dashboard");
    }
  }, []);

  useEffect(() => {
    if (allowed !== true) return;
    setLoadingUsers(true);
    api
      .get("/users/options")
      .then((res) => {
        if (res.data?.success && res.data?.data) {
          setUsers(res.data.data);
          const targetable = res.data.data.filter((u) =>
            TARGET_ROLES.includes(u.role)
          );
          if (targetable.length && !selectedUserId) {
            setSelectedUserId(String(targetable[0].id));
          }
        }
      })
      .finally(() => setLoadingUsers(false));
  }, [allowed, selectedUserId]);

  const filteredUsers = useMemo(
    () => users.filter((u) => TARGET_ROLES.includes(u.role)),
    [users]
  );

  useEffect(() => {
    if (!selectedUserId || allowed !== true) return;
    setLoadingTarget(true);
    setMessage(null);
    api
      .get("/targets", {
        params: { userId: selectedUserId, month, year }
      })
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data) && res.data.data[0]) {
          const t = res.data.data[0];
          setAmount(t.targetRevenue?.toString() ?? "");
        } else {
          setAmount("");
        }
      })
      .catch(() => {
        setAmount("");
      })
      .finally(() => setLoadingTarget(false));
  }, [selectedUserId, month, year, allowed]);

  const handleSave = (e) => {
    e.preventDefault();
    if (!selectedUserId) return;
    setSaving(true);
    setMessage(null);
    api
      .post("/targets", {
        userId: Number(selectedUserId),
        month,
        year,
        targetRevenue: Number(amount || 0)
      })
      .then(() => {
        setMessage({ type: "success", text: "Target saved." });
      })
      .catch((err) => {
        setMessage({
          type: "error",
          text:
            err.response?.data?.message || err.message || "Failed to save target."
        });
      })
      .finally(() => setSaving(false));
  };

  if (allowed === false) return null;
  if (allowed !== true)
    return (
      <div className="rounded-2xl bg-white/80 p-6 text-sm text-slate-500 dark:bg-slate-900/80 dark:text-slate-300">
        Checking access...
      </div>
    );

  return (
    <div className="rounded-2xl bg-white/80 p-6 text-sm text-slate-700 shadow-sm dark:bg-slate-900/85 dark:text-slate-100 dark:border dark:border-slate-800">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Targets</h1>
        <Link
          href="/dashboard"
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Back to Dashboard
        </Link>
      </div>

      <p className="mb-4 text-xs text-slate-500 dark:text-slate-300">
        Select a Team Leader or Sales Executive, choose month and year, and set their target
        revenue.
      </p>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="min-w-[200px]">
            <Select
              label="User"
              options={filteredUsers.map((u) => ({
                value: u.id,
                label: `${u.name} (${u.role})`
              }))}
              value={selectedUserId}
              onChange={(v) => setSelectedUserId(String(v))}
              placeholder={loadingUsers ? "Loading users..." : "Select user"}
              disabled={loadingUsers || filteredUsers.length === 0}
            />
          </div>
          <div className="min-w-[180px]">
            <Select
              label="Month"
              options={MONTHS.map((m, idx) => ({
                value: idx + 1,
                label: m
              }))}
              value={month}
              onChange={(v) => setMonth(Number(v))}
              placeholder="Select month"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
              Year
            </label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              min={2000}
              max={2100}
            />
          </div>
        </div>

        <div className="max-w-xs">
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
            Target amount (revenue)
          </label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={loadingTarget}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            placeholder="0.00"
          />
          {loadingTarget && (
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-300">Loading current target…</p>
          )}
        </div>

        {message && (
          <p
            className={`rounded-lg px-3 py-2 text-xs ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                : "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300"
            }`}
          >
            {message.text}
          </p>
        )}

        <button
          type="submit"
          disabled={saving || !selectedUserId}
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save target"}
        </button>
      </form>
    </div>
  );
}

