"use client";

import { useEffect, useState } from "react";
import type { VideoSummary } from "@wisdomstream/shared";
import { apiFetch } from "../../lib/api";
import { VideoCard } from "../../components/feed/video-card";

export default function HomePage() {
  const [videos, setVideos] = useState<VideoSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<VideoSummary[]>("/feed").then((res) => {
      setVideos(res.data ?? []);
      setLoading(false);
    });
  }, []);

  return (
    <main className="p-6">
      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : videos.length === 0 ? (
        <p className="text-sm text-gray-500">No videos yet. Check back soon.</p>
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
