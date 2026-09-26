"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Upload, Users, Eye, Clock, CheckCircle2, Circle } from "lucide-react";
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

  const topVideo = overview?.recentVideos[0];
  const checklist = [
    { label: "Create your channel", done: true },
    { label: "Customize your channel", done: !!channel.description || !!channel.avatarUrl },
    { label: "Upload your first video", done: (overview?.videoCount ?? 0) > 0 },
    { label: "Get your first subscriber", done: (overview?.subscriberCount ?? 0) > 0 },
  ];

  return (
    <main className="p-8">
      <h1 className="mb-6 text-3xl font-bold">Channel dashboard</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: latest video performance / upload prompt */}
        <div className="rounded-xl border bg-white p-6">
          {topVideo ? (
            <>
              <h2 className="mb-4 font-semibold">Latest video performance</h2>
              <div className="aspect-video w-full rounded-lg bg-gray-100" />
              <p className="mt-3 truncate text-sm font-medium">{topVideo.title}</p>
              <div className="mt-3 flex justify-between text-sm">
                <span className="text-gray-500">Views</span>
                <span className="font-semibold">{topVideo.viewCount}</span>
              </div>
              <Link
                href={`/content/${topVideo.id}`}
                className="mt-4 inline-block rounded-full border px-4 py-2 text-sm font-medium hover:bg-gray-50"
              >
                View video analytics
              </Link>
            </>
          ) : (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-sky-100">
                <Upload size={40} className="text-sky-500" />
              </div>
              <p className="text-sm text-gray-600">
                Want to see metrics on your recent video? Upload and publish a video to get started.
              </p>
              <Link
                href="/upload"
                className="mt-4 rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
              >
                Upload videos
              </Link>
            </div>
          )}
        </div>

        {/* Middle: channel analytics */}
        <div className="rounded-xl border bg-white p-6">
          <h2 className="mb-4 font-semibold">Channel analytics</h2>

          <p className="flex items-center gap-1.5 text-xs text-gray-500">
            <Users size={14} /> Current subscribers
          </p>
          <p className="text-3xl font-bold">{overview?.subscriberCount ?? 0}</p>

          <div className="my-4 border-t" />

          <p className="text-xs text-gray-500">Summary · all time</p>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-gray-600">
              <Eye size={14} /> Views
            </span>
            <span className="font-semibold">{overview?.totalViews ?? 0}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-gray-600">
              <Clock size={14} /> Videos published
            </span>
            <span className="font-semibold">{overview?.videoCount ?? 0}</span>
          </div>

          <div className="my-4 border-t" />

          <Link
            href="/analytics"
            className="inline-block rounded-full border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Go to channel analytics
          </Link>
        </div>

        {/* Right: getting started checklist */}
        <div className="rounded-xl border bg-white p-6">
          <h2 className="mb-4 font-semibold">Getting started</h2>
          <ul className="space-y-3">
            {checklist.map((item) => (
              <li key={item.label} className="flex items-center gap-2 text-sm">
                {item.done ? (
                  <CheckCircle2 size={18} className="flex-shrink-0 text-green-600" />
                ) : (
                  <Circle size={18} className="flex-shrink-0 text-gray-300" />
                )}
                <span className={item.done ? "text-gray-500 line-through" : ""}>{item.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recent videos */}
      <div className="mt-6 rounded-xl border bg-white p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Recent videos</h2>
          <Link href="/content" className="text-sm text-blue-600 hover:underline">
            View all
          </Link>
        </div>
        {overview?.recentVideos.length ? (
          <ul className="divide-y">
            {overview.recentVideos.map((v) => (
              <li key={v.id} className="flex items-center justify-between py-3 text-sm">
                <Link href={`/content/${v.id}`} className="font-medium hover:underline">
                  {v.title}
                </Link>
                <span className="text-xs capitalize text-gray-500">
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
