"use client";

import Link from "next/link";
import { Search, Plus } from "lucide-react";
import { SignOutButton } from "../lib/sign-out-button";
import { AvatarCircle } from "./avatar-circle";

export function Topbar({ username }: { username: string }) {
  return (
    <header className="flex h-14 flex-shrink-0 items-center gap-4 border-b bg-white px-4">
      <Link href="/dashboard" className="flex flex-shrink-0 items-center gap-1">
        <span className="text-lg font-semibold tracking-tight">WisdomStream</span>
        <span className="text-lg font-light text-gray-500">Studio</span>
      </Link>

      <div className="relative mx-auto w-full max-w-md">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          disabled
          placeholder="Search across your channel"
          className="w-full rounded-full border bg-gray-50 py-1.5 pl-9 pr-3 text-sm text-gray-500"
        />
      </div>

      <Link
        href="/upload"
        className="flex flex-shrink-0 items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium hover:bg-gray-50"
      >
        <Plus size={16} />
        Create
      </Link>

      <div className="flex flex-shrink-0 items-center gap-3">
        <AvatarCircle name={username} size={32} />
        <SignOutButton />
      </div>
    </header>
  );
}
