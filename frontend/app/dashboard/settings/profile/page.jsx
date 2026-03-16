"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import api from "../../../../services/api";

export default function SettingsProfilePage() {
  const [profile, setProfile] = useState({ name: "", email: "" });
  const [loading, setLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: "", text: "" });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    api
      .get("/users/me")
      .then((res) => {
        if (res.data?.success && res.data?.data) {
          const d = res.data.data;
          setProfile({ name: d.name || "", email: d.email || "" });
        }
      })
      .catch(() => setProfile({ name: "", email: "" }))
      .finally(() => setLoading(false));
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMessage({ type: "", text: "" });
    setProfileSaving(true);
    try {
      const res = await api.patch("/users/me", { name: profile.name, email: profile.email });
      if (res.data?.success && res.data?.data) {
        setProfileMessage({ type: "success", text: "Profile updated successfully." });
        const stored = typeof window !== "undefined" ? window.localStorage.getItem("iqlead_user") : null;
        if (stored) {
          try {
            const user = JSON.parse(stored);
            user.name = res.data.data.name;
            user.email = res.data.data.email;
            window.localStorage.setItem("iqlead_user", JSON.stringify(user));
          } catch {}
        }
      }
    } catch (err) {
      setProfileMessage({
        type: "error",
        text: err?.response?.data?.message || err?.response?.data?.errors?.[0]?.msg || "Failed to update profile."
      });
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMessage({ type: "", text: "" });
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({ type: "error", text: "New password and confirm password do not match." });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordMessage({ type: "error", text: "New password must be at least 6 characters." });
      return;
    }
    setPasswordSaving(true);
    try {
      await api.post("/users/me/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setPasswordMessage({ type: "success", text: "Password updated successfully." });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setPasswordMessage({
        type: "error",
        text: err?.response?.data?.message || "Failed to change password."
      });
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-400 border-t-transparent" />
      </div>
    );
  }

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
          Profile & Security
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
          Manage your account name, email and password.
        </p>
      </div>

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/60 dark:bg-slate-900/85 dark:ring-slate-800">
        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-50">Profile</h2>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-300">
          Update your display name and email.
        </p>
        <form onSubmit={handleProfileSubmit} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="profile-name"
              className="block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Name
            </label>
            <input
              id="profile-name"
              type="text"
              value={profile.name}
              onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200/50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              required
            />
          </div>
          <div>
            <label
              htmlFor="profile-email"
              className="block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Email
            </label>
            <input
              id="profile-email"
              type="email"
              value={profile.email}
              onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200/50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              required
            />
          </div>
          {profileMessage.text && (
            <p className={`text-sm ${profileMessage.type === "success" ? "text-emerald-600" : "text-red-600"}`}>
              {profileMessage.text}
            </p>
          )}
          <button
            type="submit"
            disabled={profileSaving}
            className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
          >
            {profileSaving ? "Saving…" : "Save profile"}
          </button>
        </form>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/60 dark:bg-slate-900/85 dark:ring-slate-800">
        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-50">
          Change password
        </h2>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-300">
          Set a new password for your account.
        </p>
        <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="current-password"
              className="block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Current password
            </label>
            <input
              id="current-password"
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200/50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              required
            />
          </div>
          <div>
            <label
              htmlFor="new-password"
              className="block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              New password
            </label>
            <input
              id="new-password"
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200/50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              required
              minLength={6}
            />
          </div>
          <div>
            <label
              htmlFor="confirm-password"
              className="block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Confirm new password
            </label>
            <input
              id="confirm-password"
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200/50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              required
              minLength={6}
            />
          </div>
          {passwordMessage.text && (
            <p className={`text-sm ${passwordMessage.type === "success" ? "text-emerald-600" : "text-red-600"}`}>
              {passwordMessage.text}
            </p>
          )}
          <button
            type="submit"
            disabled={passwordSaving}
            className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
          >
            {passwordSaving ? "Updating…" : "Update password"}
          </button>
        </form>
      </section>
    </div>
  );
}
