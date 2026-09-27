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
    <Link href={`/watch/${video.id}`} className="block border-b pb-3 sm:border-0 sm:pb-0">
      <div className="relative aspect-video overflow-hidden bg-gray-200 sm:rounded-lg">
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
      <div className="px-3 pt-2 sm:px-0">
        <p className="line-clamp-2 text-sm font-medium">{video.title}</p>
        <p className="text-xs text-gray-500">{video.viewCount} views</p>
      </div>
    </Link>
  );
}
