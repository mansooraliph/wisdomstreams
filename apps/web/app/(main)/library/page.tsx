"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ListVideo, Heart, Clapperboard, History as HistoryIcon, Settings, ChevronRight } from "lucide-react";
import type { LikedVideoEntry, PlaylistSummary } from "@wisdomstream/shared";
import { apiFetch } from "../../../lib/api";
import { useAuth } from "../../../lib/auth-context";
import { AvatarCircle } from "../../../components/avatar-circle";

const STUDIO_URL = process.env.NEXT_PUBLIC_STUDIO_URL ?? "http://localhost:3002";

const MENU_ITEMS = [
  { href: STUDIO_URL, label: "Your videos", icon: Clapperboard, external: true },
  { href: "/history", label: "History", icon: HistoryIcon, external: false },
  { href: "/settings", label: "Settings", icon: Settings, external: false },
];

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

  const firstPlaylist = playlists[0];
  const firstLikedThumb = liked[0]?.video.thumbnailUrl;

  return (
    <main className="mx-auto max-w-2xl pb-4 sm:space-y-8 sm:p-6">
      {/* Profile header */}
      <div className="flex items-center gap-4 border-b px-4 py-6 sm:border-0 sm:px-0 sm:py-0">
        <AvatarCircle name={user.displayName ?? user.username} imageUrl={user.avatarUrl} size={64} />
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold">{user.displayName ?? user.username}</h1>
          <p className="truncate text-sm text-gray-500">
            @{user.username} · <Link href={`/u/${user.username}`} className="hover:underline">View channel</Link>
          </p>
        </div>
      </div>

      {/* Quick-access playlists row */}
      <section className="space-y-3 px-4 pt-4 sm:px-0">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Playlists</h2>
          <a href="#your-playlists" className="text-sm font-medium text-blue-600">
            View all
          </a>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <a href="#liked-videos" className="block">
            <div className="relative aspect-video overflow-hidden rounded-lg bg-gray-800">
              {firstLikedThumb && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={firstLikedThumb} alt="" className="h-full w-full object-cover opacity-70" />
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <Heart size={28} className="text-white" fill="white" />
              </div>
              <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1.5 py-0.5 text-xs text-white">
                {liked.length} video{liked.length === 1 ? "" : "s"}
              </span>
            </div>
            <p className="mt-1.5 text-sm font-medium">Liked videos</p>
            <p className="text-xs text-gray-500">Private · Playlist</p>
          </a>

          <a href="#your-playlists" className="block">
            <div className="relative aspect-video overflow-hidden rounded-lg bg-gray-200">
              <div className="absolute inset-0 flex items-center justify-center">
                <ListVideo size={28} className="text-gray-500" />
              </div>
              {firstPlaylist && (
                <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1.5 py-0.5 text-xs text-white">
                  {firstPlaylist.videoIds.length} video{firstPlaylist.videoIds.length === 1 ? "" : "s"}
                </span>
              )}
            </div>
            <p className="mt-1.5 truncate text-sm font-medium">
              {firstPlaylist ? firstPlaylist.title : "Create a playlist"}
            </p>
            <p className="text-xs text-gray-500">
              {firstPlaylist ? `${firstPlaylist.visibility.toLowerCase()} · Playlist` : "No playlists yet"}
            </p>
          </a>
        </div>
      </section>

      {/* Menu list */}
      <nav className="mt-4 border-y sm:mt-0 sm:rounded-lg sm:border">
        {MENU_ITEMS.map(({ href, label, icon: Icon, external }) =>
          external ? (
            <a
              key={label}
              href={href}
              className="flex items-center gap-4 border-b px-4 py-3 text-sm last:border-b-0 hover:bg-gray-50"
            >
              <Icon size={20} className="text-gray-700" />
              <span className="flex-1">{label}</span>
              <ChevronRight size={18} className="text-gray-400" />
            </a>
          ) : (
            <Link
              key={label}
              href={href}
              className="flex items-center gap-4 border-b px-4 py-3 text-sm last:border-b-0 hover:bg-gray-50"
            >
              <Icon size={20} className="text-gray-700" />
              <span className="flex-1">{label}</span>
              <ChevronRight size={18} className="text-gray-400" />
            </Link>
          )
        )}
      </nav>

      {/* Full playlist management */}
      <section id="your-playlists" className="scroll-mt-16 space-y-3 px-4 pt-6 sm:px-0">
        <h2 className="text-sm font-semibold">Your playlists</h2>
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

      <section id="liked-videos" className="scroll-mt-16 space-y-3 px-4 pt-6 sm:px-0">
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
