"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Tv, Video, Eye, Flag, ArrowRight } from "lucide-react";
import type { PlatformStats, ReportWithTarget } from "@wisdomstream/shared";
import { apiFetch } from "../lib/api";

const STAT_CARDS = [
  { key: "totalUsers" as const, label: "Total users", icon: Users, color: "bg-indigo-50 text-indigo-600" },
  { key: "totalChannels" as const, label: "Channels", icon: Tv, color: "bg-emerald-50 text-emerald-600" },
  { key: "totalVideos" as const, label: "Videos", icon: Video, color: "bg-amber-50 text-amber-600" },
  { key: "totalViews" as const, label: "Total views", icon: Eye, color: "bg-sky-50 text-sky-600" },
];

export default function AdminHomePage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [reports, setReports] = useState<ReportWithTarget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch<PlatformStats>("/admin/stats"),
      apiFetch<ReportWithTarget[]>("/admin/reports?status=PENDING"),
    ]).then(([statsRes, reportsRes]) => {
      setStats(statsRes.data);
      setReports(reportsRes.data ?? []);
      setLoading(false);
    });
  }, []);

  if (loading) return <p className="p-6 text-sm text-gray-500">Loading...</p>;

  return (
    <main className="p-8">
      <h1 className="mb-6 text-2xl font-bold">Platform overview</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STAT_CARDS.map(({ key, label, icon: Icon, color }) => (
          <div key={key} className="rounded-xl border bg-white p-5">
            <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
              <Icon size={20} />
            </div>
            <p className="text-2xl font-bold">{stats?.[key] ?? 0}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl border bg-white p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold">
            <Flag size={16} className="text-red-500" />
            Pending reports
          </h2>
          <Link href="/reports" className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        {reports.length === 0 ? (
          <p className="text-sm text-gray-500">No pending reports. The queue is clear.</p>
        ) : (
          <ul className="divide-y">
            {reports.slice(0, 5).map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <span className="mr-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium uppercase text-gray-500">
                    {r.targetType}
                  </span>
                  {r.target?.title ?? r.target?.body ?? "(content removed)"}
                </div>
                <span className="text-xs text-gray-400">by {r.reporter.username}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="mt-4 text-xs text-gray-400">
        DAU, storage, and bandwidth metrics need dedicated event/infra tracking not built yet.
      </p>
    </main>
  );
}
