"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, BadgeCheck } from "lucide-react";
import type { Channel } from "@wisdomstream/shared";
import { apiFetch } from "../../lib/api";
import { AvatarCircle } from "../../components/avatar-circle";

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
    <main className="p-8">
      <h1 className="mb-6 text-2xl font-bold">Channel verification</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          load(search);
        }}
        className="relative mb-6 max-w-md"
      >
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by handle or name"
          className="w-full rounded-full border bg-white py-2 pl-9 pr-4 text-sm"
        />
      </form>

      <div className="overflow-hidden rounded-xl border bg-white">
        {loading ? (
          <p className="p-6 text-sm text-gray-500">Loading...</p>
        ) : (
          <ul className="divide-y">
            {channels.map((c) => (
              <li key={c.id} className="flex items-center justify-between px-5 py-4 text-sm">
                <div className="flex items-center gap-3">
                  <AvatarCircle name={c.name} size={36} />
                  <div>
                    <p className="flex items-center gap-1 font-medium">
                      {c.name}
                      {c.isVerified && <BadgeCheck size={14} className="text-blue-500" />}
                    </p>
                    <p className="text-xs text-gray-500">
                      @{c.handle} · {c.subscriberCount} subscribers
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => toggleVerify(c.id, c.isVerified)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                    c.isVerified ? "hover:bg-gray-50" : "border-black bg-black text-white hover:bg-gray-800"
                  }`}
                >
                  {c.isVerified ? "Unverify" : "Verify"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
