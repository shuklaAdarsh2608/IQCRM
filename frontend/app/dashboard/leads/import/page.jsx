"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "../../../../services/api";

const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN"];

const STANDARD_FIELDS = [
  { key: "first_name", label: "First Name", required: true },
  { key: "last_name", label: "Last Name", required: false },
  { key: "designation", label: "Designation", required: false },
  { key: "company", label: "Company", required: false },
  { key: "number", label: "Number", required: false },
  { key: "mail_id", label: "Mail ID", required: false },
  { key: "status", label: "Fresh / Status", required: false },
  { key: "comment", label: "Comment", required: false }
];

export default function ImportLeadsPage() {
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [manualHeaders, setManualHeaders] = useState([]);
  const [columnMap, setColumnMap] = useState({});
  const [loadingHeaders, setLoadingHeaders] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [allowed, setAllowed] = useState(null);
  const [manualInput, setManualInput] = useState("");

  const guessColumnMap = (incomingHeaders) => {
    const next = { ...columnMap };
    const normalized = {};
    incomingHeaders.forEach((h) => {
      normalized[h.toLowerCase().trim()] = h;
    });

    const findHeader = (candidates) => {
      for (const c of candidates) {
        const key = c.toLowerCase();
        if (normalized[key]) return normalized[key];
        // also try partial contains
        const match = Object.keys(normalized).find((k) => k.includes(key));
        if (match) return normalized[match];
      }
      return null;
    };

    if (!next.first_name) {
      const h = findHeader(["first name", "first_name", "firstname"]);
      if (h) next.first_name = h;
    }
    if (!next.last_name) {
      const h = findHeader(["last name", "last_name", "lastname", "surname"]);
      if (h) next.last_name = h;
    }
    if (!next.designation) {
      const h = findHeader(["designation", "job title", "job_title", "title"]);
      if (h) next.designation = h;
    }
    if (!next.company) {
      const h = findHeader(["company name", "company", "organisation", "organization"]);
      if (h) next.company = h;
    }
    if (!next.number) {
      const h = findHeader(["phone number", "phone", "mobile", "contact number"]);
      if (h) next.number = h;
    }
    if (!next.mail_id) {
      const h = findHeader(["email address", "email", "mail id", "mail"]);
      if (h) next.mail_id = h;
    }
    if (!next.status) {
      const h = findHeader(["status", "lead status", "fresh", "lead_type"]);
      if (h) next.status = h;
    }
    if (!next.comment) {
      const h = findHeader(["comment", "remarks", "remark", "notes", "note"]);
      if (h) next.comment = h;
    }

    setColumnMap(next);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("iqlead_user");
      const user = raw ? JSON.parse(raw) : null;
      const isAdmin = user && ADMIN_ROLES.includes(user.role);
      setAllowed(isAdmin);
      if (!isAdmin) router.replace("/dashboard/leads");
    } catch {
      setAllowed(false);
      router.replace("/dashboard/leads");
    }
  }, [router]);

  const allHeaders = [...new Set([...headers, ...manualHeaders])];

  const handleLoadHeaders = () => {
    if (!file) {
      setError("Please select a file first.");
      return;
    }
    setError("");
    setLoadingHeaders(true);
    const formData = new FormData();
    formData.append("file", file);
    api
      .post("/leads/import/preview", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      })
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data?.headers)) {
          const detected = res.data.data.headers;
          setHeaders(detected);
          guessColumnMap(detected);
        }
      })
      .catch((err) => {
        setError(err.response?.data?.message || err.message || "Failed to load headers.");
      })
      .finally(() => setLoadingHeaders(false));
  };

  const handleAddHeaderManually = () => {
    const name = (manualInput || "").trim();
    if (!name) return;
    setManualHeaders((prev) => (prev.includes(name) ? prev : [...prev, name]));
    setManualInput("");
  };

  const handleMapChange = (fieldKey, value) => {
    setColumnMap((prev) => {
      const next = { ...prev };
      if (value === "" || value == null) delete next[fieldKey];
      else next[fieldKey] = value;
      return next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setResult(null);
    if (!file) {
      setError("Please select a CSV or Excel file.");
      return;
    }
    if (allHeaders.length > 0 && !columnMap.first_name) {
      setError("Please map 'First Name' to a column from your file.");
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("columnMap", JSON.stringify(columnMap));
    api
      .post("/leads/import", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      })
      .then((res) => {
        if (res.data?.success) {
          setResult(res.data.data);
          setFile(null);
          setHeaders([]);
          setColumnMap({});
          // After a successful import, go back to leads list so the user sees new rows
          router.replace("/dashboard/leads");
        }
      })
      .catch((err) => {
        setError(err.response?.data?.message || err.message || "Import failed.");
      })
      .finally(() => setLoading(false));
  };

  if (allowed === false) return null;
  if (allowed !== true)
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
        Checking access...
      </div>
    );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">Import Leads</h1>
        <Link
          href="/dashboard/leads"
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
        >
          Back to Leads
        </Link>
      </div>
      <p className="mb-4 text-xs text-slate-500">
        Upload a CSV or Excel (.xlsx) file, then map your columns to: First Name, Last Name, Designation, Company, Number, Mail ID, Status (Fresh), Comment.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">File (CSV or Excel)</label>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="file"
              accept=".csv,.xlsx,text/csv,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(e) => {
                setFile(e.target.files?.[0] || null);
                setHeaders([]);
                setColumnMap({});
              }}
              className="block text-sm text-slate-600 file:mr-2 file:rounded-lg file:border-0 file:bg-orange-50 file:px-3 file:py-1.5 file:text-orange-700"
            />
            <button
              type="button"
              onClick={handleLoadHeaders}
              disabled={loadingHeaders || !file}
              className="rounded-lg border border-orange-300 bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-700 hover:bg-orange-100 disabled:opacity-50"
            >
              {loadingHeaders ? "Loading…" : "Load headers"}
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-900/70">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
            File headers
          </h2>
          {allHeaders.length > 0 ? (
            <p className="mb-3 break-words text-xs text-slate-600 dark:text-slate-200">
              Detected:&nbsp;
              <span className="font-medium text-slate-800">
                {allHeaders.join(", ")}
              </span>
            </p>
          ) : (
            <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
              Click <span className="font-semibold">Load headers</span> after selecting a
              file to see all columns from your CSV/Excel.
            </p>
          )}
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
            Add header manually
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddHeaderManually())}
              placeholder="Type column name from your file"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            />
            <button
              type="button"
              onClick={handleAddHeaderManually}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              Add header
            </button>
          </div>
          {manualHeaders.length > 0 && (
            <p className="mt-2 text-xs text-slate-500">
              Added: {manualHeaders.join(", ")}
            </p>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-900/70">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
            Map columns
          </h2>
          <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
            Match each lead field to a column from your file. First Name is required.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {STANDARD_FIELDS.map(({ key, label, required }) => (
              <div key={key} className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-200">
                  {label}
                  {required && <span className="text-orange-500"> *</span>}
                </label>
                <select
                  value={columnMap[key] ?? ""}
                  onChange={(e) => handleMapChange(key, e.target.value || null)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value="">Don&apos;t map</option>
                  {allHeaders.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-500/10 dark:text-red-300">
              {error}
            </p>
        )}
        <button
          type="submit"
          disabled={loading || !file}
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-600 disabled:opacity-50 dark:bg-orange-500 dark:hover:bg-orange-400"
        >
          {loading ? "Importing…" : "Import"}
        </button>
      </form>

      {result && (
        <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-800">Import result</h2>
          <p className="text-xs text-slate-600">
            Total: {result.totalRows} · Success: {result.successRows} · Failed: {result.failedRows}
          </p>
          {result.errors?.length > 0 && (
            <ul className="mt-2 max-h-32 overflow-y-auto text-xs text-red-600">
              {result.errors.map((e, i) => (
                <li key={i}>Row {e.row}: {e.message}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
