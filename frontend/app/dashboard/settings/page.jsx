"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Shield, Bell, GitBranch, Plug } from "lucide-react";

const cards = [
  {
    title: "Profile & Security",
    description: "Manage name, email, password and login security for your account.",
    href: "/dashboard/settings/profile",
    icon: Shield
  },
  {
    title: "Notifications",
    description: "Control which events send in-app and email notifications.",
    href: "/dashboard/settings/notifications",
    icon: Bell
  },
  {
    title: "Pipelines & Stages",
    description: "Customize lead status stages and default values for your team.",
    href: "/dashboard/settings/pipelines",
    icon: GitBranch
  },
  {
    title: "Integrations",
    description: "Connect email, calendar and other tools to sync with IQLead.",
    href: "/dashboard/settings/integrations",
    icon: Plug
  }
];

export default function DashboardSettingsPage() {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 sm:text-3xl">
          Settings
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-300 sm:text-base">
          Configure your IQLead workspace, notifications and preferences.
        </p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        {cards.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                href={item.href}
                className="block rounded-2xl bg-white p-6 text-left shadow-sm ring-1 ring-slate-200/60 transition hover:ring-orange-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-orange-400 dark:bg-slate-900/85 dark:ring-slate-800 dark:hover:ring-orange-400 dark:hover:shadow-[0_18px_40px_rgba(15,23,42,0.7)]"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-semibold uppercase tracking-wide text-slate-800 dark:text-slate-100">
                      {item.title}
                    </h2>
                    <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-300">
                      {item.description}
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </>
  );
}
