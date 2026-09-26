"use client";

import { useCallback, useEffect, useState } from "react";
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

  if (loading) return <p className="p-6 text-sm text-gray-500">Loading...</p>;

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-6">
      <h1 className="text-xl font-semibold">Pending reports</h1>
      {reports.length === 0 ? (
        <p className="text-sm text-gray-500">No pending reports.</p>
      ) : (
        <ul className="divide-y">
          {reports.map((r) => (
            <li key={r.id} className="py-3">
              <p className="text-xs uppercase text-gray-500">
                {r.targetType} reported by {r.reporter.username}
              </p>
              <p className="text-sm">{r.target?.title ?? r.target?.body ?? "(content removed)"}</p>
              <p className="mt-1 text-xs text-gray-600">Reason: {r.reason}</p>
              <div className="mt-2 flex gap-3 text-xs">
                <button onClick={() => act(r.id, "remove")} className="text-red-600 hover:underline">
                  Remove content
                </button>
                <button onClick={() => act(r.id, "warn")} className="text-yellow-600 hover:underline">
                  Warn owner
                </button>
                <button onClick={() => act(r.id, "dismiss")} className="text-gray-500 hover:underline">
                  Dismiss
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
