"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateProfileSchema,
  type UpdateProfileInput,
  type PublicUser,
  type Channel,
} from "@wisdomstream/shared";
import { apiFetch } from "../../../lib/api";
import { useAuth } from "../../../lib/auth-context";

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading, refresh, logout } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [channels, setChannels] = useState<Channel[]>([]);

  const loadChannels = useCallback(async () => {
    const res = await apiFetch<Channel[]>("/channels/me");
    setChannels(res.data ?? []);
  }, []);

  useEffect(() => {
    if (user) loadChannels();
  }, [user, loadChannels]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateProfileInput>({ resolver: zodResolver(updateProfileSchema) });

  useEffect(() => {
    if (user) {
      reset({
        displayName: user.displayName ?? "",
        bio: user.bio ?? "",
        avatarUrl: user.avatarUrl ?? "",
        bannerUrl: user.bannerUrl ?? "",
        historyEnabled: user.historyEnabled,
        likedVideosPublic: user.likedVideosPublic,
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: UpdateProfileInput) => {
    setServerError(null);
    setSaved(false);
    const payload = {
      ...data,
      displayName: data.displayName || undefined,
      bio: data.bio || undefined,
      avatarUrl: data.avatarUrl || undefined,
      bannerUrl: data.bannerUrl || undefined,
    };
    const res = await apiFetch<PublicUser>("/users/me", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    if (res.error) {
      setServerError(res.error.message);
      return;
    }
    await refresh();
    setSaved(true);
  };

  const onDeleteAccount = async () => {
    const res = await apiFetch("/users/me", { method: "DELETE" });
    if (res.error) {
      setServerError(res.error.message);
      return;
    }
    await logout();
    router.push("/");
  };

  if (loading) return null;
  if (!user) return <p className="p-6 text-sm text-gray-500">Sign in to view settings.</p>;

  return (
    <main className="mx-auto max-w-lg space-y-8 p-6">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-gray-500">Manage your profile and privacy.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Display name</label>
          <input className="w-full rounded border px-3 py-2 text-sm" {...register("displayName")} />
          {errors.displayName && (
            <p className="mt-1 text-xs text-red-600">{errors.displayName.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Bio</label>
          <textarea
            rows={3}
            className="w-full rounded border px-3 py-2 text-sm"
            {...register("bio")}
          />
          {errors.bio && <p className="mt-1 text-xs text-red-600">{errors.bio.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Avatar URL</label>
          <input className="w-full rounded border px-3 py-2 text-sm" {...register("avatarUrl")} />
          {errors.avatarUrl && (
            <p className="mt-1 text-xs text-red-600">{errors.avatarUrl.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Banner URL</label>
          <input className="w-full rounded border px-3 py-2 text-sm" {...register("bannerUrl")} />
          {errors.bannerUrl && (
            <p className="mt-1 text-xs text-red-600">{errors.bannerUrl.message}</p>
          )}
        </div>

        <div className="space-y-2 border-t pt-4">
          <h2 className="text-sm font-semibold">Privacy</h2>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("historyEnabled")} />
            Keep watch history
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("likedVideosPublic")} />
            Make my liked videos public
          </label>
        </div>

        {serverError && <p className="text-sm text-red-600">{serverError}</p>}
        {saved && <p className="text-sm text-green-600">Saved.</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : "Save changes"}
        </button>
      </form>

      <div className="space-y-2 border-t pt-4">
        <h2 className="text-sm font-semibold">Your channels</h2>
        {channels.length === 0 ? (
          <p className="text-sm text-gray-500">You don&apos;t have a channel yet.</p>
        ) : (
          <ul className="space-y-1">
            {channels.map((c) => (
              <li key={c.id}>
                <Link href={`/channel/${c.handle}`} className="text-sm text-blue-600 hover:underline">
                  {c.name} (@{c.handle})
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link href="/channels/new" className="text-sm text-blue-600 hover:underline">
          + Create a channel
        </Link>
      </div>

      <div className="space-y-2 border-t pt-4">
        <h2 className="text-sm font-semibold text-red-600">Danger zone</h2>
        {!deleteConfirm ? (
          <button
            onClick={() => setDeleteConfirm(true)}
            className="rounded border border-red-600 px-4 py-2 text-sm font-medium text-red-600"
          >
            Delete account
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              This can&apos;t be undone. If you own any channels, delete or transfer them first.
            </p>
            <div className="flex gap-2">
              <button
                onClick={onDeleteAccount}
                className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white"
              >
                Yes, delete my account
              </button>
              <button
                onClick={() => setDeleteConfirm(false)}
                className="rounded border px-4 py-2 text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
