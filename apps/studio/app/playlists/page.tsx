"use client";

import { useCallback, useEffect, useState } from "react";
import { ListVideo, Plus, Trash2 } from "lucide-react";
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

  if (loading) return <p className="p-8 text-sm text-gray-500">Loading...</p>;
  if (!channel) return <p className="p-8 text-sm text-gray-500">Create a channel first.</p>;

  return (
    <main className="p-8">
      <h1 className="mb-6 text-2xl font-bold">Playlists</h1>

      <div className="mb-6 flex gap-2 rounded-xl border bg-white p-4">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && createPlaylist()}
          placeholder="New playlist name"
          className="flex-1 rounded-full border px-4 py-2 text-sm"
        />
        <button
          onClick={createPlaylist}
          className="flex items-center gap-1.5 rounded-full bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
        >
          <Plus size={16} />
          Create
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white">
        {playlists.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">No playlists yet.</p>
        ) : (
          <ul className="divide-y">
            {playlists.map((p) => (
              <li key={p.id} className="flex items-center justify-between px-5 py-4 text-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                    <ListVideo size={18} />
                  </div>
                  <div>
                    <p className="font-medium">{p.title}</p>
                    <p className="text-xs text-gray-500">
                      {p.videoIds.length} video{p.videoIds.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={p.visibility}
                    onChange={(e) => setVisibility(p.id, e.target.value as Visibility)}
                    className="rounded-full border px-3 py-1 text-xs"
                  >
                    <option value="PUBLIC">Public</option>
                    <option value="UNLISTED">Unlisted</option>
                    <option value="PRIVATE">Private</option>
                  </select>
                  <button onClick={() => deletePlaylist(p.id)} className="text-gray-400 hover:text-red-600">
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
