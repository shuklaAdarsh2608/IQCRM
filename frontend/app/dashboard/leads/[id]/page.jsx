"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import api from "../../../../services/api";
import { Select } from "../../../../components/ui/Select";
import { CelebrationOverlay } from "../../../../components/ui/CelebrationOverlay";

const STATUS_OPTIONS = [
  "FRESH",
  "ACTIVE",
  "SCHEDULED",
  "NO REPLY",
  "SWITCHED OFF",
  "WON",
  "LOST",
  "DEFERRED",
  "WRONG NUMBER",
  "QUALIFIED"
];

const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN"];
const RATING_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "TEAM_LEADER"];

export default function LeadDetailPage({ params }) {
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [status, setStatus] = useState("");
  const [remarks, setRemarks] = useState([]);
  const [remarkText, setRemarkText] = useState("");
  const [savingRemark, setSavingRemark] = useState(false);
  const [paymentType, setPaymentType] = useState("FULL");
  const [dealAmount, setDealAmount] = useState("");
  const [userRole, setUserRole] = useState(null);
  const [savingRating, setSavingRating] = useState(false);
  const [auditLog, setAuditLog] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("iqlead_user");
      if (raw) {
        const u = JSON.parse(raw);
        setUserRole(u.role);
      }
    } catch {
      // ignore
    }
  }, []);

  const loadLead = () => {
    setLoading(true);
    api
      .get(`/leads/${params.id}`)
      .then((res) => {
        if (res.data?.success && res.data?.data) {
          setLead(res.data.data);
          setStatus(res.data.data.status);
          setDealAmount(
            res.data.data.valueAmount
              ? String(Number(res.data.data.valueAmount))
              : ""
          );
        }
      })
      .finally(() => setLoading(false));
  };

  const loadRemarks = () => {
    api
      .get(`/leads/${params.id}/remarks`)
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          setRemarks(res.data.data);
        }
      })
      .catch(() => setRemarks([]));
  };

  const loadAuditLog = () => {
    if (!params?.id || !ADMIN_ROLES.includes(userRole)) return;
    setAuditLoading(true);
    api
      .get(`/leads/${params.id}/audit`)
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          setAuditLog(res.data.data);
        }
      })
      .catch(() => setAuditLog([]))
      .finally(() => setAuditLoading(false));
  };

  useEffect(() => {
    loadLead();
    loadRemarks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  useEffect(() => {
    if (lead && userRole && ADMIN_ROLES.includes(userRole)) {
      loadAuditLog();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead?.id, userRole]);

  const handleStatusSave = () => {
    if (!status || !lead) return;
    setSavingStatus(true);
    const payload = { status };
    if (status === "WON") {
      payload.valueAmount = Number(dealAmount || 0);
      payload.valueCurrency = "INR";
    }
    api
      .put(`/leads/${params.id}`, payload)
      .then((res) => {
        if (res.data?.success && res.data?.data) {
          setLead(res.data.data);
          if (userRole && ADMIN_ROLES.includes(userRole)) loadAuditLog();
          if (status === "WON") {
            setShowCelebration(true);
          }
        }
      })
      .finally(() => setSavingStatus(false));
  };

  const handleRatingChange = (value) => {
    const leadId = lead?.id ?? params?.id;
    if (!leadId || !lead || savingRating) return;
    setSavingRating(true);
    api
      .put(`/leads/${leadId}`, { rating: value })
      .then((res) => {
        if (res.data?.success && res.data?.data) {
          setLead(res.data.data);
          if (userRole && ADMIN_ROLES.includes(userRole)) loadAuditLog();
        }
      })
      .catch(() => setSavingRating(false))
      .finally(() => setSavingRating(false));
  };

  const handleAddRemark = (e) => {
    e.preventDefault();
    if (!remarkText.trim()) return;
    setSavingRemark(true);
    api
      .post(`/leads/${params.id}/remarks`, { remark: remarkText.trim() })
      .then(() => {
        setRemarkText("");
        loadRemarks();
        if (userRole && ADMIN_ROLES.includes(userRole)) loadAuditLog();
      })
      .finally(() => setSavingRemark(false));
  };

  if (loading && !lead) {
    return (
      <div className="rounded-2xl bg-white/80 p-4 text-sm text-slate-500 shadow-sm dark:bg-slate-900/85 dark:text-slate-400">
        Loading lead...
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="rounded-2xl bg-white/80 p-4 text-sm text-red-600 shadow-sm dark:bg-slate-900/85 dark:text-red-400">
        Lead not found.
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-4">
      <CelebrationOverlay
        isOpen={showCelebration}
        title="Congratulations!"
        message={`Deal won! ${lead.valueAmount ? `₹ ${Number(lead.valueAmount).toLocaleString("en-IN")} closed.` : "This lead is now marked as won."}`}
        buttonText="Continue"
        onClose={() => setShowCelebration(false)}
        autoCloseDelay={6000}
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h1 className="truncate text-base font-semibold text-slate-900 dark:text-slate-50">
            {lead.firstName} {lead.lastName}{" "}
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">#{lead.id}</span>
          </h1>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
            {lead.company || "No company"} • {lead.email || lead.phone || "No contact"}
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
            <span>
              Owner:{" "}
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {lead.owner?.name || "—"}
              </span>
            </span>
            <span>
              Status:{" "}
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {lead.status}
              </span>
            </span>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link
            href={`/dashboard/leads/${lead.id}/schedule-call`}
            className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-600"
          >
            Schedule call
          </Link>
          <Link
            href="/dashboard/leads"
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Back to Leads
          </Link>
        </div>
      </div>

      <div className="rounded-2xl bg-white/80 p-3 shadow-sm sm:p-4 dark:bg-slate-900/85 dark:border dark:border-slate-800">
        <p className="mb-2 text-xs font-semibold text-slate-700 dark:text-slate-200">Lead rating</p>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((value) => {
            const current = lead.rating != null ? Number(lead.rating) : 0;
            const filled = value <= current;
            return (
              <button
                key={value}
                type="button"
                disabled={savingRating}
                onClick={() => handleRatingChange(value)}
                className="rounded p-0.5 transition hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
                title={`${value} star${value > 1 ? "s" : ""}`}
                aria-label={`Rate ${value} star${value > 1 ? "s" : ""}`}
              >
                <Star
                  className={`h-6 w-6 sm:h-7 sm:w-7 ${
                    filled
                      ? "fill-amber-400 text-amber-400"
                      : "fill-none text-slate-300 dark:text-slate-600"
                  }`}
                />
              </button>
            );
          })}
          {savingRating && (
            <span className="ml-2 text-[11px] text-slate-500 dark:text-slate-400">Saving...</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
        <div className="min-w-0 rounded-2xl bg-white/80 p-3 text-sm shadow-sm sm:p-4 md:col-span-2 dark:bg-slate-900/85 dark:border dark:border-slate-800">
              <p className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-50">Lead details</p>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white text-xs dark:border-slate-700 dark:bg-slate-900/70">
            <table className="min-w-full border-collapse">
              <tbody>
                <tr className="border-b border-slate-100 dark:border-slate-700">
                  <td className="bg-slate-50 px-3 py-2 font-medium text-slate-600 dark:bg-slate-800/80 dark:text-slate-300">
                    Full name
                  </td>
                  <td className="px-3 py-2 text-slate-800 dark:text-slate-100">
                    {lead.firstName} {lead.lastName || ""}
                  </td>
                </tr>
                <tr className="border-b border-slate-100 dark:border-slate-700">
                  <td className="bg-slate-50 px-3 py-2 font-medium text-slate-600 dark:bg-slate-800/80 dark:text-slate-300">
                    Company
                  </td>
                  <td className="px-3 py-2 text-slate-800 dark:text-slate-100">
                    {lead.company || "—"}
                  </td>
                </tr>
                <tr className="border-b border-slate-100 dark:border-slate-700">
                  <td className="bg-slate-50 px-3 py-2 font-medium text-slate-600 dark:bg-slate-800/80 dark:text-slate-300">
                    Email
                  </td>
                  <td className="px-3 py-2 text-slate-800 dark:text-slate-100">
                    {lead.email || "—"}
                  </td>
                </tr>
                <tr className="border-b border-slate-100 dark:border-slate-700">
                  <td className="bg-slate-50 px-3 py-2 font-medium text-slate-600 dark:bg-slate-800/80 dark:text-slate-300">
                    Phone
                  </td>
                  <td className="px-3 py-2 text-slate-800 dark:text-slate-100">
                    {lead.phone || "—"}
                  </td>
                </tr>
                <tr className="border-b border-slate-100 dark:border-slate-700">
                  <td className="bg-slate-50 px-3 py-2 font-medium text-slate-600 dark:bg-slate-800/80 dark:text-slate-300">
                    Owner
                  </td>
                  <td className="px-3 py-2 text-slate-800 dark:text-slate-100">
                    {lead.owner?.name || "—"}
                  </td>
                </tr>
                <tr className="border-b border-slate-100 dark:border-slate-700">
                  <td className="bg-slate-50 px-3 py-2 font-medium text-slate-600 dark:bg-slate-800/80 dark:text-slate-300">
                    Status
                  </td>
                  <td className="px-3 py-2 text-slate-800 dark:text-slate-100">{lead.status}</td>
                </tr>
                {/* <tr className="border-b border-slate-100 dark:border-slate-700">
                  <td className="bg-slate-50 px-3 py-2 font-medium text-slate-600 dark:bg-slate-800/80 dark:text-slate-300">
                    Expected close
                  </td>
                  <td className="px-3 py-2 text-slate-800 dark:text-slate-100">
                    {lead.expectedCloseDate
                      ? new Date(lead.expectedCloseDate).toLocaleDateString()
                      : "—"}
                  </td>
                </tr> */}
                {userRole && ADMIN_ROLES.includes(userRole) && (
                  <tr className="border-b border-slate-100 dark:border-slate-700">
                    <td className="bg-slate-50 px-3 py-2 font-medium text-slate-600 dark:bg-slate-800/80 dark:text-slate-300">
                      Rating
                    </td>
                    <td className="px-3 py-2 text-slate-800 dark:text-slate-100">
                      {lead.rating != null
                        ? `${Number(lead.rating)} / 5`
                        : "—"}
                    </td>
                  </tr>
                )}
                <tr>
                  <td className="bg-slate-50 px-3 py-2 font-medium text-slate-600 dark:bg-slate-800/80 dark:text-slate-300">
                    Value
                  </td>
                  <td className="px-3 py-2 text-slate-800 dark:text-slate-100">
                    {lead.valueAmount
                      ? `₹ ${Number(lead.valueAmount).toLocaleString("en-IN")}`
                      : "—"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {userRole && ADMIN_ROLES.includes(userRole) && lead.extraData && Object.keys(lead.extraData).length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-50">
                Imported fields
              </p>
              <div className="overflow-x-auto rounded-xl border border-dashed border-amber-200 bg-amber-50/60 text-xs dark:border-amber-700/50 dark:bg-amber-900/20">
                <table className="min-w-full border-collapse">
                  <tbody>
                    {Object.entries(lead.extraData).map(([key, value]) => (
                      <tr key={key} className="border-b border-amber-100/70 dark:border-amber-800/80">
                        <td className="bg-amber-100/80 px-3 py-2 font-medium text-amber-900 dark:bg-amber-900/30 dark:text-amber-200">
                          {key}
                        </td>
                        <td className="px-3 py-2 text-amber-900/90 break-all dark:text-amber-100">
                          {String(value)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-white/80 p-4 text-sm shadow-sm md:col-span-1 dark:bg-slate-900/85 dark:border dark:border-slate-800">
          <p className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-50">Status</p>
          <Select
            options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))}
            value={status}
            onChange={(v) => setStatus(String(v))}
            placeholder="Select status"
            disabled={savingStatus}
          />
          {status === "WON" && (
            <div className="mt-3 space-y-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60 dark:border dark:border-slate-700">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Payment details for won deal
              </p>
              <div className="grid gap-2 text-xs">
                <div className="min-w-[160px]">
                  <Select
                    label="Payment type"
                    options={[
                      { value: "FULL", label: "Full payment" },
                      { value: "PARTIAL", label: "Partial payment" }
                    ]}
                    value={paymentType}
                    onChange={(v) => setPaymentType(String(v))}
                    placeholder="Select type"
                    disabled={savingStatus}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-600 dark:text-slate-300">
                    Total Revenue (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={dealAmount}
                    onChange={(e) => setDealAmount(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-orange-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                    placeholder="Enter amount in ₹"
                  />
                </div>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={handleStatusSave}
            disabled={savingStatus}
            className="mt-3 rounded-lg bg-orange-500 px-4 py-2 text-xs font-medium text-white hover:bg-orange-600 disabled:opacity-50 dark:bg-orange-500 dark:hover:bg-orange-400"
          >
            {savingStatus ? "Saving..." : "Save status"}
          </button>
        </div>

        <div className="rounded-2xl bg-white/80 p-4 text-sm shadow-sm md:col-span-2 dark:bg-slate-900/85 dark:border dark:border-slate-800">
          <p className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-50">Remarks</p>
          <form onSubmit={handleAddRemark} className="mb-3 space-y-2">
            <textarea
              value={remarkText}
              onChange={(e) => setRemarkText(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
              placeholder="Add a remark about this lead..."
            />
            <button
              type="submit"
              disabled={savingRemark || !remarkText.trim()}
              className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-medium text-white hover:bg-slate-900 disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              {savingRemark ? "Adding..." : "Add remark"}
            </button>
          </form>

          {remarks.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">No remarks yet.</p>
          ) : (
            <ul className="space-y-2 text-xs">
              {remarks.map((r) => (
                <li
                  key={r.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/60"
                >
                  <p className="text-slate-700 dark:text-slate-200">{r.remark}</p>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>{r.user?.name || "Unknown"}</span>
                    <span>
                      {r.created_at
                        ? new Date(r.created_at).toLocaleString()
                        : ""}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {userRole && ADMIN_ROLES.includes(userRole) && (
        <div className="rounded-2xl bg-white/80 p-4 shadow-sm dark:bg-slate-900/85 dark:border dark:border-slate-800">
          <p className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-50">Update history</p>
          <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
            Changes made to this lead. Who updated what and when.
          </p>
          {auditLoading ? (
            <div className="py-4 text-center text-xs text-slate-500 dark:text-slate-400">Loading history…</div>
          ) : auditLog.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-6 text-center text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-400">
              No updates recorded yet.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
              <table className="min-w-full border-collapse text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800/80">
                  <tr>
                    <th className="border-b border-slate-200 px-3 py-2 text-left font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300">Date & time</th>
                    <th className="border-b border-slate-200 px-3 py-2 text-left font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300">Updated by</th>
                    <th className="border-b border-slate-200 px-3 py-2 text-left font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300">Field</th>
                    <th className="border-b border-slate-200 px-3 py-2 text-left font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300">Previous</th>
                    <th className="border-b border-slate-200 px-3 py-2 text-left font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300">New</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-900/50">
                  {auditLog.map((entry) => (
                    <tr key={entry.id} className="border-b border-slate-100 dark:border-slate-700">
                      <td className="whitespace-nowrap px-3 py-2 text-slate-600 dark:text-slate-400">
                        {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : "—"}
                      </td>
                      <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-200">
                        {entry.updatedBy?.name ?? "—"}
                      </td>
                      <td className="px-3 py-2 font-medium text-slate-700 dark:text-slate-200">{entry.fieldName}</td>
                      <td className="max-w-[200px] truncate px-3 py-2 text-slate-600 dark:text-slate-400" title={entry.oldValue || ""}>
                        {entry.oldValue || "—"}
                      </td>
                      <td className="max-w-[200px] truncate px-3 py-2 text-slate-800 dark:text-slate-100" title={entry.newValue || ""}>
                        {entry.newValue || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

