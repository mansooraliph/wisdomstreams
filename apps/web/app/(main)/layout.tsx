"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Bell, Video, LogOut, Settings, Search } from "lucide-react";
import { useAuth } from "../../lib/auth-context";
import { SearchBar } from "../../components/search/search-bar";
import { Sidebar, MobileDrawer } from "../../components/sidebar";
import { MobileTabBar } from "../../components/mobile-tab-bar";
import { AvatarCircle } from "../../components/avatar-circle";

const STUDIO_URL = process.env.NEXT_PUBLIC_STUDIO_URL ?? "http://localhost:3002";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between gap-2 bg-white px-2 sm:gap-4 sm:px-4">
        <div className="flex flex-shrink-0 items-center gap-1 sm:gap-4">
          <button
            onClick={() => {
              setCollapsed((c) => !c);
              setMobileNavOpen((o) => !o);
            }}
            className="rounded-full p-2 hover:bg-gray-100"
            aria-label="Toggle menu"
          >
            <Menu size={22} />
          </button>
          <Link href="/" className="flex items-center gap-1">
            <span className="flex h-7 w-10 items-center justify-center rounded-md bg-red-600 text-white">
              <Video size={16} fill="white" />
            </span>
            <span className="text-lg font-semibold tracking-tight">WisdomStream</span>
          </Link>
        </div>

        <div className="hidden flex-1 justify-center sm:flex">
          <SearchBar />
        </div>

        <div className="flex flex-shrink-0 items-center gap-1 sm:gap-2">
          <Link href="/search" className="rounded-full p-2 hover:bg-gray-100 sm:hidden" aria-label="Search">
            <Search size={22} />
          </Link>
          {loading ? null : user ? (
            <>
              <a
                href={STUDIO_URL}
                className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 sm:flex"
              >
                <Video size={20} />
                Create
              </a>
              <Link href="/notifications" className="rounded-full p-2 hover:bg-gray-100">
                <Bell size={20} />
              </Link>
              <div className="relative">
                <button onClick={() => setMenuOpen((o) => !o)} aria-label="Account menu">
                  <AvatarCircle name={user.displayName ?? user.username} imageUrl={user.avatarUrl} size={32} />
                </button>
                {menuOpen && (
                  <div
                    onMouseLeave={() => setMenuOpen(false)}
                    className="absolute right-0 top-10 w-56 rounded-xl border bg-white py-2 shadow-lg"
                  >
                    <p className="truncate px-4 py-1.5 text-sm font-medium">{user.displayName ?? user.username}</p>
                    <p className="truncate px-4 pb-2 text-xs text-gray-500">@{user.username}</p>
                    <Link
                      href="/settings"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50"
                    >
                      <Settings size={16} /> Settings
                    </Link>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        logout();
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-gray-50"
                    >
                      <LogOut size={16} /> Sign out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-full border border-gray-300 px-4 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50"
            >
              Sign in
            </Link>
          )}
        </div>
      </header>

      <Sidebar loggedIn={!!user} collapsed={collapsed} />
      <MobileDrawer open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} loggedIn={!!user} />

      <div className={`pt-14 pb-14 sm:pb-0 ${collapsed ? "sm:pl-[72px]" : "sm:pl-60"}`}>{children}</div>

      <MobileTabBar />
    </div>
  );
}
