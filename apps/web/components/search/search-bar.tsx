"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { apiFetch } from "../../lib/api";

export function SearchBar() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!q.trim()) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const res = await apiFetch<string[]>(`/search/suggestions?q=${encodeURIComponent(q)}`);
      setSuggestions(res.data ?? []);
    }, 250);
    return () => clearTimeout(debounceRef.current);
  }, [q]);

  const submit = (query: string) => {
    setShowSuggestions(false);
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="relative w-full max-w-[600px]">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (q.trim()) submit(q.trim());
        }}
        className="flex"
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder="Search"
          className="w-full rounded-l-full border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        <button
          type="submit"
          aria-label="Search"
          className="flex flex-shrink-0 items-center justify-center rounded-r-full border border-l-0 border-gray-300 bg-gray-50 px-5 hover:bg-gray-100"
        >
          <Search size={18} />
        </button>
      </form>
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full rounded-xl border bg-white py-2 shadow-lg">
          {suggestions.map((s) => (
            <li key={s}>
              <button
                onClick={() => submit(s)}
                className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
