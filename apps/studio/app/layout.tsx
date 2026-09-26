import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ApiResponse, Channel, PublicUser } from "@wisdomstream/shared";
import { serverApiFetch } from "../lib/api";
import { Sidebar } from "../components/sidebar";
import { Topbar } from "../components/topbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "WisdomStream Studio",
  description: "Creator dashboard for WisdomStream",
};

const WEB_APP_URL = process.env.NEXT_PUBLIC_WEB_APP_URL ?? "http://localhost:3000";
const ALLOWED_ROLES: PublicUser["role"][] = ["CREATOR", "MODERATOR", "ADMIN"];

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const me = (await serverApiFetch<PublicUser>("/auth/me")) as ApiResponse<PublicUser>;

  // The middleware only checks whether a refresh_token cookie is present, not
  // whether it's still valid — an expired/revoked one still passes it
  // through. If /auth/me (and its internal refresh-and-retry) still comes
  // back empty, the visitor isn't really authenticated, so send them to
  // login instead of showing the "wrong role" message, which is misleading
  // here and was what made this page feel like it kept failing at random.
  if (me.data === null) {
    const host = (await headers()).get("host");
    const currentUrl = `http://${host ?? "localhost:3002"}`;
    redirect(`${WEB_APP_URL}/login?redirect_url=${encodeURIComponent(currentUrl)}`);
  }

  const isAllowed = ALLOWED_ROLES.includes(me.data.role);

  const channels = isAllowed
    ? ((await serverApiFetch<Channel[]>("/channels/me")) as ApiResponse<Channel[]>)
    : null;
  const channel = channels?.data?.[0] ?? null;

  return (
    <html lang="en">
      <body className="bg-white text-black">
        {isAllowed && me.data ? (
          <div className="flex h-screen flex-col">
            <Topbar username={me.data.displayName ?? me.data.username} />
            <div className="flex flex-1 overflow-hidden">
              <Sidebar
                channelName={channel?.name ?? null}
                channelHandle={channel?.handle ?? null}
                avatarUrl={channel?.avatarUrl ?? null}
              />
              <main className="flex-1 overflow-y-auto bg-gray-50">{children}</main>
            </div>
          </div>
        ) : (
          <main className="flex min-h-screen items-center justify-center p-6">
            <div className="max-w-sm text-center">
              <h1 className="text-xl font-semibold">Access restricted</h1>
              <p className="mt-2 text-sm text-gray-500">
                Studio is only available to creator accounts. Sign in with a creator account, or
                request creator access.
              </p>
            </div>
          </main>
        )}
      </body>
    </html>
  );
}
