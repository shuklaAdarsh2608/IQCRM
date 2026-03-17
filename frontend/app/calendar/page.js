"use client";

import { DashboardShell } from "../../components/layout/DashboardShell";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import api from "../../services/api";

export default function CalendarPage() {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);

  const now = useMemo(() => new Date(), []);
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const padStart = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  const days = useMemo(() => {
    const arr = [];
    for (let i = 1; i <= daysInMonth; i += 1) {
      arr.push(i);
    }
    return arr;
  }, [daysInMonth]);

  useEffect(() => {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 1);
    api
      .get("/leads/scheduled-calls", {
        params: { from: start.toISOString(), to: end.toISOString() }
      })
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          setCalls(res.data.data);
        }
      })
      .catch(() => setCalls([]))
      .finally(() => setLoading(false));
  }, [year, month]);

  const eventsByDay = useMemo(() => {
    const map = {};
    calls.forEach((c) => {
      const d = new Date(c.scheduledTime);
      if (d.getMonth() === month && d.getFullYear() === year) {
        const day = d.getDate();
        if (!map[day]) map[day] = [];
        const lead = c.lead;
        const title = lead
          ? `${c.agenda || "Call"} – Lead #${lead.id} ${lead.firstName || ""} ${lead.lastName || ""}`.trim()
          : c.agenda || "Scheduled call";
        map[day].push({
          id: c.id,
          time: d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
          title,
          leadId: c.lead?.id
        });
      }
    });
    return map;
  }, [calls, month, year]);

  const upcomingEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return calls
      .filter((c) => new Date(c.scheduledTime) >= today)
      .slice(0, 10)
      .map((c) => {
        const d = new Date(c.scheduledTime);
        const lead = c.lead;
        const title = lead
          ? `${c.agenda || "Call"} – Lead #${lead.id} ${lead.firstName || ""} ${lead.lastName || ""}`.trim()
          : c.agenda || "Scheduled call";
        return {
          id: c.id,
          day: d.getDate(),
          time: d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
          title,
          leadId: c.lead?.id
        };
      });
  }, [calls]);

  return (
    <DashboardShell
      title="Calendar"
      subtitle="Schedule and view all CRM-related events."
    >
      <div className="grid grid-cols-1 gap-3 min-w-0 sm:gap-4 md:grid-cols-[2fr,1.4fr]">
        <div className="min-w-0 rounded-2xl bg-white/80 p-3 text-xs text-slate-700 shadow-sm sm:p-4 dark:bg-slate-900/85 dark:text-slate-100 dark:border dark:border-slate-800">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
              This month
            </p>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-200">
              {now.toLocaleString("default", { month: "long", year: "numeric" })}
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-[10px] text-slate-500 dark:text-slate-300">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} className="px-1 py-1 text-center">
                {d}
              </div>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-0.5 text-[10px] sm:gap-1 sm:text-[11px]">
            {padStart > 0 &&
              Array.from({ length: padStart }).map((_, i) => (
                <div key={`pad-${i}`} className="min-h-[52px] rounded-lg border border-slate-100/50 bg-slate-50/30 dark:border-slate-800/50 dark:bg-slate-900/30" />
              ))}
            {days.map((d) => {
              const todaysEvents = eventsByDay[d] || [];
              const highlight = todaysEvents.length > 0;
              return (
                <div
                  key={d}
                  className={`min-h-[52px] rounded-lg border border-slate-100 bg-slate-50/60 px-1.5 py-1 dark:border-slate-800 dark:bg-slate-900/70 ${
                    highlight ? "border-orange-300 bg-orange-50 dark:border-orange-400 dark:bg-orange-500/10" : ""
                  }`}
                >
                  <div className="mb-1 text-[10px] font-medium text-slate-500 dark:text-slate-300">
                    {d}
                  </div>
                  {todaysEvents.map((e) => (
                    <Link
                      key={e.id}
                      href={e.leadId ? `/dashboard/leads/${e.leadId}` : "/dashboard/leads"}
                      className="mb-0.5 block rounded-full bg-orange-500/10 px-1.5 py-0.5 text-[9px] text-orange-700 hover:bg-orange-500/20 dark:bg-orange-500/20 dark:text-orange-300 dark:hover:bg-orange-500/30"
                    >
                      {e.time}
                    </Link>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col rounded-2xl bg-white/80 p-4 text-xs text-slate-700 shadow-sm dark:bg-slate-900/85 dark:text-slate-100 dark:border dark:border-slate-800">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
            Upcoming events
          </p>
          {loading ? (
            <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
              Loading…
            </div>
          ) : upcomingEvents.length === 0 ? (
            <p className="py-4 text-center text-xs text-slate-500 dark:text-slate-400">
              No scheduled calls yet.
            </p>
          ) : (
            <div className="space-y-2">
              {upcomingEvents.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900"
                >
                  <div>
                    <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-50">
                      {e.title}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-300">
                      Day {e.day} • {e.time}
                    </p>
                  </div>
                  {e.leadId && (
                    <Link
                      href={`/dashboard/leads/${e.leadId}`}
                      className="rounded-full bg-orange-500 px-2.5 py-1 text-[10px] font-medium text-white hover:bg-orange-600"
                    >
                      View lead
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}

