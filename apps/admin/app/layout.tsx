import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ApiResponse, PublicUser } from "@wisdomstream/shared";
import { serverApiFetch } from "../lib/api";
import { Sidebar } from "../components/sidebar";
import { Topbar } from "../components/topbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "WisdomStream Admin",
  description: "Platform administration for WisdomStream",
};

const WEB_APP_URL = process.env.NEXT_PUBLIC_WEB_APP_URL ?? "http://localhost:3000";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const me = (await serverApiFetch<PublicUser>("/auth/me")) as ApiResponse<PublicUser>;

  // The middleware only checks whether a refresh_token cookie is present, not
  // whether it's still valid — an expired/revoked one still passes it
  // through. If /auth/me (and its internal refresh-and-retry) still comes
  // back empty, the visitor isn't really authenticated, so send them to
  // login instead of showing the "wrong role" message.
  if (me.data === null) {
    const h = await headers();
    const host = h.get("host") ?? "localhost:3003";
    const proto = h.get("x-forwarded-proto") ?? "http";
    // In production this app is mounted at NEXT_BASE_PATH (e.g. /admin)
    // behind nginx — include it so a signed-out visit here lands back on
    // this app after login, not on the root domain's home page.
    const basePath = process.env.NEXT_BASE_PATH ?? "";
    const currentUrl = `${proto}://${host}${basePath}`;
    redirect(`${WEB_APP_URL}/login?redirect_url=${encodeURIComponent(currentUrl)}`);
  }

  const isAllowed = me.data.role === "ADMIN";

  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900">
        {isAllowed && me.data ? (
          <div className="flex h-screen">
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
              <Topbar username={me.data.displayName ?? me.data.username} />
              <main className="flex-1 overflow-y-auto">{children}</main>
            </div>
          </div>
        ) : (
          <main className="flex min-h-screen items-center justify-center p-6">
            <div className="max-w-sm text-center">
              <h1 className="text-xl font-semibold">Access restricted</h1>
              <p className="mt-2 text-sm text-gray-500">This area is only available to administrators.</p>
            </div>
          </main>
        )}
      </body>
    </html>
  );
}
