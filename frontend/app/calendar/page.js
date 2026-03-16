"use client";

import { DashboardShell } from "../../components/layout/DashboardShell";
import { useMemo } from "react";

export default function CalendarPage() {
  const days = useMemo(() => {
    const arr = [];
    for (let i = 1; i <= 30; i += 1) {
      arr.push(i);
    }
    return arr;
  }, []);

  const events = [
    { day: 3, time: "11:00", title: "Demo call – Hotel Sunrise" },
    { day: 7, time: "16:30", title: "Follow-up – Lead #245" },
    { day: 14, time: "10:00", title: "Team review" },
    { day: 22, time: "15:00", title: "Closing call – Enterprise deal" }
  ];

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
              March 2026
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
            {days.map((d) => {
              const todaysEvents = events.filter((e) => e.day === d);
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
                    <div
                      key={e.title}
                      className="mb-0.5 rounded-full bg-orange-500/10 px-1.5 py-0.5 text-[9px] text-orange-700 dark:bg-orange-500/20 dark:text-orange-300"
                    >
                      {e.time}
                    </div>
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
          <div className="space-y-2">
            {events.map((e) => (
              <div
                key={e.title}
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
                <button className="rounded-full bg-orange-500 px-2.5 py-1 text-[10px] font-medium text-white hover:bg-orange-600">
                  View lead
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

