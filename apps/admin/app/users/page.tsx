"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminUser, Role, UserStatus } from "@wisdomstream/shared";
import { apiFetch } from "../../lib/api";

const ROLES: Role[] = ["VIEWER", "CREATOR", "MODERATOR", "ADMIN"];
const STATUSES: UserStatus[] = ["ACTIVE", "SUSPENDED", "BANNED"];

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
    <main className="mx-auto max-w-3xl space-y-4 p-6">
      <h1 className="text-xl font-semibold">User management</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          load(search);
        }}
        className="flex gap-2"
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by email or username"
          className="flex-1 rounded border px-3 py-1.5 text-sm"
        />
        <button type="submit" className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white">
          Search
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-gray-500">
              <th className="py-2">User</th>
              <th className="py-2">Role</th>
              <th className="py-2">Status</th>
              <th className="py-2">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="py-2">
                  <p className="font-medium">{u.username}</p>
                  <p className="text-xs text-gray-500">{u.email}</p>
                </td>
                <td className="py-2">
                  <select
                    value={u.role}
                    onChange={(e) => setRole(u.id, e.target.value as Role)}
                    className="rounded border px-2 py-1 text-xs"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-2">
                  <select
                    value={u.status}
                    onChange={(e) => setStatus(u.id, e.target.value as UserStatus)}
                    className="rounded border px-2 py-1 text-xs"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-2 text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
