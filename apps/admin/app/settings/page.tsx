"use client";

import { useCallback, useEffect, useState } from "react";
import type { CategoryItem } from "@wisdomstream/shared";
import { apiFetch } from "../../lib/api";

export default function AdminSettingsPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await apiFetch<CategoryItem[]>("/admin/categories");
    setCategories(res.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async () => {
    if (!name.trim() || !slug.trim()) return;
    const res = await apiFetch<CategoryItem>("/admin/categories", {
      method: "POST",
      body: JSON.stringify({ name: name.trim(), slug: slug.trim() }),
    });
    if (res.data) {
      setCategories((prev) => [...prev, res.data!]);
      setName("");
      setSlug("");
    }
  };

  const remove = async (id: string) => {
    await apiFetch(`/admin/categories/${id}`, { method: "DELETE" });
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <main className="mx-auto max-w-lg space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold">System settings</h1>
        <p className="text-sm text-gray-500">
          Rate limits, upload caps, and feature flags aren&apos;t configurable here yet — they're
          environment-level settings in the API. This page manages video categories.
        </p>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold">Categories</h2>
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="flex-1 rounded border px-3 py-1.5 text-sm"
          />
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="slug"
            className="flex-1 rounded border px-3 py-1.5 text-sm"
          />
          <button onClick={create} className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white">
            Add
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : (
          <ul className="divide-y">
            {categories.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-2 text-sm">
                <span>
                  {c.name} <span className="text-xs text-gray-400">({c.slug})</span>
                </span>
                <button onClick={() => remove(c.id)} className="text-xs text-red-600 hover:underline">
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
