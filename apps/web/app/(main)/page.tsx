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
    <main className="pb-4 sm:p-6">
      {loading ? (
        <p className="p-4 text-sm text-gray-500 sm:p-0">Loading...</p>
      ) : videos.length === 0 ? (
        <p className="p-4 text-sm text-gray-500 sm:p-0">No videos yet. Check back soon.</p>
      ) : (
        <div className="grid grid-cols-1 gap-0 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-8 lg:grid-cols-4">
          {videos.map((v) => (
            <VideoCard key={v.id} video={v} />
          ))}
        </div>
      )}
    </main>
  );
}
