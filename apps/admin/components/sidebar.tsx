"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, ShieldAlert, Flag, Tv, Settings } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/users", label: "Users", icon: Users },
  { href: "/content", label: "Content", icon: ShieldAlert },
  { href: "/reports", label: "Reports", icon: Flag },
  { href: "/channels", label: "Channels", icon: Tv },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 flex-shrink-0 flex-col border-r border-slate-800 bg-slate-900 py-4">
      <div className="mb-4 px-5">
        <span className="text-lg font-bold text-white">WisdomStream</span>
        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Admin</p>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${
                active ? "bg-slate-800 font-semibold text-white" : "text-slate-300 hover:bg-slate-800/60"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
