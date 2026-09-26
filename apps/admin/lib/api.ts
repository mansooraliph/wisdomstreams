import type { ApiResponse } from "@wisdomstream/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

/** For use in Client Components. Sends the browser's httpOnly auth cookies automatically. */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  return res.json() as Promise<ApiResponse<T>>;
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
