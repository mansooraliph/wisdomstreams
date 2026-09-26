"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, Film, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
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

const STATUS_LABEL: Record<QueueStatus, string> = {
  uploading: "Uploading",
  processing: "Processing",
  ready: "Ready",
  errored: "Failed",
};

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
    return <p className="p-8 text-sm text-gray-500">Create a channel first to upload videos.</p>;
  }

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-8">
      <h1 className="text-2xl font-bold">Upload videos</h1>

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
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-14 text-center transition-colors ${
          dragActive ? "border-black bg-gray-50" : "border-gray-300 bg-white hover:bg-gray-50"
        }`}
      >
        <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-sky-100">
          <UploadCloud size={28} className="text-sky-500" />
        </div>
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
            <li key={item.key} className="rounded-xl border bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                  <Film size={18} />
                </div>
                <input
                  value={item.title}
                  onChange={(e) => updateItem(item.key, { title: e.target.value })}
                  onBlur={() => saveTitle(item)}
                  disabled={item.status === "uploading"}
                  className="flex-1 rounded-lg border px-3 py-1.5 text-sm"
                />
                <span
                  className={`flex flex-shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${
                    item.status === "ready"
                      ? "bg-green-50 text-green-700"
                      : item.status === "errored"
                        ? "bg-red-50 text-red-700"
                        : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {item.status === "ready" && <CheckCircle2 size={12} />}
                  {item.status === "errored" && <XCircle size={12} />}
                  {item.status === "uploading" ? `${item.progress}%` : STATUS_LABEL[item.status]}
                </span>
              </div>
              {item.status === "uploading" && (
                <div className="mt-3 h-1.5 w-full rounded-full bg-gray-100">
                  <div
                    className="h-1.5 rounded-full bg-black transition-all"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              )}
              {item.error && <p className="mt-2 text-xs text-red-600">{item.error}</p>}
              {item.status === "ready" && item.videoId && (
                <button
                  onClick={() => router.push(`/content/${item.videoId}`)}
                  className="mt-3 flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
                >
                  Edit details <ArrowRight size={12} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
