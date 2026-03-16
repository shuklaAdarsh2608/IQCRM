"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import api from "../../services/api";

const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN"];
/** Sales Executive, Manager, Team Leader see only: Name, Last Name, Designation, Company, Number, Mail ID, Status, Rating, Comment */
const LIMITED_VIEW_ROLES = ["USER", "MANAGER", "TEAM_LEADER"];
const TAB_MY_LEADS = "my";
const TAB_ALL_LEADS = "all";
const SEARCH_DEBOUNCE_MS = 350;
const EXPORT_STATUS_OPTIONS = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "PROPOSAL",
  "NEGOTIATION",
  "WON",
  "LOST",
  "RESCHEDULED",
  "JUNK"
];

export function LeadListTable() {
  const router = useRouter();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [canBulkAssign, setCanBulkAssign] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [activeTab, setActiveTab] = useState(TAB_MY_LEADS);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteMessage, setDeleteMessage] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [selectedExportStatuses, setSelectedExportStatuses] = useState([]);
  const [userRole, setUserRole] = useState(null);

  // Debounce search: update searchQuery after user stops typing
  useEffect(() => {
    const t = setTimeout(() => {
      setSearchQuery(searchInput.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = window.localStorage.getItem("iqlead_user");
        if (raw) {
          const user = JSON.parse(raw);
          setCanBulkAssign(ADMIN_ROLES.includes(user.role));
          setIsSuperAdmin(user.role === "SUPER_ADMIN");
          setCurrentUserId(user.id);
          setUserRole(user.role || null);
        }
      } catch {
        // ignore
      }
    }
  }, []);

  // Only admin can switch to "All leads"; others always see their assigned leads (My leads)
  const isAdmin = canBulkAssign;
  const effectiveTab = isAdmin ? activeTab : TAB_MY_LEADS;
  // Sales Executive, Manager, Team Leader see only: Name, Last Name, Designation, Company, Number, Mail ID, Status, Rating, Comment
  const isLimitedView = userRole != null && LIMITED_VIEW_ROLES.includes(userRole);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "20", page: String(page) });
    if (effectiveTab === TAB_MY_LEADS && currentUserId) {
      params.set("ownerId", String(currentUserId));
    }
    if (searchQuery) {
      params.set("search", searchQuery);
    }
    api
      .get(`/leads?${params.toString()}`)
      .then((res) => {
        if (res.data?.success && res.data?.data) {
          setLeads(res.data.data);
          if (res.data.pagination) {
            setTotalPages(res.data.pagination.totalPages || 1);
          }
        }
      })
      .catch(() => setLeads([]))
      .finally(() => setLoading(false));
  }, [effectiveTab, currentUserId, page, searchQuery]);

  // Results are already filtered by API when searchQuery is set; no client-side filter needed
  const filtered = leads;

  // Collect all extraData keys across current filtered leads so we can show all imported headers
  const extraColumns = Array.from(
    filtered.reduce((set, l) => {
      if (l.extraData && typeof l.extraData === "object") {
        Object.keys(l.extraData).forEach((k) => set.add(k));
      }
      return set;
    }, new Set())
  );

  const handleDelete = (lead) => {
    if (!window.confirm(`Delete lead #${lead.id} (${lead.firstName} ${lead.lastName})?${isSuperAdmin ? "" : " A request will be sent to Super Admin for approval."}`)) return;
    setDeletingId(lead.id);
    setDeleteMessage(null);
    api
      .delete(`/leads/${lead.id}`)
      .then((res) => {
        if (res.data?.data?.pending) {
          setDeleteMessage("Delete request sent to Super Admin for approval.");
        } else {
          setLeads((prev) => prev.filter((l) => l.id !== lead.id));
        }
      })
      .catch((err) => {
        setDeleteMessage(err.response?.data?.message || err.message || "Failed.");
      })
      .finally(() => {
        setDeletingId(null);
      });
  };

  const handleRowClick = (leadId) => {
    router.push(`/dashboard/leads/${leadId}`);
  };

  const openExportModal = () => {
    if (!canBulkAssign) return;
    setExportModalOpen(true);
    setSelectedExportStatuses([]);
  };

  const toggleExportStatus = (status) => {
    setSelectedExportStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const handleExportExcel = () => {
    if (exportLoading) return;
    setExportLoading(true);
    const params = new URLSearchParams();
    if (selectedExportStatuses.length > 0) {
      params.set("statuses", selectedExportStatuses.join(","));
    }
    const url = params.toString() ? `/leads/export/excel?${params.toString()}` : "/leads/export/excel";
    api
      .get(url, { responseType: "blob" })
      .then((res) => {
        const blob = new Blob([res.data], { type: res.headers["content-type"] });
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = res.headers["content-disposition"]?.split("filename=")?.[1]?.replace(/"/g, "") || "leads_export.xlsx";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);
        setExportModalOpen(false);
      })
      .catch(() => setExportLoading(false))
      .finally(() => setExportLoading(false));
  };

  const statusBadgeClass = (status) => {
    const s = (status || "").toUpperCase();
    if (s === "WON")
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300";
    if (s === "LOST" || s === "JUNK")
      return "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300";
    if (s === "NEW")
      return "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-100";
    if (["CONTACTED", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "RESCHEDULED"].includes(s))
      return "bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200";
    return "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-w-0 rounded-2xl bg-white/90 p-4 shadow-sm sm:p-5 dark:bg-slate-900/90 dark:text-slate-100 dark:border dark:border-slate-800"
    >
      <div className="mb-4 flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin ? (
            <>
              <button
                type="button"
                onClick={() => setActiveTab(TAB_MY_LEADS)}
                className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                  activeTab === TAB_MY_LEADS
                    ? "bg-orange-500 text-white shadow-sm"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                My leads
              </button>
              <button
                type="button"
                onClick={() => setActiveTab(TAB_ALL_LEADS)}
                className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                  activeTab === TAB_ALL_LEADS
                    ? "bg-orange-500 text-white shadow-sm"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                All leads
              </button>
              <Link
                href="/dashboard/leads/import"
                className="rounded-xl border-2 border-orange-400 bg-white px-4 py-2.5 text-sm font-medium text-orange-600 transition hover:bg-orange-50 dark:bg-slate-900 dark:text-orange-300 dark:hover:bg-orange-500/10"
              >
                Import
              </Link>
              <Link
                href="/dashboard/leads/bulk-assign"
                className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              >
                Bulk assign
              </Link>
              <button
                type="button"
                onClick={openExportModal}
                disabled={exportLoading}
                className="rounded-xl border-2 border-emerald-500 bg-white px-4 py-2.5 text-sm font-medium text-emerald-600 transition hover:bg-emerald-50 disabled:opacity-50 dark:bg-slate-900 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
              >
                {exportLoading ? "Exporting…" : "Export to Excel"}
              </button>
              {isSuperAdmin && (
                <Link
                  href="/dashboard/leads/delete-requests"
                  className="rounded-xl bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-700 transition hover:bg-amber-100"
                >
                  Pending deletes
                </Link>
              )}
            </>
          ) : (
            <span className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-800 dark:bg-slate-800 dark:text-slate-100">
              My leads
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="search"
            placeholder="Search name, company, email, phone..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full min-w-[140px] max-w-[260px] rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-200/50 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-900"
            aria-label="Search leads"
          />
          <span className="shrink-0 rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-200">
            Page {page} of {totalPages}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-400 border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl bg-slate-50 py-12 text-center text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-300">
            {searchQuery ? "No leads match your search." : "No leads yet. Use Import to add leads."}
          </div>
        ) : (
          <>
            {deleteMessage && (
              <p className={`mb-3 rounded-xl px-4 py-2.5 text-sm ${deleteMessage.includes("request sent") ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                {deleteMessage}
              </p>
            )}
          <table className="min-w-full border-collapse text-xs">
            <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-900">
              <tr>
                {isLimitedView ? (
                  <>
                    <th className="whitespace-nowrap border-b border-slate-200 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:border-slate-800 dark:text-slate-300">Name</th>
                    <th className="whitespace-nowrap border-b border-slate-200 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:border-slate-800 dark:text-slate-300">Last Name</th>
                    <th className="whitespace-nowrap border-b border-slate-200 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:border-slate-800 dark:text-slate-300">Designation</th>
                    <th className="whitespace-nowrap border-b border-slate-200 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:border-slate-800 dark:text-slate-300">Company</th>
                    <th className="whitespace-nowrap border-b border-slate-200 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:border-slate-800 dark:text-slate-300">Number</th>
                    <th className="whitespace-nowrap border-b border-slate-200 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:border-slate-800 dark:text-slate-300">Mail ID</th>
                    <th className="whitespace-nowrap border-b border-slate-200 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:border-slate-800 dark:text-slate-300">Status</th>
                    <th className="whitespace-nowrap border-b border-slate-200 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:border-slate-800 dark:text-slate-300">Amount</th>
                    <th className="whitespace-nowrap border-b border-slate-200 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:border-slate-800 dark:text-slate-300">Rating</th>
                    <th className="whitespace-nowrap border-b border-slate-200 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:border-slate-800 dark:text-slate-300">Comment</th>
                  </>
                ) : (
                  <>
                    <th className="whitespace-nowrap border-b border-slate-200 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:border-slate-800 dark:text-slate-300">Name</th>
                    <th className="whitespace-nowrap border-b border-slate-200 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:border-slate-800 dark:text-slate-300">Company</th>
                    <th className="whitespace-nowrap border-b border-slate-200 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:border-slate-800 dark:text-slate-300">Status</th>
                    <th className="whitespace-nowrap border-b border-slate-200 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:border-slate-800 dark:text-slate-300">Rating</th>
                    <th className="whitespace-nowrap border-b border-slate-200 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:border-slate-800 dark:text-slate-300">Amount</th>
                    <th className="whitespace-nowrap border-b border-slate-200 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:border-slate-800 dark:text-slate-300">Owner</th>
                    <th className="whitespace-nowrap border-b border-slate-200 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:border-slate-800 dark:text-slate-300">Contact</th>
                    <th className="whitespace-nowrap border-b border-slate-200 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:border-slate-800 dark:text-slate-300">Lead ID</th>
                    {extraColumns.map((col) => (
                      <th key={col} className="whitespace-nowrap border-b border-slate-200 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:border-slate-800 dark:text-slate-300">
                        {col}
                      </th>
                    ))}
                    {canBulkAssign && (
                      <th className="whitespace-nowrap border-b border-slate-200 px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:border-slate-800 dark:text-slate-300">Actions</th>
                    )}
                  </>
                )}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900">
              {filtered.map((lead, idx) => (
                <tr
                  key={lead.id}
                  className={`cursor-pointer transition hover:bg-orange-50/50 dark:hover:bg-slate-800/60 ${
                    idx % 2 === 1 ? "bg-slate-50/50 dark:bg-slate-900/40" : ""
                  }`}
                  onClick={() => handleRowClick(lead.id)}
                >
                  {isLimitedView ? (
                    <>
                      <td className="whitespace-nowrap border-b border-slate-100 px-4 py-3 text-sm font-medium text-slate-900 dark:border-slate-800 dark:text-slate-50">
                        {lead.firstName || "—"}
                      </td>
                      <td className="whitespace-nowrap border-b border-slate-100 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
                        {lead.lastName || "—"}
                      </td>
                      <td className="whitespace-nowrap border-b border-slate-100 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
                        {lead.title || "—"}
                      </td>
                      <td className="whitespace-nowrap border-b border-slate-100 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
                        {lead.company || "—"}
                      </td>
                      <td className="whitespace-nowrap border-b border-slate-100 px-4 py-3 text-sm text-slate-600">
                        {lead.phone || "—"}
                      </td>
                      <td className="max-w-[180px] truncate border-b border-slate-100 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300" title={lead.email || ""}>
                        {lead.email || "—"}
                      </td>
                      <td className="whitespace-nowrap border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium ${statusBadgeClass(lead.status)}`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap border-b border-slate-100 px-4 py-3 text-sm font-medium text-slate-700 dark:border-slate-800 dark:text-slate-200">
                        {lead.valueAmount != null && Number(lead.valueAmount) > 0
                          ? `₹ ${Number(lead.valueAmount).toLocaleString("en-IN")}`
                          : "—"}
                      </td>
                      <td className="whitespace-nowrap border-b border-slate-100 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
                        {lead.rating != null ? `${Number(lead.rating)} ★` : "—"}
                      </td>
                      <td className="max-w-[200px] truncate border-b border-slate-100 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300" title={lead.latestRemark || ""}>
                        {lead.latestRemark || "—"}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="whitespace-nowrap border-b border-slate-100 px-4 py-3 text-sm font-medium text-slate-900 dark:border-slate-800 dark:text-slate-50">
                        {lead.firstName} {lead.lastName}
                      </td>
                      <td className="whitespace-nowrap border-b border-slate-100 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
                        {lead.company || "—"}
                      </td>
                      <td className="whitespace-nowrap border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium ${statusBadgeClass(lead.status)}`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap border-b border-slate-100 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
                        {lead.rating != null ? `${Number(lead.rating)} ★` : "—"}
                      </td>
                      <td className="whitespace-nowrap border-b border-slate-100 px-4 py-3 text-sm font-medium text-slate-700 dark:border-slate-800 dark:text-slate-200">
                        {lead.valueAmount != null && Number(lead.valueAmount) > 0
                          ? `₹ ${Number(lead.valueAmount).toLocaleString("en-IN")}`
                          : "—"}
                      </td>
                      <td className="whitespace-nowrap border-b border-slate-100 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
                        {lead.owner?.name || "—"}
                      </td>
                      <td className="max-w-[180px] truncate border-b border-slate-100 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300" title={lead.email || lead.phone || ""}>
                        {lead.email || lead.phone || "—"}
                      </td>
                      <td className="whitespace-nowrap border-b border-slate-100 px-4 py-3 font-mono text-[12px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
                        #{lead.id}
                      </td>
                      {extraColumns.map((col) => (
                        <td
                          key={col}
                          className="max-w-[140px] truncate border-b border-slate-100 px-4 py-3 text-[12px] text-slate-600 dark:border-slate-800 dark:text-slate-300"
                          title={lead.extraData && lead.extraData[col] != null ? String(lead.extraData[col]) : ""}
                        >
                          {lead.extraData && lead.extraData[col] != null && String(lead.extraData[col]).trim() !== ""
                            ? String(lead.extraData[col])
                            : "—"}
                        </td>
                      ))}
                      {canBulkAssign && (
                        <td className="whitespace-nowrap border-b border-slate-100 px-4 py-3 text-right dark:border-slate-800">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(lead);
                            }}
                            disabled={deletingId === lead.id}
                            className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-500/10"
                            title="Delete lead"
                          >
                            {deletingId === lead.id ? "…" : "Delete"}
                          </button>
                        </td>
                      )}
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/80">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              Previous
            </button>
            <span className="text-sm text-slate-600 dark:text-slate-300">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => (p < totalPages ? p + 1 : p))}
              disabled={page >= totalPages || loading}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              Next
            </button>
          </div>
          </>
        )}
      </div>

      {/* Export status selection modal */}
      {exportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setExportModalOpen(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 dark:text-slate-100" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-2 text-lg font-semibold text-slate-800 dark:text-slate-50">Export leads by status</h3>
            <p className="mb-4 text-sm text-slate-500 dark:text-slate-300">Select which statuses to include. Leave all unchecked to export all leads.</p>
            <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {EXPORT_STATUS_OPTIONS.map((status) => (
                <label key={status} className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/60 dark:hover:bg-slate-800">
                  <input
                    type="checkbox"
                    checked={selectedExportStatuses.includes(status)}
                    onChange={() => toggleExportStatus(status)}
                    className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-400 dark:border-slate-600 dark:bg-slate-900"
                  />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{status}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setExportModalOpen(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExportExcel}
                disabled={exportLoading}
                className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
              >
                {exportLoading ? "Exporting…" : "Export"}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
