"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { LikedVideoEntry, PlaylistSummary } from "@wisdomstream/shared";
import { apiFetch } from "../../../lib/api";
import { useAuth } from "../../../lib/auth-context";

export default function LibraryPage() {
  const { user, loading: authLoading } = useAuth();
  const [liked, setLiked] = useState<LikedVideoEntry[]>([]);
  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    const [likedRes, playlistsRes] = await Promise.all([
      apiFetch<LikedVideoEntry[]>("/users/me/liked-videos"),
      apiFetch<PlaylistSummary[]>("/users/me/playlists"),
    ]);
    setLiked(likedRes.data ?? []);
    setPlaylists(playlistsRes.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  const createPlaylist = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    const res = await apiFetch<PlaylistSummary>("/users/me/playlists", {
      method: "POST",
      body: JSON.stringify({ title: newTitle.trim() }),
    });
    setCreating(false);
    if (res.data) {
      setPlaylists((prev) => [res.data!, ...prev]);
      setNewTitle("");
    }
  };

  if (authLoading) return null;
  if (!user) return <p className="p-6 text-sm text-gray-500">Sign in to view your library.</p>;

  return (
    <main className="mx-auto max-w-2xl space-y-8 p-6">
      <h1 className="text-xl font-semibold">Library</h1>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Playlists</h2>
        </div>
        <div className="flex gap-2">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="New playlist name"
            className="flex-1 rounded border px-3 py-1.5 text-sm"
          />
          <button
            onClick={createPlaylist}
            disabled={creating}
            className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            Create
          </button>
        </div>
        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : playlists.length === 0 ? (
          <p className="text-sm text-gray-500">No playlists yet.</p>
        ) : (
          <ul className="divide-y">
            {playlists.map((p) => (
              <li key={p.id} className="py-2">
                <Link href={`/playlist/${p.id}`} className="text-sm font-medium hover:underline">
                  {p.title}
                </Link>
                <span className="ml-2 text-xs text-gray-500">
                  {p.videoIds.length} video{p.videoIds.length === 1 ? "" : "s"} · {p.visibility}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Liked videos</h2>
        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : liked.length === 0 ? (
          <p className="text-sm text-gray-500">No liked videos yet.</p>
        ) : (
          <ul className="divide-y">
            {liked.map((entry) => (
              <li key={entry.id} className="flex items-center gap-3 py-3">
                <div className="h-16 w-28 flex-shrink-0 rounded bg-gray-200" />
                <Link href={`/watch/${entry.video.id}`} className="truncate text-sm font-medium hover:underline">
                  {entry.video.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
