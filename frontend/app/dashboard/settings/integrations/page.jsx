"use client";

import Link from "next/link";
import { ArrowLeft, Mail, Calendar, MessageCircle } from "lucide-react";

const integrations = [
  {
    id: "email",
    name: "Email",
    description: "Connect your email to sync conversations and send notifications from IQLead.",
    icon: Mail,
    available: false
  },
  {
    id: "calendar",
    name: "Calendar",
    description: "Sync scheduled calls with Google Calendar or Outlook.",
    icon: Calendar,
    available: false
  },
  {
    id: "team-chat",
    name: "Team chat",
    description: "Internal team chat is built-in. No external integration required.",
    icon: MessageCircle,
    available: true
  }
];

export default function SettingsIntegrationsPage() {
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
          Integrations
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
          Connect email, calendar and other tools to sync with IQLead.
        </p>
      </div>

      <section className="space-y-4">
        {integrations.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/60 dark:bg-slate-900/85 dark:ring-slate-800"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-100">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-slate-800 dark:text-slate-50">
                      {item.name}
                    </h2>
                    {item.available ? (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                        Active
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                        Coming soon
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-300">
                    {item.description}
                  </p>
                  {!item.available && (
                    <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                      This integration will be available in a future update.
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
