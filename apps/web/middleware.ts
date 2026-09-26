import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PREFIXES = [
  "/library",
  "/history",
  "/subscriptions",
  "/settings",
  "/channels/new",
  "/notifications",
];

// This is a UX-level redirect only — presence of the refresh_token cookie
// means "was logged in", not "is currently valid". The API's JwtAuthGuard is
// the actual source of truth and re-validates on every request.
export function middleware(req: NextRequest) {
  const isProtected = PROTECTED_PREFIXES.some((prefix) => req.nextUrl.pathname.startsWith(prefix));
  if (!isProtected) return NextResponse.next();

  const hasSession = req.cookies.has("refresh_token");
  if (!hasSession) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect_url", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/library/:path*",
    "/history/:path*",
    "/subscriptions/:path*",
    "/settings/:path*",
    "/channels/new",
    "/notifications/:path*",
  ],
};
