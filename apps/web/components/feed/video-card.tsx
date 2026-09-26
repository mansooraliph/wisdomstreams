import Link from "next/link";
import type { VideoSummary } from "@wisdomstream/shared";

function formatDuration(seconds: number | null): string {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function VideoCard({ video }: { video: VideoSummary }) {
  return (
    <Link href={`/watch/${video.id}`} className="block">
      <div className="relative aspect-video overflow-hidden rounded-lg bg-gray-200">
        {video.thumbnailUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={video.thumbnailUrl} alt="" className="h-full w-full object-cover" />
        )}
        {video.duration != null && (
          <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 text-xs text-white">
            {formatDuration(video.duration)}
          </span>
        )}
      </div>
      <p className="mt-2 line-clamp-2 text-sm font-medium">{video.title}</p>
      <p className="text-xs text-gray-500">{video.viewCount} views</p>
    </Link>
  );
}
