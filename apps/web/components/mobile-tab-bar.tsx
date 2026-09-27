"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Clapperboard, Rss, CircleUserRound } from "lucide-react";

const ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/shorts", label: "Shorts", icon: Clapperboard },
  { href: "/subscriptions", label: "Subscriptions", icon: Rss },
  { href: "/library", label: "You", icon: CircleUserRound },
];

export function MobileTabBar() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex h-14 items-stretch border-t bg-white sm:hidden">
      {ITEMS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] ${
            isActive(href) ? "font-semibold text-black" : "text-gray-600"
          }`}
        >
          <Icon size={22} strokeWidth={isActive(href) ? 2.5 : 2} />
          {label}
        </Link>
      ))}
    </nav>
  );
}
