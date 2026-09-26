"use client";

import { useCallback, useEffect, useState } from "react";
import { Search } from "lucide-react";
import type { AdminUser, Role, UserStatus } from "@wisdomstream/shared";
import { apiFetch } from "../../lib/api";
import { AvatarCircle } from "../../components/avatar-circle";

const ROLES: Role[] = ["VIEWER", "CREATOR", "MODERATOR", "ADMIN"];
const STATUSES: UserStatus[] = ["ACTIVE", "SUSPENDED", "BANNED"];

const STATUS_STYLE: Record<UserStatus, string> = {
  ACTIVE: "bg-green-50 text-green-700",
  SUSPENDED: "bg-amber-50 text-amber-700",
  BANNED: "bg-red-50 text-red-700",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (q: string) => {
    setLoading(true);
    const res = await apiFetch<AdminUser[]>(`/admin/users${q ? `?search=${encodeURIComponent(q)}` : ""}`);
    setUsers(res.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load("");
  }, [load]);

  const setRole = async (id: string, role: Role) => {
    const res = await apiFetch<AdminUser>(`/admin/users/${id}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    });
    if (res.data) setUsers((prev) => prev.map((u) => (u.id === id ? res.data! : u)));
  };

  const setStatus = async (id: string, status: UserStatus) => {
    const res = await apiFetch<AdminUser>(`/admin/users/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    if (res.data) setUsers((prev) => prev.map((u) => (u.id === id ? res.data! : u)));
  };

  return (
    <main className="p-8">
      <h1 className="mb-6 text-2xl font-bold">User management</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          load(search);
        }}
        className="relative mb-6 max-w-md"
      >
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by email or username"
          className="w-full rounded-full border bg-white py-2 pl-9 pr-4 text-sm"
        />
      </form>

      <div className="overflow-hidden rounded-xl border bg-white">
        {loading ? (
          <p className="p-6 text-sm text-gray-500">Loading...</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <AvatarCircle name={u.username} size={32} />
                      <div>
                        <p className="font-medium">{u.username}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => setRole(u.id, e.target.value as Role)}
                      className="rounded-full border px-3 py-1 text-xs"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={u.status}
                      onChange={(e) => setStatus(u.id, e.target.value as UserStatus)}
                      className={`rounded-full border-0 px-3 py-1 text-xs font-medium ${STATUS_STYLE[u.status]}`}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
