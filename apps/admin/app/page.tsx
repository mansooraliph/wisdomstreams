"use client";

import { useEffect, useState } from "react";
import type { PlatformStats } from "@wisdomstream/shared";
import { apiFetch } from "../lib/api";

export default function AdminHomePage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<PlatformStats>("/admin/stats").then((res) => {
      setStats(res.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <p className="p-6 text-sm text-gray-500">Loading...</p>;

  return (
    <main className="p-6">
      <h1 className="mb-4 text-xl font-semibold">Platform overview</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded border p-4">
          <p className="text-2xl font-semibold">{stats?.totalUsers ?? 0}</p>
          <p className="text-xs text-gray-500">Users</p>
        </div>
        <div className="rounded border p-4">
          <p className="text-2xl font-semibold">{stats?.totalChannels ?? 0}</p>
          <p className="text-xs text-gray-500">Channels</p>
        </div>
        <div className="rounded border p-4">
          <p className="text-2xl font-semibold">{stats?.totalVideos ?? 0}</p>
          <p className="text-xs text-gray-500">Videos</p>
        </div>
        <div className="rounded border p-4">
          <p className="text-2xl font-semibold">{stats?.totalViews ?? 0}</p>
          <p className="text-xs text-gray-500">Total views</p>
        </div>
      </div>
      <p className="mt-4 text-xs text-gray-400">
        DAU, storage, and bandwidth metrics need dedicated event/infra tracking not built yet.
      </p>
    </main>
  );
}
