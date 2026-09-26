"use client";

import { useCallback, useEffect, useState } from "react";
import type { Channel, PlaylistSummary, Visibility } from "@wisdomstream/shared";
import { apiFetch } from "../../lib/api";

export default function PlaylistsPage() {
  const [channel, setChannel] = useState<Channel | null>(null);
  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");

  const load = useCallback(async () => {
    const channelRes = await apiFetch<Channel[]>("/channels/me");
    const ch = channelRes.data?.[0] ?? null;
    setChannel(ch);
    if (ch) {
      const res = await apiFetch<PlaylistSummary[]>(`/channels/${ch.id}/playlists/mine`);
      setPlaylists(res.data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createPlaylist = async () => {
    if (!channel || !newTitle.trim()) return;
    const res = await apiFetch<PlaylistSummary>(`/channels/${channel.id}/playlists`, {
      method: "POST",
      body: JSON.stringify({ title: newTitle.trim() }),
    });
    if (res.data) {
      setPlaylists((prev) => [res.data!, ...prev]);
      setNewTitle("");
    }
  };

  const setVisibility = async (playlistId: string, visibility: Visibility) => {
    if (!channel) return;
    const res = await apiFetch<PlaylistSummary>(`/channels/${channel.id}/playlists/${playlistId}`, {
      method: "PATCH",
      body: JSON.stringify({ visibility }),
    });
    if (res.data) {
      setPlaylists((prev) => prev.map((p) => (p.id === playlistId ? res.data! : p)));
    }
  };

  const deletePlaylist = async (playlistId: string) => {
    if (!channel) return;
    await apiFetch(`/channels/${channel.id}/playlists/${playlistId}`, { method: "DELETE" });
    setPlaylists((prev) => prev.filter((p) => p.id !== playlistId));
  };

  if (loading) return <p className="p-6 text-sm text-gray-500">Loading...</p>;
  if (!channel) return <p className="p-6 text-sm text-gray-500">Create a channel first.</p>;

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-6">
      <h1 className="text-xl font-semibold">Playlists</h1>

      <div className="flex gap-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New playlist name"
          className="flex-1 rounded border px-3 py-1.5 text-sm"
        />
        <button
          onClick={createPlaylist}
          className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white"
        >
          Create
        </button>
      </div>

      {playlists.length === 0 ? (
        <p className="text-sm text-gray-500">No playlists yet.</p>
      ) : (
        <ul className="divide-y">
          {playlists.map((p) => (
            <li key={p.id} className="flex items-center justify-between py-2 text-sm">
              <div>
                <p className="font-medium">{p.title}</p>
                <p className="text-xs text-gray-500">
                  {p.videoIds.length} video{p.videoIds.length === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={p.visibility}
                  onChange={(e) => setVisibility(p.id, e.target.value as Visibility)}
                  className="rounded border px-2 py-1 text-xs"
                >
                  <option value="PUBLIC">Public</option>
                  <option value="UNLISTED">Unlisted</option>
                  <option value="PRIVATE">Private</option>
                </select>
                <button onClick={() => deletePlaylist(p.id)} className="text-xs text-red-600 hover:underline">
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
