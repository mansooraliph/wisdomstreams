"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Upload, Trash2, Eye } from "lucide-react";
import type { Channel, StudioVideo } from "@wisdomstream/shared";
import { apiFetch } from "../../lib/api";

const VISIBILITY_STYLE: Record<string, string> = {
  PUBLIC: "bg-green-50 text-green-700",
  UNLISTED: "bg-amber-50 text-amber-700",
  PRIVATE: "bg-gray-100 text-gray-600",
  SCHEDULED: "bg-sky-50 text-sky-700",
};

const STATUS_STYLE: Record<string, string> = {
  ready: "bg-green-50 text-green-700",
  waiting: "bg-amber-50 text-amber-700",
  errored: "bg-red-50 text-red-700",
};

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${className}`}>
      {label.toLowerCase()}
    </span>
  );
}

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

  if (loading) return <p className="p-8 text-sm text-gray-500">Loading...</p>;
  if (!channel) return <p className="p-8 text-sm text-gray-500">Create a channel first.</p>;

  return (
    <main className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Channel content</h1>
        <Link
          href="/upload"
          className="flex items-center gap-1.5 rounded-full bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
        >
          <Upload size={16} />
          Upload video
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white">
        {videos.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">
            No videos yet.{" "}
            <Link href="/upload" className="text-blue-600 hover:underline">
              Upload your first one
            </Link>
            .
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">Video</th>
                <th className="px-4 py-3">Visibility</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Views</th>
                <th className="px-4 py-3">Uploaded</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {videos.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="aspect-video w-24 flex-shrink-0 rounded bg-gray-100">
                        {v.thumbnailUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={v.thumbnailUrl} alt="" className="h-full w-full rounded object-cover" />
                        )}
                      </div>
                      <Link href={`/content/${v.id}`} className="font-medium hover:underline">
                        {v.title}
                      </Link>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge label={v.visibility} className={VISIBILITY_STYLE[v.visibility] ?? "bg-gray-100"} />
                  </td>
                  <td className="px-4 py-3">
                    <Badge label={v.muxStatus} className={STATUS_STYLE[v.muxStatus] ?? "bg-gray-100"} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-gray-600">
                      <Eye size={14} /> {v.viewCount}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{new Date(v.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => deleteVideo(v.id)}
                      className="text-gray-400 hover:text-red-600"
                      title="Delete video"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
