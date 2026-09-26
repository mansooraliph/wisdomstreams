import type { Metadata } from "next";
import type { ApiResponse, PublicUser } from "@wisdomstream/shared";
import { serverApiFetch } from "../lib/api";
import { SignOutButton } from "../lib/sign-out-button";
import "./globals.css";

export const metadata: Metadata = {
  title: "WisdomStream Studio",
  description: "Creator dashboard for WisdomStream",
};

const ALLOWED_ROLES: PublicUser["role"][] = ["CREATOR", "MODERATOR", "ADMIN"];

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const me = (await serverApiFetch<PublicUser>("/auth/me")) as ApiResponse<PublicUser>;
  const isAllowed = me.data !== null && ALLOWED_ROLES.includes(me.data.role);

  return (
    <html lang="en">
      <body>
        <header className="flex h-14 items-center justify-between border-b px-4">
          <span className="text-lg font-semibold">WisdomStream Studio</span>
          {me.data && <SignOutButton />}
        </header>
        {isAllowed ? (
          children
        ) : (
          <main className="p-6">
            <h1 className="text-xl font-semibold">Access restricted</h1>
            <p className="text-sm text-gray-500">
              Studio is only available to creator accounts. Sign in with a creator account, or
              request creator access.
            </p>
          </main>
        )}
      </body>
    </html>
  );
}
