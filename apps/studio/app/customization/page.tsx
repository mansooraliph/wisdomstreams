"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  channelCreateSchema,
  channelUpdateSchema,
  type ChannelCreateInput,
  type ChannelUpdateInput,
  type Channel,
} from "@wisdomstream/shared";
import { apiFetch, apiUpload } from "../../lib/api";

export default function CustomizationPage() {
  const [channel, setChannel] = useState<Channel | null>(null);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<"avatar" | "banner" | null>(null);

  const load = useCallback(async () => {
    const res = await apiFetch<Channel[]>("/channels/me");
    setChannel(res.data?.[0] ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const uploadImage = async (kind: "avatar" | "banner", file: File) => {
    if (!channel) return;
    setUploading(kind);
    const formData = new FormData();
    formData.append("file", file);
    const res = await apiUpload<Channel>(`/channels/${channel.id}/${kind}`, formData);
    setUploading(null);
    if (res.data) setChannel(res.data);
  };

  if (loading) return <p className="p-6 text-sm text-gray-500">Loading...</p>;

  return (
    <main className="mx-auto max-w-lg space-y-6 p-6">
      <h1 className="text-xl font-semibold">Channel customization</h1>

      {channel && (
        <div className="space-y-3">
          <div>
            <p className="mb-1 text-sm font-medium">Banner</p>
            <div className="h-24 w-full rounded bg-gray-200">
              {channel.bannerUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={channel.bannerUrl} alt="" className="h-full w-full rounded object-cover" />
              )}
            </div>
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="mt-2 text-xs"
              onChange={(e) => e.target.files?.[0] && uploadImage("banner", e.target.files[0])}
            />
            {uploading === "banner" && <p className="text-xs text-gray-500">Uploading...</p>}
          </div>

          <div>
            <p className="mb-1 text-sm font-medium">Avatar</p>
            <div className="h-16 w-16 rounded-full bg-gray-300">
              {channel.avatarUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={channel.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
              )}
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="mt-2 text-xs"
              onChange={(e) => e.target.files?.[0] && uploadImage("avatar", e.target.files[0])}
            />
            {uploading === "avatar" && <p className="text-xs text-gray-500">Uploading...</p>}
          </div>
        </div>
      )}

      {channel ? (
        <EditChannelForm
          channel={channel}
          onSaved={(updated) => {
            setChannel(updated);
            setSaved(true);
            setServerError(null);
          }}
          onError={setServerError}
        />
      ) : (
        <CreateChannelForm
          onCreated={(created) => {
            setChannel(created);
            setServerError(null);
          }}
          onError={setServerError}
        />
      )}

      {serverError && <p className="text-sm text-red-600">{serverError}</p>}
      {saved && <p className="text-sm text-green-600">Saved.</p>}
    </main>
  );
}

function CreateChannelForm({
  onCreated,
  onError,
}: {
  onCreated: (channel: Channel) => void;
  onError: (message: string) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChannelCreateInput>({ resolver: zodResolver(channelCreateSchema) });

  const onSubmit = async (data: ChannelCreateInput) => {
    const res = await apiFetch<Channel>("/channels", {
      method: "POST",
      body: JSON.stringify({
        handle: data.handle,
        name: data.name,
        description: data.description || undefined,
        category: data.category || undefined,
      }),
    });
    if (res.error) {
      onError(res.error.message);
      return;
    }
    onCreated(res.data!);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <p className="text-sm text-gray-500">You don&apos;t have a channel yet. Create one to get started.</p>
      <div>
        <label className="mb-1 block text-sm font-medium">Handle</label>
        <input className="w-full rounded border px-3 py-2 text-sm" {...register("handle")} />
        {errors.handle && <p className="mt-1 text-xs text-red-600">{errors.handle.message}</p>}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Channel name</label>
        <input className="w-full rounded border px-3 py-2 text-sm" {...register("name")} />
        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Description</label>
        <textarea rows={3} className="w-full rounded border px-3 py-2 text-sm" {...register("description")} />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {isSubmitting ? "Creating..." : "Create channel"}
      </button>
    </form>
  );
}

function EditChannelForm({
  channel,
  onSaved,
  onError,
}: {
  channel: Channel;
  onSaved: (channel: Channel) => void;
  onError: (message: string) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChannelUpdateInput>({
    resolver: zodResolver(channelUpdateSchema),
    defaultValues: {
      name: channel.name,
      description: channel.description ?? "",
      category: channel.category ?? "",
      socialLinks: {
        website: channel.socialLinks?.website ?? "",
        twitter: channel.socialLinks?.twitter ?? "",
        instagram: channel.socialLinks?.instagram ?? "",
        youtube: channel.socialLinks?.youtube ?? "",
      },
    },
  });

  const onSubmit = async (data: ChannelUpdateInput) => {
    const cleanedLinks = Object.fromEntries(
      Object.entries(data.socialLinks ?? {}).filter(([, v]) => v),
    );
    const res = await apiFetch<Channel>(`/channels/${channel.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        name: data.name,
        description: data.description || undefined,
        category: data.category || undefined,
        socialLinks: cleanedLinks,
      }),
    });
    if (res.error) {
      onError(res.error.message);
      return;
    }
    onSaved(res.data!);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div>
        <label className="mb-1 block text-sm font-medium">Channel name</label>
        <input className="w-full rounded border px-3 py-2 text-sm" {...register("name")} />
        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Description</label>
        <textarea rows={3} className="w-full rounded border px-3 py-2 text-sm" {...register("description")} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Category</label>
        <input className="w-full rounded border px-3 py-2 text-sm" {...register("category")} />
      </div>

      <div className="space-y-2 border-t pt-3">
        <p className="text-sm font-semibold">Links</p>
        <input
          placeholder="Website"
          className="w-full rounded border px-3 py-2 text-sm"
          {...register("socialLinks.website")}
        />
        <input
          placeholder="Twitter"
          className="w-full rounded border px-3 py-2 text-sm"
          {...register("socialLinks.twitter")}
        />
        <input
          placeholder="Instagram"
          className="w-full rounded border px-3 py-2 text-sm"
          {...register("socialLinks.instagram")}
        />
        <input
          placeholder="YouTube"
          className="w-full rounded border px-3 py-2 text-sm"
          {...register("socialLinks.youtube")}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {isSubmitting ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
