"use client";

import { SignOutButton } from "../lib/sign-out-button";
import { AvatarCircle } from "./avatar-circle";

export function Topbar({ username }: { username: string }) {
  return (
    <header className="flex h-14 flex-shrink-0 items-center justify-end gap-3 border-b bg-white px-6">
      <AvatarCircle name={username} size={32} />
      <span className="text-sm font-medium">{username}</span>
      <SignOutButton />
    </header>
  );
}
