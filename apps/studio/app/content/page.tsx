"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Channel, StudioVideo } from "@wisdomstream/shared";
import { apiFetch } from "../../lib/api";

export default function ContentPage() {
  const [channel, setChannel] = useState<Channel | null>(null);
  const [videos, setVideos] = useState<StudioVideo[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const channelRes = await apiFetch<Channel[]>("/channels/me");
    const ch = channelRes.data?.[0] ?? null;
    setChannel(ch);
    if (ch) {
      const videosRes = await apiFetch<StudioVideo[]>(`/videos?channelId=${ch.id}`);
      setVideos(videosRes.data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const deleteVideo = async (id: string) => {
    await apiFetch(`/videos/${id}`, { method: "DELETE" });
    setVideos((prev) => prev.filter((v) => v.id !== id));
  };

  if (loading) return <p className="p-6 text-sm text-gray-500">Loading...</p>;
  if (!channel) return <p className="p-6 text-sm text-gray-500">Create a channel first.</p>;

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Content</h1>
        <Link href="/upload" className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white">
          Upload video
        </Link>
      </div>

      {videos.length === 0 ? (
        <p className="text-sm text-gray-500">No videos yet.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-gray-500">
              <th className="py-2">Title</th>
              <th className="py-2">Visibility</th>
              <th className="py-2">Status</th>
              <th className="py-2">Views</th>
              <th className="py-2">Uploaded</th>
              <th />
            </tr>
          </thead>
          <tbody className="divide-y">
            {videos.map((v) => (
              <tr key={v.id}>
                <td className="py-2">
                  <Link href={`/content/${v.id}`} className="font-medium hover:underline">
                    {v.title}
                  </Link>
                </td>
                <td className="py-2 capitalize">{v.visibility.toLowerCase()}</td>
                <td className="py-2 capitalize">{v.muxStatus}</td>
                <td className="py-2">{v.viewCount}</td>
                <td className="py-2 text-gray-500">{new Date(v.createdAt).toLocaleDateString()}</td>
                <td className="py-2 text-right">
                  <button onClick={() => deleteVideo(v.id)} className="text-xs text-red-600 hover:underline">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
