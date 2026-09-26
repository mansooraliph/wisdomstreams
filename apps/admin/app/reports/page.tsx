"use client";

import { useCallback, useEffect, useState } from "react";
import { Flag, Trash2, TriangleAlert, CircleX } from "lucide-react";
import type { ReportWithTarget } from "@wisdomstream/shared";
import { apiFetch } from "../../lib/api";

export default function AdminReportsPage() {
  const [reports, setReports] = useState<ReportWithTarget[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await apiFetch<ReportWithTarget[]>("/admin/reports?status=PENDING");
    setReports(res.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (id: string, action: "remove" | "dismiss" | "warn") => {
    await apiFetch(`/admin/reports/${id}/action`, {
      method: "PATCH",
      body: JSON.stringify({ action }),
    });
    setReports((prev) => prev.filter((r) => r.id !== id));
  };

  if (loading) return <p className="p-8 text-sm text-gray-500">Loading...</p>;

  return (
    <main className="p-8">
      <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold">
        <Flag size={22} className="text-red-500" />
        Pending reports
      </h1>

      <div className="overflow-hidden rounded-xl border bg-white">
        {reports.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">No pending reports. The queue is clear.</p>
        ) : (
          <ul className="divide-y">
            {reports.map((r) => (
              <li key={r.id} className="p-5">
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium uppercase text-gray-500">
                  {r.targetType}
                </span>
                <span className="ml-2 text-xs text-gray-400">reported by {r.reporter.username}</span>
                <p className="mt-2 text-sm font-medium">
                  {r.target?.title ?? r.target?.body ?? "(content removed)"}
                </p>
                <p className="mt-1 text-xs text-gray-600">Reason: {r.reason}</p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => act(r.id, "remove")}
                    className="flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
                  >
                    <Trash2 size={13} /> Remove content
                  </button>
                  <button
                    onClick={() => act(r.id, "warn")}
                    className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100"
                  >
                    <TriangleAlert size={13} /> Warn owner
                  </button>
                  <button
                    onClick={() => act(r.id, "dismiss")}
                    className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200"
                  >
                    <CircleX size={13} /> Dismiss
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
