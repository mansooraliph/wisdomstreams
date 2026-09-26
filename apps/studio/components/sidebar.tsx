"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Film,
  BarChart2,
  MessageSquare,
  ListVideo,
  Captions,
  Paintbrush,
  Settings,
} from "lucide-react";
import { AvatarCircle } from "./avatar-circle";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/content", label: "Content", icon: Film },
  { href: "/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/comments", label: "Comments", icon: MessageSquare },
  { href: "/playlists", label: "Playlists", icon: ListVideo },
  { href: "/subtitles", label: "Subtitles", icon: Captions },
  { href: "/customization", label: "Customisation", icon: Paintbrush },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({
  channelName,
  channelHandle,
  avatarUrl,
}: {
  channelName: string | null;
  channelHandle: string | null;
  avatarUrl: string | null;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 flex-shrink-0 flex-col border-r bg-white py-4">
      {channelName && (
        <div className="mb-2 flex flex-col items-center gap-2 px-4 pb-4 text-center">
          <AvatarCircle name={channelName} imageUrl={avatarUrl} size={72} />
          <div>
            <p className="text-sm font-semibold">{channelName}</p>
            <p className="text-xs text-gray-500">@{channelHandle}</p>
          </div>
        </div>
      )}

      <nav className="flex flex-1 flex-col gap-0.5 px-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-5 rounded-r-full px-4 py-2.5 text-sm ${
                active ? "bg-gray-100 font-semibold text-black" : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 2} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
