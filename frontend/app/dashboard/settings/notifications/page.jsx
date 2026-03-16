"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const STORAGE_KEY = "iqlead_notification_prefs";

const defaultPrefs = {
  inAppLeadAssigned: true,
  inAppCallScheduled: true,
  inAppLeadDeleteRequest: true,
  emailLeadAssigned: true,
  emailCallScheduled: true,
  emailCallReminder: true
};

const toggles = [
  { key: "inAppLeadAssigned", label: "Lead assigned to you", inApp: true },
  { key: "inAppCallScheduled", label: "Call scheduled (you are notified)", inApp: true },
  { key: "inAppLeadDeleteRequest", label: "Lead delete request (Admin → Super Admin)", inApp: true },
  { key: "emailLeadAssigned", label: "Email when a lead is assigned to you", inApp: false },
  { key: "emailCallScheduled", label: "Email when a call is scheduled", inApp: false },
  { key: "emailCallReminder", label: "Email reminder 5 minutes before scheduled call", inApp: false }
];

function loadPrefs() {
  if (typeof window === "undefined") return defaultPrefs;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...defaultPrefs, ...parsed };
    }
  } catch {}
  return defaultPrefs;
}

function savePrefs(prefs) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {}
}

export default function SettingsNotificationsPage() {
  const [prefs, setPrefs] = useState(defaultPrefs);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setPrefs(loadPrefs());
  }, []);

  const handleToggle = (key) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      savePrefs(next);
      return next;
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <Link
          href="/dashboard/settings"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-orange-600 dark:text-slate-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Settings
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-slate-900 dark:text-slate-50">
          Notifications
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
          Control which events send in-app and email notifications.
        </p>
      </div>

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/60 dark:bg-slate-900/85 dark:ring-slate-800">
        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-50">
          In-app notifications
        </h2>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-300">
          Show notifications in the dashboard notification bell.
        </p>
        <ul className="mt-4 space-y-3">
          {toggles.filter((t) => t.inApp).map((t) => (
            <li
              key={t.key}
              className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/70"
            >
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {t.label}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={prefs[t.key]}
                onClick={() => handleToggle(t.key)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 ${
                  prefs[t.key] ? "bg-orange-500" : "bg-slate-200 dark:bg-slate-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
                    prefs[t.key] ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/60 dark:bg-slate-900/85 dark:ring-slate-800">
        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-50">
          Email notifications
        </h2>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-300">
          Receive email for the following events.
        </p>
        <ul className="mt-4 space-y-3">
          {toggles.filter((t) => !t.inApp).map((t) => (
            <li
              key={t.key}
              className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/70"
            >
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {t.label}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={prefs[t.key]}
                onClick={() => handleToggle(t.key)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 ${
                  prefs[t.key] ? "bg-orange-500" : "bg-slate-200 dark:bg-slate-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
                    prefs[t.key] ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </li>
          ))}
        </ul>
      </section>

      {saved && (
        <p className="text-sm text-emerald-600 dark:text-emerald-300">Preferences saved.</p>
      )}
    </div>
  );
}
