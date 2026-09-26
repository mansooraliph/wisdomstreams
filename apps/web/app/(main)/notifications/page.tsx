"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { NotificationItem } from "@wisdomstream/shared";
import { apiFetch } from "../../../lib/api";
import { useAuth } from "../../../lib/auth-context";

function describe(n: NotificationItem): { text: string; href: string } {
  if (n.type === "new_video") {
    return {
      text: `New video: ${n.data.videoTitle ?? "Untitled"}`,
      href: `/watch/${n.data.videoId}`,
    };
  }
  return { text: n.type, href: "#" };
}

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await apiFetch<NotificationItem[]>("/notifications");
    setItems(res.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  const markAllRead = async () => {
    await apiFetch("/notifications/read-all", { method: "PATCH" });
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const dismiss = async (id: string) => {
    await apiFetch(`/notifications/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((n) => n.id !== id));
  };

  if (authLoading) return null;
  if (!user) return <p className="p-6 text-sm text-gray-500">Sign in to see your notifications.</p>;

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Notifications</h1>
        {items.some((n) => !n.isRead) && (
          <button onClick={markAllRead} className="text-sm text-blue-600 hover:underline">
            Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-500">No notifications yet.</p>
      ) : (
        <ul className="divide-y">
          {items.map((n) => {
            const { text, href } = describe(n);
            return (
              <li key={n.id} className="flex items-center justify-between py-3">
                <Link
                  href={href}
                  onClick={() => apiFetch(`/notifications/${n.id}/read`, { method: "PATCH" })}
                  className={`text-sm ${n.isRead ? "text-gray-500" : "font-medium"}`}
                >
                  {text}
                </Link>
                <button onClick={() => dismiss(n.id)} className="text-xs text-gray-400 hover:underline">
                  Dismiss
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
