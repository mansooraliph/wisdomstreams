"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { PlaylistSummary } from "@wisdomstream/shared";
import { apiFetch } from "../../../../lib/api";
import { useAuth } from "../../../../lib/auth-context";

export default function PlaylistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [playlist, setPlaylist] = useState<PlaylistSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    const res = await apiFetch<PlaylistSummary>(`/users/me/playlists/${id}`);
    if (res.error) {
      setNotFound(true);
    } else {
      setPlaylist(res.data);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  const removeVideo = async (videoId: string) => {
    const res = await apiFetch<PlaylistSummary>(`/users/me/playlists/${id}/videos/${videoId}`, {
      method: "DELETE",
    });
    if (res.data) setPlaylist(res.data);
  };

  const deletePlaylist = async () => {
    await apiFetch(`/users/me/playlists/${id}`, { method: "DELETE" });
    router.push("/library");
  };

  if (authLoading) return null;
  if (!user) return <p className="p-6 text-sm text-gray-500">Sign in to view this playlist.</p>;
  if (loading) return <p className="p-6 text-sm text-gray-500">Loading...</p>;
  if (notFound || !playlist) return <p className="p-6 text-sm text-gray-500">Playlist not found.</p>;

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{playlist.title}</h1>
          {playlist.description && <p className="text-sm text-gray-500">{playlist.description}</p>}
          <p className="text-xs text-gray-400">
            {playlist.videoIds.length} video{playlist.videoIds.length === 1 ? "" : "s"} ·{" "}
            {playlist.visibility}
          </p>
        </div>
        <button onClick={deletePlaylist} className="text-sm text-red-600 hover:underline">
          Delete playlist
        </button>
      </div>

      {playlist.videoIds.length === 0 ? (
        <p className="text-sm text-gray-500">No videos in this playlist yet.</p>
      ) : (
        <ul className="divide-y">
          {playlist.videoIds.map((videoId) => (
            <li key={videoId} className="flex items-center gap-3 py-3">
              <div className="h-16 w-28 flex-shrink-0 rounded bg-gray-200" />
              <Link href={`/watch/${videoId}`} className="flex-1 truncate text-sm font-medium hover:underline">
                {videoId}
              </Link>
              <button
                onClick={() => removeVideo(videoId)}
                className="text-xs text-gray-500 hover:underline"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
