"use client";

import { useEffect, useState } from "react";
import type { VideoSummary } from "@wisdomstream/shared";
import { apiFetch } from "../../../lib/api";
import { useAuth } from "../../../lib/auth-context";
import { VideoCard } from "../../../components/feed/video-card";

export default function SubscriptionsPage() {
  const { user, loading: authLoading } = useAuth();
  const [videos, setVideos] = useState<VideoSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    apiFetch<VideoSummary[]>("/feed/subscriptions").then((res) => {
      setVideos(res.data ?? []);
      setLoading(false);
    });
  }, [user]);

  if (authLoading) return null;
  if (!user) return <p className="p-6 text-sm text-gray-500">Sign in to see your subscriptions.</p>;

  return (
    <main className="p-6">
      <h1 className="mb-4 text-xl font-semibold">Subscriptions</h1>
      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : videos.length === 0 ? (
        <p className="text-sm text-gray-500">
          No new videos from channels you subscribe to yet.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {videos.map((v) => (
            <VideoCard key={v.id} video={v} />
          ))}
        </div>
      )}
    </main>
  );
}
