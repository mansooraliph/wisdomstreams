import { NextRequest, NextResponse } from "next/server";

const WEB_APP_URL = process.env.NEXT_PUBLIC_WEB_APP_URL ?? "http://localhost:3000";

// UX-level redirect only — the API's JwtAuthGuard (via /auth/me in the root
// layout) is the actual source of truth for both authentication and the
// admin-only role gate.
export function middleware(req: NextRequest) {
  const hasSession = req.cookies.has("refresh_token");
  if (!hasSession) {
    const loginUrl = new URL("/login", WEB_APP_URL);
    loginUrl.searchParams.set("redirect_url", req.nextUrl.href);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
