"use client";

import { useEffect, useState } from "react";
import { createUser, fetchUsers, resetUserPassword, forceLogoutUser, deleteUser, setUserSmtp } from "../../../services/userService";
import { Select } from "../../../components/ui/Select";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "USER",
    managerId: ""
  });
  const [error, setError] = useState("");
  const [resetUser, setResetUser] = useState(null);
  const [resetForm, setResetForm] = useState({
    newPassword: "",
    confirmPassword: ""
  });
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [forceLogoutId, setForceLogoutId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [smtpUser, setSmtpUser] = useState(null);
  const [smtpForm, setSmtpForm] = useState({ smtpUser: "", smtpPassword: "" });
  const [smtpError, setSmtpError] = useState("");
  const [smtpLoading, setSmtpLoading] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchUsers();
      const payload = res?.data;
      const list = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
        ? payload
        : [];
      setUsers(list);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("iqlead_user");
      const user = raw ? JSON.parse(raw) : null;
      setCurrentUserId(user?.id ?? null);
    } catch {
      setCurrentUserId(null);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await createUser(form);
      setForm({ name: "", email: "", password: "", role: "USER", managerId: "" });
      await loadUsers();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create user");
    }
  };

  const handleResetPassword = async (id) => {
    const user = users.find((u) => u.id === id);
    setResetUser(user || null);
    setResetForm({ newPassword: "", confirmPassword: "" });
    setResetError("");
  };

  const handleForceLogout = async (id) => {
    if (!window.confirm("Force logout this user? They will need to log in again.")) return;
    setForceLogoutId(id);
    try {
      await forceLogoutUser(id);
      await loadUsers();
    } catch (err) {
      // ignore or show toast
    } finally {
      setForceLogoutId(null);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user? This cannot be undone.")) {
      return;
    }
    setDeletingId(id);
    try {
      await deleteUser(id);
      await loadUsers();
    } catch (err) {
      // optional: surface error
      alert(err?.response?.data?.message || "Failed to delete user.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="mt-1 rounded-2xl bg-white/80 p-4 text-sm text-slate-700 shadow-sm dark:bg-slate-900/85 dark:text-slate-100">
        <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-50">Add User</h2>
        <form
          onSubmit={handleSubmit}
          className={`grid gap-3 sm:grid-cols-2 ${
            ["USER", "TEAM_LEADER"].includes(form.role)
              ? "md:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto]"
              : "md:grid-cols-[1fr_1fr_1fr_1fr_auto]"
          }`}
        >
          <div className="min-w-0 space-y-1">
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300">
              Full name
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="Full name"
              className="w-full rounded-xl border border-border bg-slate-50 px-3 py-2 text-xs outline-none dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
            />
          </div>
          <div className="min-w-0 space-y-1">
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300">
              Email
            </label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="Email"
              className="w-full rounded-xl border border-border bg-slate-50 px-3 py-2 text-xs outline-none dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
            />
          </div>
          <div className="min-w-0 space-y-1">
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300">
              Temp password
            </label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              placeholder="Temp password"
              className="w-full rounded-xl border border-border bg-slate-50 px-3 py-2 text-xs outline-none dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
            />
          </div>
          <div className="min-w-0 space-y-1">
            <Select
              label="Role"
              options={[
                { value: "USER", label: "Relationship Manager" },
                { value: "TEAM_LEADER", label: "Team Leader" },
                { value: "MANAGER", label: "Manager" },
                { value: "ADMIN", label: "Admin" },
                { value: "SUPER_ADMIN", label: "Super Admin" }
              ]}
              value={form.role}
              onChange={(v) =>
                setForm((prev) => ({
                  ...prev,
                  role: String(v),
                  managerId:
                    v === "USER" || v === "TEAM_LEADER" ? prev.managerId : ""
                }))
              }
              placeholder="Select role"
            />
          </div>
          {["USER", "TEAM_LEADER"].includes(form.role) && (
            <div className="min-w-0 space-y-1">
              <Select
                label="Manager"
                options={users
                  .filter((u) => u.role === "MANAGER")
                  .map((u) => ({
                    value: u.id,
                    label: `${u.name} (${u.email})`
                  }))}
                value={form.managerId}
                onChange={(v) =>
                  setForm((prev) => ({ ...prev, managerId: String(v) }))
                }
                placeholder="Select manager"
              />
            </div>
          )}
          <div className="flex min-w-0 items-end">
            <button
              type="submit"
              className="h-9 rounded-full bg-orange-500 px-6 text-xs font-medium text-white shadow-sm hover:bg-orange-600 dark:bg-orange-500 dark:hover:bg-orange-400"
            >
              Add
            </button>
          </div>
        </form>
        {error && <p className="mt-2 text-xs text-red-500 dark:text-red-400">{error}</p>}
      </div>

      {resetUser && (
        <div className="rounded-2xl bg-white/80 p-4 text-sm text-slate-700 shadow-sm dark:bg-slate-900/85 dark:text-slate-100">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Reset password
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {resetUser.name} ({resetUser.email})
              </p>
            </div>
            <button
              type="button"
              className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              onClick={() => {
                setResetUser(null);
                setResetForm({ newPassword: "", confirmPassword: "" });
                setResetError("");
              }}
            >
              Close
            </button>
          </div>
          <form
            className="grid gap-3 md:grid-cols-[repeat(2,minmax(0,1fr))_auto]"
            onSubmit={async (e) => {
              e.preventDefault();
              setResetError("");
              if (!resetForm.newPassword || resetForm.newPassword.length < 6) {
                setResetError("Password must be at least 6 characters long.");
                return;
              }
              if (resetForm.newPassword !== resetForm.confirmPassword) {
                setResetError("Passwords do not match.");
                return;
              }
              setResetLoading(true);
              try {
                await resetUserPassword(resetUser.id, resetForm.newPassword);
                setResetError("");
                setResetUser(null);
                setResetForm({ newPassword: "", confirmPassword: "" });
              } catch (err) {
                setResetError(
                  err?.response?.data?.message ||
                    "Failed to reset password. Try again."
                );
              } finally {
                setResetLoading(false);
              }
            }}
          >
            <input
              type="password"
              placeholder="New password"
              value={resetForm.newPassword}
              onChange={(e) =>
                setResetForm((prev) => ({
                  ...prev,
                  newPassword: e.target.value
                }))
              }
              className="rounded-xl border border-border bg-slate-50 px-3 py-2 text-xs outline-none dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
            />
            <input
              type="password"
              placeholder="Confirm password"
              value={resetForm.confirmPassword}
              onChange={(e) =>
                setResetForm((prev) => ({
                  ...prev,
                  confirmPassword: e.target.value
                }))
              }
              className="rounded-xl border border-border bg-slate-50 px-3 py-2 text-xs outline-none dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
            />
            <button
              type="submit"
              disabled={resetLoading}
              className="rounded-xl bg-orange-500 px-4 py-2 text-xs font-medium text-white shadow-sm disabled:opacity-50 dark:bg-orange-500 dark:hover:bg-orange-400"
            >
              {resetLoading ? "Saving..." : "Update password"}
            </button>
          </form>
          {resetError && (
            <p className="mt-2 text-xs text-red-500 dark:text-red-400">{resetError}</p>
          )}
        </div>
      )}

      <div className="rounded-2xl bg-white/80 p-4 text-sm text-slate-700 shadow-sm dark:bg-slate-900/85 dark:text-slate-100">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Users</h2>
          {loading && <span className="text-xs text-slate-500 dark:text-slate-400">Loading…</span>}
        </div>
        <div className="overflow-x-auto text-xs">
          <table className="min-w-full border-separate border-spacing-y-2">
            <thead className="text-[11px] text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-2 text-left">Name</th>
                <th className="px-2 text-left">Email</th>
                <th className="px-2 text-left">Role</th>
                <th className="px-2 text-left">Status</th>
                <th className="px-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="rounded-xl bg-slate-50 dark:bg-slate-900/70">
                  <td className="px-2 py-2 align-middle text-[13px] font-medium text-slate-900 dark:text-slate-50">
                    {u.name}
                  </td>
                  <td className="px-2 py-2 align-middle text-[12px] text-slate-600 dark:text-slate-300">
                    {u.email}
                  </td>
                  <td className="px-2 py-2 align-middle text-[12px] text-slate-600 dark:text-slate-300">
                    {u.role}
                  </td>
                  <td className="px-2 py-2 align-middle text-[12px] text-slate-600 dark:text-slate-300">
                    {u.isActive ? "Active" : "Disabled"}
                  </td>
                  <td className="px-2 py-2 align-middle text-[12px] text-slate-600">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleResetPassword(u.id)}
                        className="rounded-full bg-orange-100 px-3 py-1 text-[11px] font-medium text-orange-700 hover:bg-orange-200 dark:bg-orange-500/20 dark:text-orange-300 dark:hover:bg-orange-400/30"
                      >
                        Reset password
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSmtpUser(u);
                          setSmtpForm({ smtpUser: u.smtpUser || u.email || "", smtpPassword: "" });
                          setSmtpError("");
                        }}
                        className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-200 dark:hover:bg-emerald-500/25"
                      >
                        SMTP
                      </button>
                      {currentUserId !== u.id && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleForceLogout(u.id)}
                            disabled={forceLogoutId === u.id}
                            className="rounded-full bg-slate-200 px-3 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500 disabled:opacity-50"
                          >
                            {forceLogoutId === u.id ? "Logging out…" : "Force logout"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u.id)}
                            disabled={deletingId === u.id}
                            className="rounded-full bg-red-100 px-3 py-1 text-[11px] font-medium text-red-700 hover:bg-red-200 dark:bg-red-500/20 dark:text-red-300 dark:hover:bg-red-400/30 disabled:opacity-50"
                          >
                            {deletingId === u.id ? "Deleting…" : "Delete"}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-2 py-4 text-center text-[12px] text-slate-500 dark:text-slate-400"
                  >
                    No users yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {smtpUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSmtpUser(null);
              setSmtpForm({ smtpUser: "", smtpPassword: "" });
              setSmtpError("");
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="smtp-modal-title"
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900 dark:text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 id="smtp-modal-title" className="text-base font-semibold text-slate-900 dark:text-slate-50">
                  SMTP credentials
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {smtpUser.name} ({smtpUser.email})
                </p>
              </div>
              <button
                type="button"
                className="shrink-0 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                onClick={() => {
                  setSmtpUser(null);
                  setSmtpForm({ smtpUser: "", smtpPassword: "" });
                  setSmtpError("");
                }}
                aria-label="Close"
              >
                Close
              </button>
            </div>
            <form
              className="space-y-3"
              onSubmit={async (e) => {
                e.preventDefault();
                setSmtpError("");
                if (!smtpForm.smtpPassword || smtpForm.smtpPassword.length < 4) {
                  setSmtpError("SMTP password is required.");
                  return;
                }
                setSmtpLoading(true);
                try {
                  await setUserSmtp(smtpUser.id, smtpForm);
                  setSmtpUser(null);
                  setSmtpForm({ smtpUser: "", smtpPassword: "" });
                  setSmtpError("");
                  await loadUsers();
                } catch (err) {
                  setSmtpError(err?.response?.data?.message || "Failed to save SMTP credentials.");
                } finally {
                  setSmtpLoading(false);
                }
              }}
            >
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-600 dark:text-slate-300">
                  SMTP user (email)
                </label>
                <input
                  type="email"
                  placeholder="SMTP user (email)"
                  value={smtpForm.smtpUser}
                  onChange={(e) => setSmtpForm((p) => ({ ...p, smtpUser: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-orange-500 dark:focus:ring-orange-500/30"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-600 dark:text-slate-300">
                  Mailbox password / app password
                </label>
                <input
                  type="password"
                  placeholder="Mailbox password / app password"
                  value={smtpForm.smtpPassword}
                  onChange={(e) => setSmtpForm((p) => ({ ...p, smtpPassword: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-orange-500 dark:focus:ring-orange-500/30"
                />
              </div>
              {smtpError && (
                <p className="text-xs text-red-500 dark:text-red-400" role="alert">
                  {smtpError}
                </p>
              )}
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Use each user&apos;s Hostinger mailbox password (or app password). This is required for sending as that user.
              </p>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  onClick={() => {
                    setSmtpUser(null);
                    setSmtpForm({ smtpUser: "", smtpPassword: "" });
                    setSmtpError("");
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={smtpLoading}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-medium text-white shadow-sm disabled:opacity-50 dark:bg-emerald-500 dark:hover:bg-emerald-500/90"
                >
                  {smtpLoading ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

