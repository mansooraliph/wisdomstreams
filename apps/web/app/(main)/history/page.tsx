"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { WatchHistoryEntry } from "@wisdomstream/shared";
import { apiFetch } from "../../../lib/api";
import { useAuth } from "../../../lib/auth-context";

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const [entries, setEntries] = useState<WatchHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await apiFetch<WatchHistoryEntry[]>("/users/me/history");
    setEntries(res.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  const clearAll = async () => {
    await apiFetch("/users/me/history", { method: "DELETE" });
    setEntries([]);
  };

  const removeOne = async (videoId: string) => {
    await apiFetch(`/users/me/history/${videoId}`, { method: "DELETE" });
    setEntries((prev) => prev.filter((e) => e.videoId !== videoId));
  };

  if (authLoading) return null;
  if (!user) return <p className="p-6 text-sm text-gray-500">Sign in to view your watch history.</p>;

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Watch history</h1>
        {entries.length > 0 && (
          <button onClick={clearAll} className="text-sm text-blue-600 hover:underline">
            Clear all
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-gray-500">No videos watched yet.</p>
      ) : (
        <ul className="divide-y">
          {entries.map((entry) => (
            <li key={entry.id} className="flex items-center gap-3 py-3">
              <div className="h-16 w-28 flex-shrink-0 rounded bg-gray-200" />
              <div className="min-w-0 flex-1">
                <Link href={`/watch/${entry.video.id}`} className="truncate text-sm font-medium hover:underline">
                  {entry.video.title}
                </Link>
                <p className="text-xs text-gray-500">
                  Watched {new Date(entry.watchedAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => removeOne(entry.videoId)}
                className="text-xs text-gray-500 hover:underline"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
