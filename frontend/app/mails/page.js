"use client";

import { DashboardShell } from "../../components/layout/DashboardShell";
import { useEffect, useState } from "react";

export default function MailsPage() {
  const [selectedId, setSelectedId] = useState(1);
  const [composeOpen, setComposeOpen] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [composeForm, setComposeForm] = useState({
    to: "",
    subject: "",
    body: ""
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("iqlead_user");
      const user = raw ? JSON.parse(raw) : null;
      setUserEmail(user?.email || "");
    } catch {
      setUserEmail("");
    }
  }, []);

  const mails = [
    {
      id: 1,
      subject: "Welcome to IQLead",
      from: "support@iqlead.app",
      preview: "Thanks for signing up. Here is how to get started...",
      date: "Today",
      tag: "System"
    },
    {
      id: 2,
      subject: "New lead assigned",
      from: "alerts@iqlead.app",
      preview: "A new lead has been assigned to you. Open the CRM to review.",
      date: "Today",
      tag: "Lead"
    },
    {
      id: 3,
      subject: "Follow-up reminder",
      from: "reminders@iqlead.app",
      preview: "You planned a follow-up call with John for tomorrow.",
      date: "Yesterday",
      tag: "Reminder"
    }
  ];

  const selected = mails.find((m) => m.id === selectedId) || mails[0];

  const handleComposeSend = () => {
    if (!composeForm.to?.trim()) return;
    const subject = encodeURIComponent(composeForm.subject || "");
    const body = encodeURIComponent(composeForm.body || "");
    const mailto = `mailto:${composeForm.to.trim()}?subject=${subject}&body=${body}`;
    window.location.href = mailto;
    setComposeOpen(false);
    setComposeForm({ to: "", subject: "", body: "" });
  };

  return (
    <DashboardShell
      title="Mails"
      subtitle="Email inbox and outbound campaigns connected to leads."
    >
      <div className="grid grid-cols-1 gap-3 min-w-0 sm:gap-4 md:grid-cols-[1.4fr,2fr]">
        <div className="rounded-2xl bg-white/80 p-3 text-xs text-slate-700 shadow-sm dark:bg-slate-900/85 dark:text-slate-100 dark:border dark:border-slate-800">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
              Inbox
            </p>
            <button
              type="button"
              onClick={() => setComposeOpen(true)}
              className="rounded-full bg-orange-500 px-3 py-1 text-[11px] font-medium text-white hover:bg-orange-600"
            >
              Compose
            </button>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {mails.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedId(m.id)}
                className={`flex w-full items-start gap-2 px-2 py-2 text-left hover:bg-orange-50 dark:hover:bg-orange-500/10 ${
                  selectedId === m.id ? "bg-orange-50 dark:bg-orange-500/15" : ""
                }`}
              >
                <div className="mt-1 h-2 w-2 rounded-full bg-orange-400" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-100">
                      {m.subject}
                    </p>
                    <span className="text-[10px] text-slate-400 dark:text-slate-400">{m.date}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-300">{m.preview}</p>
                  <span className="mt-1 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[9px] text-slate-500 dark:bg-slate-800 dark:text-slate-200">
                    {m.tag}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col rounded-2xl bg-white/80 p-4 text-sm text-slate-700 shadow-sm dark:bg-slate-900/85 dark:text-slate-100 dark:border dark:border-slate-800">
          <div className="mb-3 border-b border-slate-100 pb-2 dark:border-slate-800">
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-50">
              {selected.subject}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-300">
              From {selected.from} • {selected.date}
            </p>
          </div>
          <div className="flex-1 text-xs text-slate-700 dark:text-slate-200">
            <p className="mb-2">
              Hi there,
            </p>
            <p className="mb-2">
              {selected.preview} This is a static preview. Later, this area will be wired
              to real email threads connected with your leads.
            </p>
            <p className="mb-2">
              You can reply, forward, or log this email activity against a lead record.
            </p>
            <p>Regards,</p>
            <p className="text-slate-500">IQLead Team</p>
          </div>
        </div>
      </div>

      {/* Compose modal */}
      {composeOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
          onClick={() => setComposeOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="compose-title"
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 id="compose-title" className="text-base font-semibold text-slate-900 dark:text-slate-50">
                Compose email
              </h2>
              <button
                type="button"
                onClick={() => setComposeOpen(false)}
                className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
                  From
                </label>
                <input
                  type="email"
                  value={userEmail}
                  readOnly
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
                  To
                </label>
                <input
                  type="email"
                  value={composeForm.to}
                  onChange={(e) => setComposeForm((p) => ({ ...p, to: e.target.value }))}
                  placeholder="recipient@example.com"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200/50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
                  Subject
                </label>
                <input
                  type="text"
                  value={composeForm.subject}
                  onChange={(e) => setComposeForm((p) => ({ ...p, subject: e.target.value }))}
                  placeholder="Email subject"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200/50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
                  Message
                </label>
                <textarea
                  value={composeForm.body}
                  onChange={(e) => setComposeForm((p) => ({ ...p, body: e.target.value }))}
                  placeholder="Type your message..."
                  rows={5}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200/50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setComposeOpen(false)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleComposeSend}
                disabled={!composeForm.to?.trim()}
                className="rounded-xl bg-orange-500 px-4 py-2 text-xs font-medium text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

