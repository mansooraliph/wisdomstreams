import type { Metadata } from "next";
import type { ApiResponse, PublicUser } from "@wisdomstream/shared";
import { serverApiFetch } from "../lib/api";
import { SignOutButton } from "../lib/sign-out-button";
import "./globals.css";

export const metadata: Metadata = {
  title: "WisdomStream Admin",
  description: "Platform administration for WisdomStream",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const me = (await serverApiFetch<PublicUser>("/auth/me")) as ApiResponse<PublicUser>;
  const isAllowed = me.data !== null && me.data.role === "ADMIN";

  return (
    <html lang="en">
      <body>
        <header className="flex h-14 items-center justify-between border-b px-4">
          <span className="text-lg font-semibold">WisdomStream Admin</span>
          {me.data && <SignOutButton />}
        </header>
        {isAllowed ? (
          children
        ) : (
          <main className="p-6">
            <h1 className="text-xl font-semibold">Access restricted</h1>
            <p className="text-sm text-gray-500">This area is only available to administrators.</p>
          </main>
        )}
      </body>
    </html>
  );
}
