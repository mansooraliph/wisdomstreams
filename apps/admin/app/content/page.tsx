"use client";

import Link from "next/link";
import { useState } from "react";
import { ShieldAlert, Trash2 } from "lucide-react";
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
    <main className="mx-auto max-w-lg space-y-4 p-8">
      <h1 className="flex items-center gap-2 text-2xl font-bold">
        <ShieldAlert size={22} className="text-amber-500" />
        Content moderation
      </h1>

      <div className="rounded-xl border bg-white p-6">
        <p className="text-sm text-gray-500">
          The reported-content queue lives on the{" "}
          <Link href="/reports" className="text-blue-600 hover:underline">
            Reports
          </Link>{" "}
          page. Use this to force-delete a video by ID directly (e.g. for legal takedowns).
        </p>
        <div className="mt-4 flex gap-2">
          <input
            value={videoId}
            onChange={(e) => setVideoId(e.target.value)}
            placeholder="Video ID"
            className="flex-1 rounded-full border px-4 py-2 text-sm"
          />
          <button
            onClick={forceDelete}
            className="flex items-center gap-1.5 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            <Trash2 size={14} /> Force delete
          </button>
        </div>
        {message && <p className="mt-3 text-sm text-gray-600">{message}</p>}
      </div>
    </main>
  );
}
