"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { SearchHit } from "@wisdomstream/shared";
import { apiFetch } from "../../../lib/api";

function formatDuration(seconds: number | null): string {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function SearchResults() {
  const q = useSearchParams().get("q") ?? "";
  const [results, setResults] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!q) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    apiFetch<SearchHit[]>(`/search?q=${encodeURIComponent(q)}`).then((res) => {
      setResults(res.data ?? []);
      setLoading(false);
    });
  }, [q]);

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="mb-4 text-lg font-semibold">
        {q ? `Search results for "${q}"` : "Search"}
      </h1>
      {loading ? (
        <p className="text-sm text-gray-500">Searching...</p>
      ) : results.length === 0 ? (
        <p className="text-sm text-gray-500">No results found.</p>
      ) : (
        <ul className="space-y-4">
          {results.map((v) => (
            <li key={v.id}>
              <Link href={`/watch/${v.id}`} className="flex gap-4">
                <div className="relative h-24 w-40 flex-shrink-0 rounded bg-gray-200">
                  {v.thumbnailUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={v.thumbnailUrl} alt="" className="h-full w-full rounded object-cover" />
                  )}
                  {v.duration != null && (
                    <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 text-xs text-white">
                      {formatDuration(v.duration)}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-medium">{v.title}</p>
                  <p className="text-xs text-gray-500">
                    {v.channelName} · {v.viewCount} views
                  </p>
                  {v.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-gray-600">{v.description}</p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchResults />
    </Suspense>
  );
}
