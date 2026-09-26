"use client";

import { apiFetch } from "./api";

const WEB_APP_URL = process.env.NEXT_PUBLIC_WEB_APP_URL ?? "http://localhost:3000";

export function SignOutButton() {
  return (
    <button
      onClick={async () => {
        await apiFetch("/auth/logout", { method: "POST" });
        window.location.href = WEB_APP_URL;
      }}
      className="text-sm text-gray-500 hover:underline"
    >
      Sign out
    </button>
  );
}
