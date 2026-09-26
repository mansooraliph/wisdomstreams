import { cache } from "react";
import type { ApiResponse } from "@wisdomstream/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

function networkError<T>(err: unknown): ApiResponse<T> {
  return {
    data: null,
    error: {
      code: "NETWORK_ERROR",
      message: err instanceof Error ? err.message : "Failed to reach the API",
    },
  };
}

function getSetCookies(res: Response): string[] {
  const headers = res.headers as Headers & { getSetCookie?: () => string[] };
  if (typeof headers.getSetCookie === "function") return headers.getSetCookie();
  // Fallback for runtimes without getSetCookie(): our cookies never contain
  // a comma themselves (no Expires attribute is set, only Max-Age), so
  // splitting the joined header on ", " before the next cookie's name=
  // pair is safe here.
  const raw = res.headers.get("set-cookie");
  return raw ? raw.split(/,(?=\s*[\w-]+=)/) : [];
}

function extractCookieValue(cookies: string[], name: string): string | null {
  for (const cookie of cookies) {
    const match = cookie.trim().match(new RegExp(`^${name}=([^;]+)`));
    if (match) return match[1];
  }
  return null;
}

function replaceCookieValue(cookieHeader: string, name: string, value: string): string {
  const pairs = cookieHeader
    .split(";")
    .map((p) => p.trim())
    .filter((p) => p && !p.startsWith(`${name}=`));
  pairs.push(`${name}=${value}`);
  return pairs.join("; ");
}

/**
 * Refresh tokens are one-time-use/rotating, so if a single server render
 * makes several serverApiFetch calls (e.g. a layout fetching /auth/me then
 * /channels/me) and the access token has expired, each call independently
 * hitting /auth/refresh with the same original cookie snapshot would only
 * let the first one succeed — the rest would reuse an already-rotated
 * (now-revoked) refresh token and fail. React's cache() memoizes this per
 * request/render, so every serverApiFetch call in the same render shares
 * one actual refresh attempt.
 */
const refreshAccessToken = cache(async (cookieHeader: string): Promise<string | null> => {
  const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { Cookie: cookieHeader },
  });
  if (!refreshRes.ok) return null;
  return extractCookieValue(getSetCookies(refreshRes), "access_token");
});

/**
 * For use in Client Components. Sends the browser's httpOnly auth cookies
 * automatically. Access tokens are short-lived (15m); on a 401 we attempt a
 * silent refresh and retry once before giving up. In the browser this also
 * updates the real cookie jar (via credentials: "include"), so subsequent
 * requests stay authenticated without the user noticing anything happened.
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const headers = { "Content-Type": "application/json", ...init?.headers } as Record<string, string>;
    const res = await fetch(`${API_URL}${path}`, { ...init, credentials: "include", headers });

    if (res.status === 401 && path !== "/auth/refresh" && path !== "/auth/login") {
      const cookieHeader = headers.Cookie;

      if (cookieHeader) {
        // Server-side caller (serverApiFetch): dedupe concurrent refreshes
        // within the same render via the cache()-wrapped helper above.
        const newAccessToken = await refreshAccessToken(cookieHeader);
        if (!newAccessToken) return (await res.json()) as ApiResponse<T>;
        const retryHeaders = { ...headers, Cookie: replaceCookieValue(cookieHeader, "access_token", newAccessToken) };
        const retryRes = await fetch(`${API_URL}${path}`, { ...init, credentials: "include", headers: retryHeaders });
        return (await retryRes.json()) as ApiResponse<T>;
      }

      // Browser caller: no explicit cookie header, rely on the shared cookie jar.
      const refreshRes = await fetch(`${API_URL}/auth/refresh`, { method: "POST", credentials: "include" });
      if (refreshRes.ok) {
        const retryRes = await fetch(`${API_URL}${path}`, { ...init, credentials: "include", headers });
        return (await retryRes.json()) as ApiResponse<T>;
      }
    }

    return (await res.json()) as ApiResponse<T>;
  } catch (err) {
    // The API may be briefly unreachable (e.g. mid-restart in dev) — degrade
    // to an error response instead of throwing and crashing the render tree.
    return networkError<T>(err);
  }
}

/**
 * For use in Server Components / Route Handlers / Server Actions.
 * Server-side `fetch` has no browser cookie jar, so we forward the
 * incoming request's cookies manually.
 */
export async function serverApiFetch<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  return apiFetch<T>(path, {
    ...init,
    headers: { ...init?.headers, Cookie: cookieStore.toString() },
  });
}
