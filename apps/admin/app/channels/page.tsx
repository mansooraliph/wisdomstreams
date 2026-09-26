"use client";

import { useCallback, useEffect, useState } from "react";
import type { Channel } from "@wisdomstream/shared";
import { apiFetch } from "../../lib/api";

export default function AdminChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (q: string) => {
    setLoading(true);
    const res = await apiFetch<Channel[]>(`/admin/channels${q ? `?search=${encodeURIComponent(q)}` : ""}`);
    setChannels(res.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load("");
  }, [load]);

  const toggleVerify = async (id: string, isVerified: boolean) => {
    const res = await apiFetch<Channel>(`/admin/channels/${id}/verify`, {
      method: "PATCH",
      body: JSON.stringify({ isVerified: !isVerified }),
    });
    if (res.data) setChannels((prev) => prev.map((c) => (c.id === id ? res.data! : c)));
  };

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-6">
      <h1 className="text-xl font-semibold">Channel verification</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          load(search);
        }}
        className="flex gap-2"
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by handle or name"
          className="flex-1 rounded border px-3 py-1.5 text-sm"
        />
        <button type="submit" className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white">
          Search
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        <ul className="divide-y">
          {channels.map((c) => (
            <li key={c.id} className="flex items-center justify-between py-2 text-sm">
              <div>
                <p className="font-medium">
                  {c.name} {c.isVerified && <span title="Verified">✓</span>}
                </p>
                <p className="text-xs text-gray-500">
                  @{c.handle} · {c.subscriberCount} subscribers
                </p>
              </div>
              <button
                onClick={() => toggleVerify(c.id, c.isVerified)}
                className="rounded border px-3 py-1 text-xs"
              >
                {c.isVerified ? "Unverify" : "Verify"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
