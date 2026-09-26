"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Channel, VideoUploadStatus } from "@wisdomstream/shared";
import { apiFetch } from "../../lib/api";
import { uploadVideoFile } from "../../lib/upload-video";

type QueueStatus = "uploading" | "processing" | "ready" | "errored";

interface QueueItem {
  key: string;
  file: File;
  progress: number;
  status: QueueStatus;
  videoId?: string;
  title: string;
  error?: string;
}

export default function UploadPage() {
  const router = useRouter();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiFetch<Channel[]>("/channels/me").then((res) => setChannel(res.data?.[0] ?? null));
  }, []);

  const updateItem = useCallback((key: string, patch: Partial<QueueItem>) => {
    setQueue((prev) => prev.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  }, []);

  const pollStatus = useCallback(
    (key: string, videoId: string) => {
      const interval = setInterval(async () => {
        const res = await apiFetch<VideoUploadStatus>(`/videos/${videoId}/upload-status`);
        if (!res.data) return;
        if (res.data.muxStatus === "ready") {
          updateItem(key, { status: "ready" });
          clearInterval(interval);
        } else if (res.data.muxStatus === "errored") {
          updateItem(key, { status: "errored", error: "Mux failed to process this video" });
          clearInterval(interval);
        }
      }, 4000);
    },
    [updateItem],
  );

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      if (!channel) return;
      Array.from(files).forEach((file) => {
        const key = `${file.name}-${file.size}-${Date.now()}`;
        setQueue((prev) => [
          ...prev,
          { key, file, progress: 0, status: "uploading", title: file.name.replace(/\.[^.]+$/, "") },
        ]);

        uploadVideoFile(channel.id, file, (percent) => updateItem(key, { progress: percent }))
          .then((handle) => {
            updateItem(key, { videoId: handle.videoId, status: "processing", progress: 100 });
            pollStatus(key, handle.videoId);
          })
          .catch((err) => {
            updateItem(key, { status: "errored", error: err.message });
          });
      });
    },
    [channel, pollStatus, updateItem],
  );

  const saveTitle = async (item: QueueItem) => {
    if (!item.videoId) return;
    await apiFetch(`/videos/${item.videoId}/metadata`, {
      method: "PATCH",
      body: JSON.stringify({ title: item.title }),
    });
  };

  if (!channel) {
    return <p className="p-6 text-sm text-gray-500">Create a channel first to upload videos.</p>;
  }

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="text-xl font-semibold">Upload videos</h1>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded border-2 border-dashed p-10 text-center ${
          dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
        }`}
      >
        <p className="text-sm font-medium">Drag and drop video files here</p>
        <p className="text-xs text-gray-500">or click to browse</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
      </div>

      {queue.length > 0 && (
        <ul className="space-y-3">
          {queue.map((item) => (
            <li key={item.key} className="rounded border p-3">
              <div className="flex items-center justify-between gap-3">
                <input
                  value={item.title}
                  onChange={(e) => updateItem(item.key, { title: e.target.value })}
                  onBlur={() => saveTitle(item)}
                  disabled={item.status === "uploading"}
                  className="flex-1 rounded border px-2 py-1 text-sm"
                />
                <span className="whitespace-nowrap text-xs capitalize text-gray-500">
                  {item.status === "uploading" ? `${item.progress}%` : item.status}
                </span>
              </div>
              {item.status === "uploading" && (
                <div className="mt-2 h-1.5 w-full rounded bg-gray-200">
                  <div
                    className="h-1.5 rounded bg-blue-600 transition-all"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              )}
              {item.error && <p className="mt-1 text-xs text-red-600">{item.error}</p>}
              {item.status === "ready" && item.videoId && (
                <button
                  onClick={() => router.push(`/content/${item.videoId}`)}
                  className="mt-2 text-xs text-blue-600 hover:underline"
                >
                  Edit details →
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
