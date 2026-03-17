"use client";

import { useState } from "react";
import Link from "next/link";
import api from "../../../../../services/api";

export default function ScheduleCallForLeadPage({ params }) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [agenda, setAgenda] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    if (!date || !time || !agenda.trim()) {
      setMessage({ type: "error", text: "Please select date, time, and enter agenda." });
      return;
    }
    const scheduledTime = new Date(`${date}T${time}:00`);
    if (Number.isNaN(scheduledTime.getTime())) {
      setMessage({ type: "error", text: "Invalid date or time." });
      return;
    }
    setLoading(true);
    try {
      await api.post(`/leads/${params.id}/schedule-call`, {
        scheduledTime: scheduledTime.toISOString(),
        agenda: agenda.trim()
      });
      setMessage({ type: "success", text: "Call scheduled successfully." });
      setAgenda("");
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || err.message || "Failed to schedule call."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-2xl rounded-2xl bg-white/90 p-6 text-sm text-slate-700 shadow-sm dark:border dark:border-slate-800 dark:bg-slate-900/95 dark:text-slate-100 sm:p-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            Schedule call for lead #{params.id}
          </h1>
          <Link
            href={`/dashboard/leads/${params.id}`}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            Back to lead
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
          <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-orange-500 dark:focus:ring-orange-500/40"
            />
          </div>
          <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
              Time
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-orange-500 dark:focus:ring-orange-500/40"
            />
          </div>
        </div>
        <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
            Agenda / remarks
          </label>
          <textarea
            rows={4}
            value={agenda}
            onChange={(e) => setAgenda(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-orange-500 dark:focus:ring-orange-500/40"
            placeholder="What is this call about?"
          />
        </div>
        {message && (
          <p
            className={`rounded-lg px-3 py-2 text-xs ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                : "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300"
            }`}
          >
            {message.text}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
            className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-500 dark:hover:bg-emerald-400"
        >
          {loading ? "Scheduling..." : "Schedule call"}
        </button>
        </form>
      </div>
    </div>
  );
}

