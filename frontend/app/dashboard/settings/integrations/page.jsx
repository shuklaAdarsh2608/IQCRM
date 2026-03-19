"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Mail, Calendar, MessageCircle } from "lucide-react";
import api from "../../../../services/api";

const integrations = [
  {
    id: "email",
    name: "Email",
    description: "Connect your email to sync conversations and send notifications from IQLead.",
    icon: Mail,
    available: true
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
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // Prefill SMTP username with current user's email
    const loadMe = async () => {
      try {
        const res = await api.get("/users/me");
        const data = res?.data?.data;
        if (data?.email && !smtpUser) {
          setSmtpUser(data.email);
        }
      } catch {
        // ignore
      }
    };
    loadMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveSmtp = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setSaving(true);
    try {
      await api.post("/users/me/smtp", {
        smtpUser: smtpUser || undefined,
        smtpPassword
      });
      setMessage("Email credentials saved. IQLead can now send mail using your account.");
      setSmtpPassword("");
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        "Unable to save email credentials. Please check your SMTP password.";
      setError(msg);
    } finally {
      setSaving(false);
    }
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
          Integrations
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
          Connect email, calendar and other tools to sync with IQLead.
        </p>
      </div>

      <section className="space-y-4">
        {integrations.map((item) => {
          const Icon = item.icon;
          const isEmail = item.id === "email";

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
                        Available
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

                  {isEmail ? (
                    <form className="mt-4 space-y-3 text-sm" onSubmit={handleSaveSmtp}>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
                          SMTP username / From email
                        </label>
                        <input
                          type="email"
                          value={smtpUser}
                          onChange={(e) => setSmtpUser(e.target.value)}
                          placeholder="you@example.com"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-200 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-orange-500 dark:focus:ring-orange-500/30"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
                          SMTP password
                        </label>
                        <input
                          type="password"
                          value={smtpPassword}
                          onChange={(e) => setSmtpPassword(e.target.value)}
                          placeholder="App-specific password for your mailbox"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-200 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-orange-500 dark:focus:ring-orange-500/30"
                          required
                        />
                      </div>
                      {message && (
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                          {message}
                        </p>
                      )}
                      {error && (
                        <p className="text-[11px] text-red-500" role="alert">
                          {error}
                        </p>
                      )}
                      <button
                        type="submit"
                        disabled={saving || !smtpPassword}
                        className="mt-1 inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60 dark:bg-orange-500 dark:hover:bg-orange-600"
                      >
                        {saving ? "Saving..." : "Save email credentials"}
                      </button>
                      <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                        Your password is encrypted with a server-side key and is only used to send
                        email from IQLead.
                      </p>
                    </form>
                  ) : !item.available ? (
                    <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                      This integration will be available in a future update.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
