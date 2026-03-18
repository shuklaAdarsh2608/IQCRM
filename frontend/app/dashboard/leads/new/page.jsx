"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "../../../../services/api";

const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN"];
const STATUS_OPTIONS = [
  "FRESH",
  "ACTIVE",
  "SCHEDULED",
  "NO REPLY",
  "SWITCHED OFF",
  "WON",
  "LOST",
  "DEFERRED",
  "WRONG NUMBER",
  "QUALIFIED"
];

export default function NewLeadPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    title: "",
    company: "",
    phone: "",
    email: "",
    status: "FRESH"
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("iqlead_user");
      const user = raw ? JSON.parse(raw) : null;
      const ok = !!user && ADMIN_ROLES.includes(user.role);
      setAllowed(ok);
      if (!ok) router.replace("/dashboard/leads");
    } catch {
      setAllowed(false);
      router.replace("/dashboard/leads");
    }
  }, [router]);

  const canSubmit = useMemo(() => form.firstName.trim().length > 0 && !loading, [form.firstName, loading]);

  const update = (key) => (e) => {
    const value = e?.target?.value ?? "";
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.firstName.trim()) {
      setError("First name is required.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim() || undefined,
        title: form.title.trim() || undefined,
        company: form.company.trim() || undefined,
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        status: form.status || "FRESH"
      };
      const res = await api.post("/leads", payload);
      if (res.data?.success) {
        const id = res.data?.data?.id;
        router.replace(id ? `/dashboard/leads/${id}` : "/dashboard/leads");
      } else {
        setError("Failed to create lead.");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to create lead.");
    } finally {
      setLoading(false);
    }
  };

  if (allowed === false) return null;
  if (allowed !== true) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
        Checking access...
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Create lead</h1>
        <Link
          href="/dashboard/leads"
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Back to Leads
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-1">
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-200">
            First Name <span className="text-orange-500">*</span>
          </label>
          <input
            value={form.firstName}
            onChange={update("firstName")}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-200/50 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-900"
            placeholder="Enter first name"
          />
        </div>

        <div className="sm:col-span-1">
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-200">Last Name</label>
          <input
            value={form.lastName}
            onChange={update("lastName")}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-200/50 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-900"
            placeholder="Enter last name"
          />
        </div>

        <div className="sm:col-span-1">
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-200">Designation</label>
          <input
            value={form.title}
            onChange={update("title")}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-200/50 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-900"
            placeholder="e.g. Founder, Manager"
          />
        </div>

        <div className="sm:col-span-1">
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-200">Company</label>
          <input
            value={form.company}
            onChange={update("company")}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-200/50 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-900"
            placeholder="Company name"
          />
        </div>

        <div className="sm:col-span-1">
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-200">Number</label>
          <input
            value={form.phone}
            onChange={update("phone")}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-200/50 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-900"
            placeholder="Phone / Mobile"
          />
        </div>

        <div className="sm:col-span-1">
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-200">Mail ID</label>
          <input
            value={form.email}
            onChange={update("email")}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-200/50 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-900"
            placeholder="Email"
          />
        </div>

        <div className="sm:col-span-1">
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-200">Status</label>
          <select
            value={form.status}
            onChange={update("status")}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          {error && (
            <p className="mb-3 rounded-xl bg-red-50 px-4 py-2 text-xs text-red-600 dark:bg-red-500/10 dark:text-red-300">
              {error}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-orange-600 disabled:opacity-50 dark:bg-orange-500 dark:hover:bg-orange-400"
            >
              {loading ? "Creating…" : "Create lead"}
            </button>
            <Link
              href="/dashboard/leads"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}

