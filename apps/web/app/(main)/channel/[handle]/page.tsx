"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Channel, ChannelAbout, PlaylistSummary, VideoSummary } from "@wisdomstream/shared";
import { apiFetch } from "../../../../lib/api";
import { useAuth } from "../../../../lib/auth-context";

type Tab = "home" | "playlists" | "about";

export default function ChannelPage() {
  const { handle } = useParams<{ handle: string }>();
  const { user } = useAuth();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [videos, setVideos] = useState<VideoSummary[]>([]);
  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([]);
  const [about, setAbout] = useState<ChannelAbout | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [tab, setTab] = useState<Tab>("home");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    const channelRes = await apiFetch<Channel>(`/channels/${handle}`);
    if (channelRes.error || !channelRes.data) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setChannel(channelRes.data);

    const [videosRes, playlistsRes, aboutRes, statusRes] = await Promise.all([
      apiFetch<VideoSummary[]>(`/channels/${channelRes.data.id}/videos`),
      apiFetch<PlaylistSummary[]>(`/channels/${channelRes.data.id}/playlists`),
      apiFetch<ChannelAbout>(`/channels/${channelRes.data.id}/about`),
      apiFetch<{ subscribed: boolean }>(`/channels/${channelRes.data.id}/subscription-status`),
    ]);
    setVideos(videosRes.data ?? []);
    setPlaylists(playlistsRes.data ?? []);
    setAbout(aboutRes.data ?? null);
    setSubscribed(statusRes.data?.subscribed ?? false);
    setLoading(false);
  }, [handle]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleSubscribe = async () => {
    if (!user || !channel) return;
    if (subscribed) {
      await apiFetch(`/channels/${channel.id}/subscribe`, { method: "DELETE" });
      setChannel({ ...channel, subscriberCount: channel.subscriberCount - 1 });
    } else {
      await apiFetch(`/channels/${channel.id}/subscribe`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      setChannel({ ...channel, subscriberCount: channel.subscriberCount + 1 });
    }
    setSubscribed(!subscribed);
  };

  if (loading) return <p className="p-6 text-sm text-gray-500">Loading...</p>;
  if (notFound || !channel) return <p className="p-6 text-sm text-gray-500">Channel not found.</p>;

  return (
    <main className="mx-auto max-w-3xl">
      <div className="h-32 w-full bg-gray-200 sm:h-48">
        {channel.bannerUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={channel.bannerUrl} alt="" className="h-full w-full object-cover" />
        )}
      </div>

      <div className="flex items-end gap-4 px-6 pt-4">
        <div className="-mt-12 h-20 w-20 flex-shrink-0 rounded-full border-4 border-white bg-gray-300 sm:h-24 sm:w-24">
          {channel.avatarUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={channel.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
          )}
        </div>
        <div className="flex-1">
          <h1 className="flex items-center gap-1 text-xl font-semibold">
            {channel.name}
            {channel.isVerified && <span title="Verified">✓</span>}
          </h1>
          <p className="text-sm text-gray-500">
            @{channel.handle} · {channel.subscriberCount} subscriber
            {channel.subscriberCount === 1 ? "" : "s"}
          </p>
        </div>
        {user && user.id !== channel.userId && (
          <button
            onClick={toggleSubscribe}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              subscribed ? "border text-gray-700" : "bg-black text-white"
            }`}
          >
            {subscribed ? "Subscribed" : "Subscribe"}
          </button>
        )}
      </div>

      <nav className="mt-4 flex gap-6 border-b px-6 text-sm">
        {(["home", "playlists", "about"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 py-2 capitalize ${
              tab === t ? "border-black font-medium" : "border-transparent text-gray-500"
            }`}
          >
            {t}
          </button>
        ))}
      </nav>

      <div className="p-6">
        {tab === "home" && (
          <>
            {channel.description && <p className="mb-4 text-sm text-gray-700">{channel.description}</p>}
            {videos.length === 0 ? (
              <p className="text-sm text-gray-500">No videos published yet.</p>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {videos.map((v) => (
                  <div key={v.id}>
                    <div className="aspect-video rounded bg-gray-200" />
                    <p className="mt-1 truncate text-sm font-medium">{v.title}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === "playlists" &&
          (playlists.length === 0 ? (
            <p className="text-sm text-gray-500">No public playlists yet.</p>
          ) : (
            <ul className="divide-y">
              {playlists.map((p) => (
                <li key={p.id} className="py-2 text-sm font-medium">
                  {p.title}
                </li>
              ))}
            </ul>
          ))}

        {tab === "about" && about && (
          <div className="space-y-2 text-sm">
            {about.description && <p>{about.description}</p>}
            {about.category && <p className="text-gray-500">Category: {about.category}</p>}
            <p className="text-gray-500">
              Joined {new Date(about.createdAt).toLocaleDateString()}
            </p>
            {about.socialLinks && Object.keys(about.socialLinks).length > 0 && (
              <div className="flex flex-col gap-1">
                {Object.entries(about.socialLinks).map(
                  ([key, url]) =>
                    url && (
                      <a key={key} href={url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                        {key}
                      </a>
                    ),
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
