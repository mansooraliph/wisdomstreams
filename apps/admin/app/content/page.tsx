"use client";

import Link from "next/link";
import { useState } from "react";
import { apiFetch } from "../../lib/api";

export default function AdminContentPage() {
  const [videoId, setVideoId] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const forceDelete = async () => {
    if (!videoId.trim()) return;
    const res = await apiFetch(`/admin/videos/${videoId.trim()}`, { method: "DELETE" });
    setMessage(res.error ? res.error.message : "Video deleted.");
    if (!res.error) setVideoId("");
  };

  return (
    <main className="mx-auto max-w-lg space-y-4 p-6">
      <h1 className="text-xl font-semibold">Content moderation</h1>
      <p className="text-sm text-gray-500">
        The reported-content queue lives on the{" "}
        <Link href="/reports" className="text-blue-600 hover:underline">
          Reports
        </Link>{" "}
        page. Use this to force-delete a video by ID directly (e.g. for legal takedowns).
      </p>
      <div className="flex gap-2">
        <input
          value={videoId}
          onChange={(e) => setVideoId(e.target.value)}
          placeholder="Video ID"
          className="flex-1 rounded border px-3 py-1.5 text-sm"
        />
        <button onClick={forceDelete} className="rounded bg-red-600 px-3 py-1.5 text-sm font-medium text-white">
          Force delete
        </button>
      </div>
      {message && <p className="text-sm text-gray-600">{message}</p>}
    </main>
  );
}
