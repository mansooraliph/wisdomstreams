"use client";

import { useCallback, useEffect, useRef, useState, type ElementRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import MuxPlayer from "@mux/mux-player-react";
import { Gauge } from "lucide-react";
import type { VideoDetail, VideoSummary } from "@wisdomstream/shared";
import { apiFetch } from "../../../../lib/api";
import { useAuth } from "../../../../lib/auth-context";
import { VideoCard } from "../../../../components/feed/video-card";
import { CommentList } from "../../../../components/comments/comment-list";

const PROGRESS_SAVE_INTERVAL_MS = 10_000;
const PLAYBACK_RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export default function WatchPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [video, setVideo] = useState<VideoDetail | null>(null);
  const [related, setRelated] = useState<VideoSummary[]>([]);
  const [startTime, setStartTime] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const hasRecordedView = useRef(false);
  const lastSavedProgress = useRef(0);
  const playerRef = useRef<ElementRef<typeof MuxPlayer>>(null);
  const [reaction, setReaction] = useState<"like" | "dislike" | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [speedMenuOpen, setSpeedMenuOpen] = useState(false);

  const changePlaybackRate = (rate: number) => {
    if (playerRef.current) playerRef.current.playbackRate = rate;
    setPlaybackRate(rate);
    setSpeedMenuOpen(false);
  };

  useEffect(() => {
    setPlaybackRate(1);
    (async () => {
      const videoRes = await apiFetch<VideoDetail>(`/videos/${id}`);
      if (videoRes.error || !videoRes.data) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setVideo(videoRes.data);

      const relatedRes = await apiFetch<VideoSummary[]>(`/videos/${id}/related`);
      setRelated(relatedRes.data ?? []);

      if (user) {
        const progressRes = await apiFetch<{ progress: number }>(`/videos/${id}/progress`);
        if (progressRes.data?.progress) setStartTime(progressRes.data.progress);
      }

      setLoading(false);
    })();
  }, [id, user]);

  const onTimeUpdate = useCallback(
    (currentTime: number) => {
      if (!hasRecordedView.current && currentTime > 10) {
        hasRecordedView.current = true;
        apiFetch(`/videos/${id}/view`, { method: "POST" });
      }

      if (user && currentTime - lastSavedProgress.current > PROGRESS_SAVE_INTERVAL_MS / 1000) {
        lastSavedProgress.current = currentTime;
        apiFetch(`/videos/${id}/progress`, {
          method: "POST",
          body: JSON.stringify({ progress: currentTime }),
        });
      }
    },
    [id, user],
  );

  const react = async (kind: "like" | "dislike") => {
    if (!user) return;
    if (reaction === kind) {
      await apiFetch(`/videos/${id}/like`, { method: "DELETE" });
      setReaction(null);
    } else {
      await apiFetch(`/videos/${id}/${kind}`, { method: "POST" });
      setReaction(kind);
    }
  };

  if (loading) return <p className="p-6 text-sm text-gray-500">Loading...</p>;
  if (notFound || !video) return <p className="p-6 text-sm text-gray-500">Video not found.</p>;

  return (
    <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 p-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        {video.muxStatus !== "ready" || !video.muxPlaybackId ? (
          <div className="flex aspect-video items-center justify-center rounded bg-black text-sm text-white">
            {video.muxStatus === "errored" ? "This video failed to process." : "Processing video..."}
          </div>
        ) : (
          <MuxPlayer
            ref={playerRef}
            playbackId={video.muxPlaybackId}
            startTime={startTime}
            streamType="on-demand"
            autoPlay="any"
            metadata={{ video_title: video.title }}
            style={{ aspectRatio: "16/9", width: "100%" }}
            onTimeUpdate={(e) => onTimeUpdate((e.target as HTMLMediaElement).currentTime)}
          />
        )}

        {/* Mux Player's built-in speed menu hides itself below ~470px width —
            narrower than almost every phone — so it's effectively invisible
            on mobile. This gives mobile viewers an always-visible substitute;
            desktop keeps using the native control. */}
        {video.muxStatus === "ready" && video.muxPlaybackId && (
          <div className="relative sm:hidden">
            <button
              onClick={() => setSpeedMenuOpen((o) => !o)}
              className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm"
            >
              <Gauge size={16} />
              {playbackRate}x
            </button>
            {speedMenuOpen && (
              <div
                onMouseLeave={() => setSpeedMenuOpen(false)}
                className="absolute left-0 top-10 z-10 w-28 rounded-xl border bg-white py-1 shadow-lg"
              >
                {PLAYBACK_RATES.map((rate) => (
                  <button
                    key={rate}
                    onClick={() => changePlaybackRate(rate)}
                    className={`block w-full px-4 py-1.5 text-left text-sm hover:bg-gray-50 ${
                      rate === playbackRate ? "font-semibold text-blue-600" : ""
                    }`}
                  >
                    {rate === 1 ? "Normal" : `${rate}x`}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">{video.title}</h1>
            <p className="text-sm text-gray-500">
              <Link href={`/channel/${video.channel.handle}`} className="hover:underline">
                {video.channel.name}
              </Link>{" "}
              · {video.viewCount} views
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => react("like")}
              className={`rounded-full border px-3 py-1.5 text-sm ${
                reaction === "like" ? "border-blue-600 bg-blue-50 text-blue-600" : ""
              }`}
            >
              👍 {video.likeCount}
            </button>
            <button
              onClick={() => react("dislike")}
              className={`rounded-full border px-3 py-1.5 text-sm ${
                reaction === "dislike" ? "border-gray-600 bg-gray-100" : ""
              }`}
            >
              👎
            </button>
          </div>
        </div>

        {video.description && (
          <p className="whitespace-pre-wrap rounded bg-gray-50 p-3 text-sm text-gray-700">
            {video.description}
          </p>
        )}

        <CommentList videoId={video.id} />
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold">Up next</h2>
        {related.length === 0 ? (
          <p className="text-sm text-gray-500">No related videos yet.</p>
        ) : (
          <div className="space-y-3">
            {related.map((v) => (
              <VideoCard key={v.id} video={v} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
