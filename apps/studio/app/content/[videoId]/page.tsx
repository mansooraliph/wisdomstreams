"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Chapter, CommentThread, StudioVideo, Visibility } from "@wisdomstream/shared";
import { apiFetch, apiUpload } from "../../../lib/api";

interface MetadataForm {
  title: string;
  description: string;
  tagsInput: string;
  category: string;
  language: string;
}

export default function VideoDetailPage() {
  const { videoId } = useParams<{ videoId: string }>();
  const [video, setVideo] = useState<StudioVideo | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [scheduledAtInput, setScheduledAtInput] = useState("");
  const [comments, setComments] = useState<CommentThread[]>([]);

  const load = useCallback(async () => {
    const [videoRes, commentsRes] = await Promise.all([
      apiFetch<StudioVideo>(`/videos/${videoId}`),
      apiFetch<CommentThread[]>(`/videos/${videoId}/comments?sort=new`),
    ]);
    setVideo(videoRes.data);
    setComments(commentsRes.data ?? []);
    setLoading(false);
  }, [videoId]);

  useEffect(() => {
    load();
  }, [load]);

  const pinComment = async (commentId: string) => {
    await apiFetch(`/comments/${commentId}/pin`, { method: "POST" });
    setComments((prev) => prev.map((c) => ({ ...c, isPinned: c.id === commentId })));
  };

  const deleteComment = async (commentId: string) => {
    await apiFetch(`/comments/${commentId}`, { method: "DELETE" });
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<MetadataForm>();

  useEffect(() => {
    if (video) {
      reset({
        title: video.title,
        description: video.description ?? "",
        tagsInput: video.tags.join(", "),
        category: video.category ?? "",
        language: video.language ?? "",
      });
      setChapters([]); // chapters are fetched separately below
    }
  }, [video, reset]);

  const onSaveMetadata = async (data: MetadataForm) => {
    setSaved(false);
    const tags = data.tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const res = await apiFetch<StudioVideo>(`/videos/${videoId}/metadata`, {
      method: "PATCH",
      body: JSON.stringify({
        title: data.title,
        description: data.description || undefined,
        tags,
        category: data.category || undefined,
        language: data.language || undefined,
      }),
    });
    if (res.data) {
      setVideo(res.data);
      setSaved(true);
    }
  };

  const changeVisibility = async (visibility: Visibility, scheduledAt?: string) => {
    const res = await apiFetch<StudioVideo>(`/videos/${videoId}/visibility`, {
      method: "PATCH",
      body: JSON.stringify({ visibility, scheduledAt }),
    });
    if (res.data) setVideo(res.data);
  };

  const uploadThumbnail = async (file: File) => {
    setUploadingThumb(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await apiUpload<StudioVideo>(`/videos/${videoId}/thumbnail`, formData);
    setUploadingThumb(false);
    if (res.data) setVideo(res.data);
  };

  const addChapter = () => setChapters((prev) => [...prev, { id: "", videoId: "", title: "", startTime: 0 }]);
  const updateChapter = (index: number, patch: Partial<Chapter>) =>
    setChapters((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  const removeChapter = (index: number) => setChapters((prev) => prev.filter((_, i) => i !== index));

  const saveChapters = async () => {
    await apiFetch(`/videos/${videoId}/chapters`, {
      method: "PATCH",
      body: JSON.stringify({
        chapters: chapters.map((c) => ({ title: c.title, startTime: Number(c.startTime) })),
      }),
    });
  };

  if (loading) return <p className="p-6 text-sm text-gray-500">Loading...</p>;
  if (!video) return <p className="p-6 text-sm text-gray-500">Video not found.</p>;

  return (
    <main className="mx-auto max-w-2xl space-y-8 p-6">
      <div>
        <h1 className="text-xl font-semibold">{video.title}</h1>
        <p className="text-xs text-gray-500 capitalize">Processing status: {video.muxStatus}</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Thumbnail</h2>
        <div className="aspect-video w-64 rounded bg-gray-200">
          {video.thumbnailUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={video.thumbnailUrl} alt="" className="h-full w-full rounded object-cover" />
          )}
        </div>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => e.target.files?.[0] && uploadThumbnail(e.target.files[0])}
          className="text-xs"
        />
        {uploadingThumb && <p className="text-xs text-gray-500">Uploading...</p>}
      </section>

      <form onSubmit={handleSubmit(onSaveMetadata)} className="space-y-3">
        <h2 className="text-sm font-semibold">Metadata</h2>
        <div>
          <label className="mb-1 block text-sm font-medium">Title</label>
          <input className="w-full rounded border px-3 py-2 text-sm" {...register("title")} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Description</label>
          <textarea rows={4} className="w-full rounded border px-3 py-2 text-sm" {...register("description")} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Tags (comma separated)</label>
          <input className="w-full rounded border px-3 py-2 text-sm" {...register("tagsInput")} />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium">Category</label>
            <input className="w-full rounded border px-3 py-2 text-sm" {...register("category")} />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium">Language</label>
            <input className="w-full rounded border px-3 py-2 text-sm" {...register("language")} />
          </div>
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : "Save metadata"}
        </button>
        {saved && <p className="text-sm text-green-600">Saved.</p>}
      </form>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Visibility</h2>
        <div className="flex flex-wrap items-center gap-2">
          {(["PUBLIC", "UNLISTED", "PRIVATE"] as const).map((v) => (
            <button
              key={v}
              onClick={() => changeVisibility(v)}
              className={`rounded border px-3 py-1.5 text-sm capitalize ${
                video.visibility === v ? "border-blue-600 bg-blue-50 text-blue-600" : ""
              }`}
            >
              {v.toLowerCase()}
            </button>
          ))}
          <input
            type="datetime-local"
            value={scheduledAtInput}
            onChange={(e) => setScheduledAtInput(e.target.value)}
            className="rounded border px-2 py-1.5 text-sm"
          />
          <button
            onClick={() => scheduledAtInput && changeVisibility("SCHEDULED", new Date(scheduledAtInput).toISOString())}
            disabled={!scheduledAtInput}
            className={`rounded border px-3 py-1.5 text-sm disabled:opacity-50 ${
              video.visibility === "SCHEDULED" ? "border-blue-600 bg-blue-50 text-blue-600" : ""
            }`}
          >
            Schedule
          </button>
        </div>
        {video.visibility === "SCHEDULED" && video.scheduledAt && (
          <p className="text-xs text-gray-500">
            Scheduled for {new Date(video.scheduledAt).toLocaleString()}
          </p>
        )}
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Chapters</h2>
          <button onClick={addChapter} className="text-xs text-blue-600 hover:underline">
            + Add chapter
          </button>
        </div>
        {chapters.map((c, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="number"
              placeholder="Seconds"
              value={c.startTime}
              onChange={(e) => updateChapter(i, { startTime: Number(e.target.value) })}
              className="w-24 rounded border px-2 py-1 text-sm"
            />
            <input
              placeholder="Chapter title"
              value={c.title}
              onChange={(e) => updateChapter(i, { title: e.target.value })}
              className="flex-1 rounded border px-2 py-1 text-sm"
            />
            <button onClick={() => removeChapter(i)} className="text-xs text-red-600">
              Remove
            </button>
          </div>
        ))}
        {chapters.length > 0 && (
          <button
            onClick={saveChapters}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white"
          >
            Save chapters
          </button>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Comments</h2>
        {comments.length === 0 ? (
          <p className="text-sm text-gray-500">No comments yet.</p>
        ) : (
          <ul className="divide-y">
            {comments.map((c) => (
              <li key={c.id} className="py-2 text-sm">
                <p className="font-medium">
                  {c.user.displayName ?? c.user.username}
                  {c.isPinned && <span className="ml-2 text-xs text-gray-500">Pinned</span>}
                </p>
                <p className="text-gray-700">{c.body}</p>
                <div className="mt-1 flex gap-3 text-xs text-blue-600">
                  <button onClick={() => pinComment(c.id)}>{c.isPinned ? "Pinned" : "Pin"}</button>
                  <button onClick={() => deleteComment(c.id)} className="text-red-600">
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
