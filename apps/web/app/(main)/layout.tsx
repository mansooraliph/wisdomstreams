"use client";

import Link from "next/link";
import { useAuth } from "../../lib/auth-context";
import { SearchBar } from "../../components/search/search-bar";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="flex h-14 items-center justify-between gap-4 border-b px-4">
        <Link href="/" className="flex-shrink-0 text-lg font-semibold">
          WisdomStream
        </Link>
        <SearchBar />
        <div>
          {loading ? null : user ? (
            <div className="flex items-center gap-3 text-sm">
              <Link href="/settings" className="hover:underline">
                {user.username}
              </Link>
              <Link href="/notifications" className="text-gray-500 hover:underline">
                🔔
              </Link>
              <Link href="/history" className="text-gray-500 hover:underline">
                History
              </Link>
              <Link href="/library" className="text-gray-500 hover:underline">
                Library
              </Link>
              <button onClick={() => logout()} className="text-gray-500 hover:underline">
                Sign out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-full border px-4 py-1.5 text-sm font-medium text-blue-600"
            >
              Sign in
            </Link>
          )}
        </div>
      </header>
      {children}
    </div>
  );
}
