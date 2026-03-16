"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const LEAD_STAGES = [
  { id: "NEW", label: "New", description: "Lead just entered the pipeline" },
  { id: "CONTACTED", label: "Contacted", description: "Initial contact made" },
  { id: "QUALIFIED", label: "Qualified", description: "Lead qualified for follow-up" },
  { id: "PROPOSAL", label: "Proposal", description: "Proposal sent" },
  { id: "NEGOTIATION", label: "Negotiation", description: "In negotiation" },
  { id: "WON", label: "Won", description: "Deal closed successfully" },
  { id: "LOST", label: "Lost", description: "Deal lost" },
  { id: "RESCHEDULED", label: "Rescheduled", description: "Call or meeting rescheduled" },
  { id: "JUNK", label: "Junk", description: "Invalid or spam lead" }
];

export default function SettingsPipelinesPage() {
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
          Pipelines & Stages
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
          Lead status stages used across IQLead. These define the default pipeline for your team.
        </p>
      </div>

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/60 dark:bg-slate-900/85 dark:ring-slate-800">
        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-50">
          Default lead stages
        </h2>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-300">
          When updating a lead’s status on the lead detail page, these are the available stages.
        </p>
        <ul className="mt-4 space-y-2">
          {LEAD_STAGES.map((stage, index) => (
            <li
              key={stage.id}
              className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/70"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-xs font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-100">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <span className="font-medium text-slate-800 dark:text-slate-100">
                  {stage.label}
                </span>
                <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                  ({stage.id})
                </span>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-300">
                  {stage.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
          Custom stages can be added in a future update. For now, all leads use this default pipeline.
        </p>
      </section>
    </div>
  );
}
