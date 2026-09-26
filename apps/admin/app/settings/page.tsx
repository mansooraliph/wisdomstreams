"use client";

import { useCallback, useEffect, useState } from "react";
import { Tag, Plus, Trash2 } from "lucide-react";
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
    <main className="mx-auto max-w-lg space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-bold">System settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Rate limits, upload caps, and feature flags aren&apos;t configurable here yet — they&apos;re
          environment-level settings in the API. This page manages video categories.
        </p>
      </div>

      <div className="rounded-xl border bg-white p-6">
        <h2 className="mb-3 flex items-center gap-2 font-semibold">
          <Tag size={16} className="text-gray-400" />
          Categories
        </h2>
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="flex-1 rounded-full border px-4 py-2 text-sm"
          />
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="slug"
            className="flex-1 rounded-full border px-4 py-2 text-sm"
          />
          <button
            onClick={create}
            className="flex items-center gap-1 rounded-full bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
          >
            <Plus size={14} /> Add
          </button>
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-gray-500">Loading...</p>
        ) : categories.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">No categories yet.</p>
        ) : (
          <ul className="mt-4 divide-y">
            {categories.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-2.5 text-sm">
                <span>
                  {c.name} <span className="text-xs text-gray-400">({c.slug})</span>
                </span>
                <button onClick={() => remove(c.id)} className="text-gray-400 hover:text-red-600">
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
