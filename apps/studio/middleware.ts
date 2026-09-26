import { NextRequest, NextResponse } from "next/server";

const WEB_APP_URL = process.env.NEXT_PUBLIC_WEB_APP_URL ?? "http://localhost:3000";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";
const ACCESS_MAX_AGE = 60 * 60 * 24; // keep in sync with packages/api auth.controller.ts
const REFRESH_MAX_AGE = 60 * 60 * 24 * 7;

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

function redirectToLogin(req: NextRequest) {
  const loginUrl = new URL("/login", WEB_APP_URL);
  loginUrl.searchParams.set("redirect_url", req.nextUrl.href);
  return NextResponse.redirect(loginUrl);
}

// UX-level redirect + proactive token refresh only — the API's JwtAuthGuard
// (via /auth/me in the root layout) is the actual source of truth for both
// authentication and the creator+ role gate.
//
// Refreshing here (rather than lazily on a 401 inside a Server Component or
// Client Component fetch) matters because refresh tokens are one-time-use:
// if the access token were left to expire naturally, the root layout's
// server-side fetch AND the page's own client-side fetch would each try to
// refresh independently, and the second one would always fail because the
// first already rotated the token — which is exactly what caused Studio to
// intermittently show "Access restricted" or "Create a channel first" for a
// perfectly valid, logged-in creator. Refreshing once here, before either of
// those ever runs, keeps the browser's cookies and this request in sync.
export async function middleware(req: NextRequest) {
  const refreshToken = req.cookies.get("refresh_token")?.value;
  if (!refreshToken) return redirectToLogin(req);

  const accessToken = req.cookies.get("access_token")?.value;
  if (!isAccessTokenExpired(accessToken)) return NextResponse.next();

  const refreshed = await tryRefresh(refreshToken);
  if (!refreshed) return redirectToLogin(req);

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
