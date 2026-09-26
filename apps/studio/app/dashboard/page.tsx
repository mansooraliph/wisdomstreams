"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Channel, ChannelOverview } from "@wisdomstream/shared";
import { apiFetch } from "../../lib/api";

export default function DashboardPage() {
  const [channel, setChannel] = useState<Channel | null>(null);
  const [overview, setOverview] = useState<ChannelOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const channelRes = await apiFetch<Channel[]>("/channels/me");
      const ch = channelRes.data?.[0] ?? null;
      setChannel(ch);
      if (ch) {
        const overviewRes = await apiFetch<ChannelOverview>(`/channels/${ch.id}/overview`);
        setOverview(overviewRes.data);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <p className="p-6 text-sm text-gray-500">Loading...</p>;
  if (!channel) {
    return (
      <main className="p-6">
        <p className="text-sm text-gray-500">
          You don&apos;t have a channel yet.{" "}
          <Link href="/customization" className="text-blue-600 hover:underline">
            Create one
          </Link>
          .
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-xl font-semibold">{channel.name} dashboard</h1>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded border p-4">
          <p className="text-2xl font-semibold">{overview?.subscriberCount ?? 0}</p>
          <p className="text-xs text-gray-500">Subscribers</p>
        </div>
        <div className="rounded border p-4">
          <p className="text-2xl font-semibold">{overview?.totalViews ?? 0}</p>
          <p className="text-xs text-gray-500">Total views</p>
        </div>
        <div className="rounded border p-4">
          <p className="text-2xl font-semibold">{overview?.videoCount ?? 0}</p>
          <p className="text-xs text-gray-500">Videos</p>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Recent videos</h2>
          <Link href="/content" className="text-xs text-blue-600 hover:underline">
            View all
          </Link>
        </div>
        {overview?.recentVideos.length ? (
          <ul className="divide-y">
            {overview.recentVideos.map((v) => (
              <li key={v.id} className="flex items-center justify-between py-2 text-sm">
                <Link href={`/content/${v.id}`} className="font-medium hover:underline">
                  {v.title}
                </Link>
                <span className="text-xs text-gray-500 capitalize">
                  {v.visibility.toLowerCase()} · {v.viewCount} views
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">
            No videos yet.{" "}
            <Link href="/upload" className="text-blue-600 hover:underline">
              Upload your first one
            </Link>
            .
          </p>
        )}
      </div>
    </main>
  );
}
