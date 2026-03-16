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
    <div className="rounded-2xl bg-white/80 p-6 text-sm text-slate-700 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">
          Schedule call for lead #{params.id}
        </h1>
        <Link
          href={`/dashboard/leads/${params.id}`}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
        >
          Back to lead
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Time
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Agenda / remarks
          </label>
          <textarea
            rows={4}
            value={agenda}
            onChange={(e) => setAgenda(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400"
            placeholder="What is this call about?"
          />
        </div>
        {message && (
          <p
            className={`rounded-lg px-3 py-2 text-xs ${
              message.type === "success"
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-600"
            }`}
          >
            {message.text}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
        >
          {loading ? "Scheduling..." : "Schedule call"}
        </button>
      </form>
    </div>
  );
}

