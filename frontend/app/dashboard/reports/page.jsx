"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import api from "../../../services/api";
import { Select } from "../../../components/ui/Select";

export default function ReportsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingChart, setExportingChart] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("all");
  const chartRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    api
      .get("/reports/performance")
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          setRows(res.data.data);
        } else {
          setRows([]);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredRows = useMemo(() => {
    if (selectedUserId === "all") return rows;
    return rows.filter((r) => String(r.userId) === String(selectedUserId));
  }, [rows, selectedUserId]);

  const chartData = useMemo(
    () =>
      filteredRows.map((r) => ({
        name: r.name,
        leads: Number(r.leads || 0),
        won: Number(r.won || 0),
        revenue: Number(r.revenue || 0)
      })),
    [filteredRows]
  );

  const handleExportExcel = async () => {
    try {
      setExportingExcel(true);
      const res = await api.get("/reports/performance/export", {
        responseType: "blob"
      });
      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "performance-report.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setExportingExcel(false);
    }
  };

  const handleExportChart = async () => {
    if (!chartRef.current) return;
    try {
      setExportingChart(true);
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: "#ffffff",
        scale: 2
      });
      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = "performance-bar-chart.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } finally {
      setExportingChart(false);
    }
  };

  return (
    <div className="min-w-0 rounded-2xl bg-white/80 p-4 text-sm text-slate-700 shadow-sm sm:p-6 dark:bg-slate-900/85 dark:text-slate-100 dark:border dark:border-slate-800">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-base font-semibold text-slate-900 dark:text-slate-50 sm:text-lg">
          Performance reports
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={exportingExcel}
            className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-4 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-300"
          >
            {exportingExcel ? "Exporting..." : "Export Excel"}
          </button>
          <button
            type="button"
            onClick={handleExportChart}
            disabled={exportingChart}
            className="inline-flex items-center gap-2 rounded-full border border-orange-400 px-4 py-1.5 text-xs font-medium text-orange-600 shadow-sm hover:bg-orange-50 disabled:cursor-not-allowed disabled:border-orange-200 disabled:text-orange-300"
          >
            {exportingChart ? "Saving..." : "Export chart"}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-xs text-slate-500 dark:text-slate-300">Loading...</p>
      ) : rows.length === 0 ? (
        <p className="text-xs text-slate-500 dark:text-slate-300">No data for this period.</p>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="text-[11px] text-slate-600 dark:text-slate-300">
              Showing{" "}
              <span className="font-semibold text-slate-900 dark:text-slate-50">
                {selectedUserId === "all"
                  ? "all users"
                  : filteredRows[0]?.name || "selected user"}
              </span>
            </div>
            <Select
              value={selectedUserId}
              onChange={(v) => setSelectedUserId(String(v))}
              options={[
                { value: "all", label: "All users" },
                ...rows.map((r) => ({ value: String(r.userId), label: r.name }))
              ]}
              placeholder="Select user"
              className="w-44"
            />
          </div>
          <div
            ref={chartRef}
            className="mb-6 rounded-2xl bg-slate-50/80 p-4 dark:bg-slate-900"
          >
            <p className="mb-3 text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-300">
              Leads, won deals & revenue
            </p>
            <div className="h-48 w-full min-w-0 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value, key) =>
                      key === "revenue" ? [`₹${Number(value).toLocaleString()}`, "Revenue"] : [value, key === "leads" ? "Leads" : "Won"]
                    }
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="leads" name="Leads" stackId="stack" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="won" name="Won" stackId="stack" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="revenue" name="Revenue" fill="#facc15" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="-mx-2 overflow-x-auto text-xs sm:mx-0">
            <table className="min-w-full border-separate border-spacing-y-2">
              <thead className="text-[11px] text-slate-500">
                <tr>
                  <th className="px-2 py-1 text-left">User</th>
                  <th className="px-2 py-1 text-left">Role</th>
                  <th className="px-2 py-1 text-right">Leads</th>
                  <th className="px-2 py-1 text-right">Won</th>
                  <th className="px-2 py-1 text-right">Revenue</th>
                  <th className="px-2 py-1 text-right">Target</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((r) => (
                  <tr key={r.userId} className="rounded-xl bg-slate-50 dark:bg-slate-900">
                    <td className="px-2 py-2 text-[13px] font-medium text-slate-900 dark:text-slate-50">
                      {r.name}
                    </td>
                    <td className="px-2 py-2 text-[12px] text-slate-600 dark:text-slate-300">
                      {r.role === "USER" ? "Sales Executive" : r.role}
                    </td>
                    <td className="px-2 py-2 text-right text-[12px] text-slate-600 dark:text-slate-300">
                      {r.leads}
                    </td>
                    <td className="px-2 py-2 text-right text-[12px] text-slate-600 dark:text-slate-300">
                      {r.won}
                    </td>
                    <td className="px-2 py-2 text-right text-[12px] text-slate-900 dark:text-slate-50">
                      ₹{r.revenue.toLocaleString()}
                    </td>
                    <td className="px-2 py-2 text-right text-[12px] text-slate-600 dark:text-slate-300">
                      {r.targetRevenue
                        ? `₹${r.targetRevenue.toLocaleString()}`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

