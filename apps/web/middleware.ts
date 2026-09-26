import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";
const ACCESS_MAX_AGE = 60 * 60 * 24; // keep in sync with packages/api auth.controller.ts
const REFRESH_MAX_AGE = 60 * 60 * 24 * 7;

const PROTECTED_PREFIXES = [
  "/library",
  "/history",
  "/subscriptions",
  "/settings",
  "/channels/new",
  "/notifications",
];

function isAccessTokenExpired(token: string | undefined): boolean {
  if (!token) return true;
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const { exp } = JSON.parse(json) as { exp?: number };
    // 5s safety buffer so a token that's about to expire mid-request still gets refreshed.
    return typeof exp !== "number" || exp * 1000 < Date.now() + 5000;
  } catch {
    return true;
  }
}

function extractCookieValue(cookies: string[], name: string): string | null {
  for (const cookie of cookies) {
    const match = cookie.trim().match(new RegExp(`^${name}=([^;]+)`));
    if (match) return match[1];
  }
  return null;
}

async function tryRefresh(refreshToken: string): Promise<{ access: string; refresh: string } | null> {
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { Cookie: `refresh_token=${refreshToken}` },
  });
  if (!res.ok) return null;
  const headers = res.headers as Headers & { getSetCookie?: () => string[] };
  const raw = typeof headers.getSetCookie === "function"
    ? headers.getSetCookie()
    : (res.headers.get("set-cookie")?.split(/,(?=\s*[\w-]+=)/) ?? []);
  const access = extractCookieValue(raw, "access_token");
  const refresh = extractCookieValue(raw, "refresh_token");
  return access && refresh ? { access, refresh } : null;
}

// This is a UX-level redirect only — presence of the refresh_token cookie
// means "was logged in", not "is currently valid". The API's JwtAuthGuard is
// the actual source of truth and re-validates on every request.
//
// It also proactively refreshes an expired access token for ANY logged-in
// visitor (not just protected routes), because refresh tokens are
// one-time-use: leaving expiry to be discovered lazily by whichever fetch
// hits it first (the root layout's /auth/me, or a page's own client-side
// fetch) means the second one to try refreshing always fails, since the
// first already rotated the token. Refreshing once here, before either of
// those runs, keeps the browser's cookies and this request in sync.
export async function middleware(req: NextRequest) {
  const isProtected = PROTECTED_PREFIXES.some((prefix) => req.nextUrl.pathname.startsWith(prefix));
  const refreshToken = req.cookies.get("refresh_token")?.value;

  if (!refreshToken) {
    if (!isProtected) return NextResponse.next();
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect_url", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  const accessToken = req.cookies.get("access_token")?.value;
  if (!isAccessTokenExpired(accessToken)) return NextResponse.next();

  const refreshed = await tryRefresh(refreshToken);
  if (!refreshed) {
    if (!isProtected) return NextResponse.next();
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect_url", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  req.cookies.set("access_token", refreshed.access);
  req.cookies.set("refresh_token", refreshed.refresh);
  const response = NextResponse.next({ request: { headers: req.headers } });
  const cookieOpts = { httpOnly: true, sameSite: "lax" as const, path: "/" };
  response.cookies.set("access_token", refreshed.access, { ...cookieOpts, maxAge: ACCESS_MAX_AGE });
  response.cookies.set("refresh_token", refreshed.refresh, { ...cookieOpts, maxAge: REFRESH_MAX_AGE });
  return response;
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
