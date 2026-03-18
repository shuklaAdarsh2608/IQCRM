"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, ArrowRight, Users } from "lucide-react";
import api from "../../../../services/api";
import { Select } from "../../../../components/ui/Select";

const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN"];
const PAGE_SIZE = 20;

export default function BulkAssignLeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [ownerId, setOwnerId] = useState("");
  const [filterOwnerId, setFilterOwnerId] = useState("");
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [allowed, setAllowed] = useState(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);
  const [showPoolOnly, setShowPoolOnly] = useState(true);
  const [columnFilters, setColumnFilters] = useState({
    name: "",
    company: "",
    status: "",
    contact: "",
    owner: ""
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("iqlead_user");
      const user = raw ? JSON.parse(raw) : null;
      const isAdmin = user && ADMIN_ROLES.includes(user.role);
      setAllowed(isAdmin);
      setIsSuperAdmin(user?.role === "SUPER_ADMIN");
      if (!isAdmin) router.replace("/dashboard/leads");
    } catch {
      setAllowed(false);
      router.replace("/dashboard/leads");
    }
  }, [router]);

  const loadLeads = useCallback(
    (pageNum = 1) => {
      if (allowed !== true) return;
      setLoadingLeads(true);
      const params = new URLSearchParams({
        page: String(pageNum),
        limit: String(PAGE_SIZE)
      });
      if (showPoolOnly) {
        params.set("poolOnly", "1");
      } else if (filterOwnerId) {
        params.set("ownerId", filterOwnerId);
      }
      api
        .get(`/leads?${params.toString()}`)
        .then((res) => {
          if (res.data?.success && Array.isArray(res.data.data)) {
            setLeads(res.data.data);
            setSelectedIds(new Set());
            if (res.data.pagination) {
              setTotalPages(res.data.pagination.totalPages || 1);
              setTotalLeads(res.data.pagination.total ?? 0);
            } else {
              setTotalPages(1);
              setTotalLeads(res.data.data.length);
            }
          } else {
            setLeads([]);
            setTotalPages(1);
            setTotalLeads(0);
          }
        })
        .catch(() => {
          setLeads([]);
          setTotalPages(1);
          setTotalLeads(0);
        })
        .finally(() => setLoadingLeads(false));
    },
    [allowed, showPoolOnly, filterOwnerId]
  );

  useEffect(() => {
    loadLeads(page);
  }, [loadLeads, page]);

  useEffect(() => {
    if (allowed !== true) return;
    api
      .get("/users/options")
      .then((res) => {
        if (res.data?.success && res.data?.data) {
          setUsers(res.data.data);
          if (res.data.data.length && !ownerId) setOwnerId(String(res.data.data[0].id));
        }
      })
      .catch(() => {})
      .finally(() => setLoadingUsers(false));
  }, [allowed]);

  const toggle = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === leads.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(leads.map((l) => l.id)));
  };

  const handleAssign = (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });
    if (!ownerId || selectedIds.size === 0) {
      setMessage({ type: "error", text: "Select at least one lead and an assignee." });
      return;
    }
    setSubmitting(true);
    api
      .post("/leads/bulk-assign", { leadIds: Array.from(selectedIds), ownerId: Number(ownerId) })
      .then((res) => {
        if (res.data?.success) {
          const d = res.data.data;
          setMessage({
            type: "success",
            text: `Assigned ${d.assigned} lead(s) to the selected user. They now appear in that user's "My leads" tab. Skipped: ${d.skipped}.`
          });
          setSelectedIds(new Set());
          loadLeads(page);
        }
      })
      .catch((err) => {
        setMessage({
          type: "error",
          text: err.response?.data?.message || err.message || "Bulk assign failed."
        });
      })
      .finally(() => setSubmitting(false));
  };

  const setViewPool = () => {
    setShowPoolOnly(true);
    setFilterOwnerId("");
    setPage(1);
  };

  const setViewAll = () => {
    setShowPoolOnly(false);
    setFilterOwnerId("");
    setPage(1);
  };

  const selectedUserName = users.find((u) => String(u.id) === ownerId)?.name ?? "user";

  const filteredLeads = leads.filter((lead) => {
    const fullName = `${lead.firstName || ""} ${lead.lastName || ""}`.toLowerCase();
    const contact = (lead.email || lead.phone || "").toLowerCase();
    const ownerName = (lead.owner?.name || "").toLowerCase();
    const company = (lead.company || "").toLowerCase();
    const status = (lead.status || "").toLowerCase();

    return (
      (!columnFilters.name ||
        fullName.includes(columnFilters.name.trim().toLowerCase())) &&
      (!columnFilters.company ||
        company.includes(columnFilters.company.trim().toLowerCase())) &&
      (!columnFilters.status ||
        status.includes(columnFilters.status.trim().toLowerCase())) &&
      (!columnFilters.contact ||
        contact.includes(columnFilters.contact.trim().toLowerCase())) &&
      (!columnFilters.owner ||
        ownerName.includes(columnFilters.owner.trim().toLowerCase()))
    );
  });

  if (allowed === false) return null;
  if (allowed !== true) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
        Checking access...
      </div>
    );
  }

  return (
    <div className="glass-card min-w-0 overflow-hidden p-3 sm:p-4">
      {/* Same tab bar as Leads page — Bulk assign is active */}
      <div className="mb-4 flex flex-wrap items-center gap-1.5 border-b border-slate-200 pb-3 dark:border-slate-700">
        <Link
          href="/dashboard/leads"
          className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          My leads
        </Link>
        <Link
          href="/dashboard/leads"
          className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          All leads
        </Link>
        <Link
          href="/dashboard/leads/import"
          className="rounded-lg border-2 border-orange-400 bg-white px-4 py-2 text-sm font-medium text-orange-600 shadow-sm hover:bg-orange-50 dark:bg-slate-900 dark:text-orange-300 dark:hover:bg-orange-500/10"
        >
          Import
        </Link>
        <span className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-800 shadow-sm dark:bg-slate-700 dark:text-slate-100">
          Bulk assign
        </span>
        {isSuperAdmin && (
          <Link
            href="/dashboard/leads/delete-requests"
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-amber-700 shadow-sm hover:bg-amber-50 dark:bg-slate-900 dark:text-amber-300 dark:hover:bg-amber-500/10"
          >
            Pending deletes
          </Link>
        )}
      </div>

      <div className="min-w-0 space-y-4">
        {message.text && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              message.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300"
                : "border-red-200 bg-red-50 text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300"
            }`}
          >
            {message.text}
          </div>
        )}

      {/* Assign card */}
      <div className="rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50/80 to-white p-4 shadow-sm sm:p-5 dark:border-slate-700 dark:from-slate-900 dark:to-slate-900">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
          <Users className="h-4 w-4 text-orange-500" />
          Assign selected leads to
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
          <div className="w-full min-w-0 sm:max-w-[260px]">
            <Select
              label="User"
              options={users.map((u) => ({ value: u.id, label: u.name }))}
              value={ownerId}
              onChange={(v) => setOwnerId(String(v))}
              placeholder="Select user"
              disabled={loadingUsers}
            />
          </div>
          <button
            onClick={handleAssign}
            disabled={submitting || selectedIds.size === 0}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 text-sm font-medium text-white shadow-sm hover:bg-orange-600 disabled:opacity-50 sm:shrink-0"
          >
            {submitting ? (
              "Assigning…"
            ) : (
              <>
                <ArrowRight className="h-4 w-4" />
                Assign {selectedIds.size} to {selectedUserName}
              </>
            )}
          </button>
        </div>
        {selectedIds.size > 0 && (
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-300">
            {selectedIds.size} lead(s) selected. They will appear in &quot;My leads&quot; for the chosen user.
          </p>
        )}
      </div>

      {/* View tabs + filter — same style as Leads page tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-medium text-slate-500 dark:text-slate-300">
            View:
          </span>
          <button
            type="button"
            onClick={setViewPool}
            className={`rounded-lg px-4 py-2 text-sm font-medium shadow-sm transition ${
              showPoolOnly
                ? "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100"
                : "bg-white text-slate-700 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            My pool
          </button>
          <button
            type="button"
            onClick={setViewAll}
            className={`rounded-lg px-4 py-2 text-sm font-medium shadow-sm transition ${
              !showPoolOnly && !filterOwnerId
                ? "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100"
                : "bg-white text-slate-700 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            All leads
          </button>
          {!showPoolOnly && (
            <div className="flex items-center gap-2">
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <div className="w-[200px]">
                <Select
                  options={[
                    { value: "", label: "Any owner" },
                    ...users.map((u) => ({ value: u.id, label: `Assigned to ${u.name}` }))
                  ]}
                  value={filterOwnerId}
                  onChange={(v) => {
                    setFilterOwnerId(String(v));
                    setPage(1);
                  }}
                  placeholder="Filter by owner"
                />
              </div>
            </div>
          )}
        </div>
        <div className="text-sm text-slate-500 dark:text-slate-300">
          {totalLeads > 0 ? (
            <span>
              {totalLeads} lead{totalLeads !== 1 ? "s" : ""} · Page {page} of {totalPages}
            </span>
          ) : (
            "No leads"
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loadingLeads ? (
          <div className="flex items-center justify-center py-16 text-sm text-slate-500">
            Loading leads…
          </div>
        ) : leads.length === 0 ? (
          <div className="py-16 text-center">
            <User className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-2 text-sm text-slate-500">
              {showPoolOnly
                ? "No leads in your pool. Import leads or get some from All leads first."
                : filterOwnerId
                  ? "No leads assigned to this user."
                  : "No leads. Import or create leads first."}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-[600px] w-full border-collapse text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="border-b border-slate-200 px-4 py-3 text-left">
                      <label className="flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={leads.length > 0 && selectedIds.size === leads.length}
                          onChange={toggleAll}
                          className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-400"
                        />
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Select</span>
                      </label>
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Lead
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Company
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>
                    <th className="border-b border-slate-200 bg-slate-100/80 px-4 py-3 text-left">
                      <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
                        <User className="h-3.5 w-3.5" />
                        Assigned to
                      </span>
                    </th>
                  </tr>
                  <tr className="bg-slate-50/90">
                    <th className="border-b border-slate-200 px-4 py-2" />
                    <th className="border-b border-slate-200 px-4 py-2">
                      <input
                        value={columnFilters.name}
                        onChange={(e) =>
                          setColumnFilters((f) => ({ ...f, name: e.target.value }))
                        }
                        placeholder="Search name / contact"
                        className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs outline-none placeholder:text-slate-400 focus:border-orange-300 focus:ring-1 focus:ring-orange-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-orange-400 dark:focus:ring-orange-400/40"
                      />
                    </th>
                    <th className="border-b border-slate-200 px-4 py-2">
                      <input
                        value={columnFilters.company}
                        onChange={(e) =>
                          setColumnFilters((f) => ({ ...f, company: e.target.value }))
                        }
                        placeholder="Company"
                        className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs outline-none placeholder:text-slate-400 focus:border-orange-300 focus:ring-1 focus:ring-orange-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-orange-400 dark:focus:ring-orange-400/40"
                      />
                    </th>
                    <th className="border-b border-slate-200 px-4 py-2">
                      <input
                        value={columnFilters.status}
                        onChange={(e) =>
                          setColumnFilters((f) => ({ ...f, status: e.target.value }))
                        }
                        placeholder="Status"
                        className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs outline-none placeholder:text-slate-400 focus:border-orange-300 focus:ring-1 focus:ring-orange-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-orange-400 dark:focus:ring-orange-400/40"
                      />
                    </th>
                    <th className="border-b border-slate-200 px-4 py-2">
                      <input
                        value={columnFilters.owner}
                        onChange={(e) =>
                          setColumnFilters((f) => ({ ...f, owner: e.target.value }))
                        }
                        placeholder="Owner"
                        className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs outline-none placeholder:text-slate-400 focus:border-orange-300 focus:ring-1 focus:ring-orange-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-orange-400 dark:focus:ring-orange-400/40"
                      />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="border-b border-slate-100 hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(lead.id)}
                          onChange={() => toggle(lead.id)}
                          className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-400"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-900">
                          {lead.firstName} {lead.lastName}
                        </span>
                        {(lead.email || lead.phone) && (
                          <p className="mt-0.5 text-xs text-slate-500">
                            {lead.email || lead.phone || "—"}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {lead.company || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                          {lead.status}
                        </span>
                      </td>
                      <td className="bg-slate-50/50 px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm">
                          <User className="h-3.5 w-3.5 text-slate-400" />
                          {lead.owner?.name || "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50/50 px-4 py-3">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || loadingLeads}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-slate-600">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || loadingLeads}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      </div>
    </div>
  );
}
