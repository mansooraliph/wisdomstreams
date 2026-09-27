"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Clapperboard, Rss, CircleUserRound, History as HistoryIcon, Flame, UserCircle2, Video, X } from "lucide-react";

const TOP_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/shorts", label: "Shorts", icon: Clapperboard },
  { href: "/subscriptions", label: "Subscriptions", icon: Rss },
  { href: "/library", label: "You", icon: CircleUserRound },
  { href: "/history", label: "History", icon: HistoryIcon },
];

const EXPLORE_ITEMS = [{ href: "/trending", label: "Trending", icon: Flame }];

export function MobileDrawer({
  open,
  onClose,
  loggedIn,
}: {
  open: boolean;
  onClose: () => void;
  loggedIn: boolean;
}) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 sm:hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[80%] flex-col overflow-y-auto bg-white">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" onClick={onClose} className="flex items-center gap-1">
            <span className="flex h-7 w-10 items-center justify-center rounded-md bg-red-600 text-white">
              <Video size={16} fill="white" />
            </span>
            <span className="text-lg font-semibold tracking-tight">WisdomStream</span>
          </Link>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-gray-100" aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <nav className="flex flex-col gap-0.5 border-t px-2 py-3">
          {TOP_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`flex items-center gap-5 rounded-r-full px-4 py-2.5 text-sm ${
                isActive(href) ? "bg-gray-100 font-semibold text-black" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Icon size={20} strokeWidth={isActive(href) ? 2.5 : 2} />
              {label}
            </Link>
          ))}
        </nav>

        {!loggedIn && (
          <div className="border-t px-4 py-4">
            <p className="text-sm text-gray-700">Sign in to like videos, comment, and subscribe.</p>
            <Link
              href="/login"
              onClick={onClose}
              className="mt-3 flex w-fit items-center gap-2 rounded-full border border-gray-300 px-4 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50"
            >
              <UserCircle2 size={20} />
              Sign in
            </Link>
          </div>
        )}

        <div className="border-t px-2 py-3">
          <p className="px-4 pb-1 text-sm font-semibold">Explore</p>
          {EXPLORE_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`flex items-center gap-5 rounded-r-full px-4 py-2.5 text-sm ${
                isActive(href) ? "bg-gray-100 font-semibold text-black" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Icon size={20} strokeWidth={isActive(href) ? 2.5 : 2} />
              {label}
            </Link>
          ))}
        </div>
      </aside>
    </div>
  );
}

export function Sidebar({ loggedIn, collapsed }: { loggedIn: boolean; collapsed: boolean }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  if (collapsed) {
    return (
      <aside className="fixed bottom-0 left-0 top-14 z-20 hidden w-[72px] flex-col overflow-y-auto bg-white py-2 sm:flex">
        {TOP_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`mx-1 flex flex-col items-center gap-1 rounded-lg px-2 py-4 text-[10px] ${
              isActive(href) ? "font-semibold text-black" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Icon size={22} strokeWidth={isActive(href) ? 2.5 : 2} />
            {label}
          </Link>
        ))}
      </aside>
    );
  }

  return (
    <aside className="fixed bottom-0 left-0 top-14 z-20 hidden w-60 flex-col overflow-y-auto border-r bg-white py-2 sm:flex">
      <nav className="flex flex-col gap-0.5 px-2 pb-3">
        {TOP_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-5 rounded-r-full px-4 py-2.5 text-sm ${
              isActive(href) ? "bg-gray-100 font-semibold text-black" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Icon size={20} strokeWidth={isActive(href) ? 2.5 : 2} />
            {label}
          </Link>
        ))}
      </nav>

      {!loggedIn && (
        <>
          <div className="border-t px-4 py-4">
            <p className="text-sm text-gray-700">Sign in to like videos, comment, and subscribe.</p>
            <Link
              href="/login"
              className="mt-3 flex w-fit items-center gap-2 rounded-full border border-gray-300 px-4 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50"
            >
              <UserCircle2 size={20} />
              Sign in
            </Link>
          </div>
        </>
      )}

      <div className="border-t px-2 pt-3">
        <p className="px-4 pb-1 text-sm font-semibold">Explore</p>
        {EXPLORE_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-5 rounded-r-full px-4 py-2.5 text-sm ${
              isActive(href) ? "bg-gray-100 font-semibold text-black" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Icon size={20} strokeWidth={isActive(href) ? 2.5 : 2} />
            {label}
          </Link>
        ))}
      </div>
    </aside>
  );
}
