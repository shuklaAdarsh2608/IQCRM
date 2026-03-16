"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "../../../../services/api";

export default function DeleteRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(null);
  const [actioningId, setActioningId] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("iqlead_user");
      const user = raw ? JSON.parse(raw) : null;
      if (user?.role !== "SUPER_ADMIN") {
        setAllowed(false);
        router.replace("/dashboard/leads");
        return;
      }
      setAllowed(true);
    } catch {
      setAllowed(false);
      router.replace("/dashboard/leads");
    }
  }, [router]);

  useEffect(() => {
    if (allowed !== true) return;
    api
      .get("/leads/delete-requests")
      .then((res) => {
        if (res.data?.success && res.data?.data) setRequests(res.data.data);
      })
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  }, [allowed]);

  const handleApprove = (id) => {
    setActioningId(id);
    api
      .post(`/leads/delete-requests/${id}/approve`)
      .then(() => {
        setRequests((prev) => prev.filter((r) => r.id !== id));
      })
      .finally(() => setActioningId(null));
  };

  const handleReject = (id) => {
    setActioningId(id);
    api
      .post(`/leads/delete-requests/${id}/reject`)
      .then(() => {
        setRequests((prev) => prev.filter((r) => r.id !== id));
      })
      .finally(() => setActioningId(null));
  };

  if (allowed === false) return null;
  if (allowed !== true) return <div className="rounded-2xl bg-white/80 p-6 text-sm text-slate-500">Checking access...</div>;

  return (
    <div className="rounded-2xl bg-white/80 p-6 text-sm text-slate-700 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">Pending delete requests</h1>
        <Link
          href="/dashboard/leads"
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
        >
          Back to Leads
        </Link>
      </div>
      <p className="mb-4 text-xs text-slate-500">
        Admins have requested to delete these leads. Approve to delete the lead, or reject the request.
      </p>
      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : requests.length === 0 ? (
        <p className="text-slate-500">No pending delete requests.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-2 text-xs">
            <thead className="text-[11px] text-slate-500">
              <tr>
                <th className="px-2 py-1 text-left">Lead</th>
                <th className="px-2 py-1 text-left">Requested by</th>
                <th className="px-2 py-1 text-left">Date</th>
                <th className="px-2 py-1 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="rounded-xl bg-slate-50">
                  <td className="px-2 py-2">
                    <span className="font-medium text-slate-900">
                      #{r.lead?.id} — {r.lead?.firstName} {r.lead?.lastName}
                    </span>
                    {r.lead?.company && (
                      <span className="ml-1 text-slate-600">({r.lead.company})</span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-slate-600">{r.requestedByUser?.name}</td>
                  <td className="px-2 py-2 text-slate-600">
                    {r.createdAt ? new Date(r.createdAt).toLocaleString() : "—"}
                  </td>
                  <td className="px-2 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => handleApprove(r.id)}
                      disabled={actioningId === r.id}
                      className="mr-2 rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-200 disabled:opacity-50"
                    >
                      {actioningId === r.id ? "…" : "Approve & delete"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReject(r.id)}
                      disabled={actioningId === r.id}
                      className="rounded bg-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-300 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
