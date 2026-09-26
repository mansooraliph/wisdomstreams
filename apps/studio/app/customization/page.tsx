"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, Globe, Link2 } from "lucide-react";
import {
  channelCreateSchema,
  channelUpdateSchema,
  type ChannelCreateInput,
  type ChannelUpdateInput,
  type Channel,
} from "@wisdomstream/shared";
import { apiFetch, apiUpload } from "../../lib/api";
import { AvatarCircle } from "../../components/avatar-circle";

export default function CustomizationPage() {
  const [channel, setChannel] = useState<Channel | null>(null);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
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

  if (loading) return <p className="p-8 text-sm text-gray-500">Loading...</p>;

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-8">
      <h1 className="text-2xl font-bold">Channel customization</h1>

      {channel && (
        <div className="overflow-hidden rounded-xl border bg-white">
          <div className="relative h-32 w-full bg-gray-100">
            {channel.bannerUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={channel.bannerUrl} alt="" className="h-full w-full object-cover" />
            )}
            <label className="absolute bottom-2 right-2 flex cursor-pointer items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium shadow hover:bg-white">
              <Camera size={14} />
              {uploading === "banner" ? "Uploading..." : "Change banner"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && uploadImage("banner", e.target.files[0])}
              />
            </label>
          </div>

          <div className="flex items-center gap-4 p-6">
            <div className="relative -mt-14">
              <div className="rounded-full border-4 border-white">
                <AvatarCircle name={channel.name} imageUrl={channel.avatarUrl} size={80} />
              </div>
              <label className="absolute bottom-0 right-0 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-white shadow ring-1 ring-gray-200 hover:bg-gray-50">
                <Camera size={13} />
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && uploadImage("avatar", e.target.files[0])}
                />
              </label>
            </div>
            <div>
              <p className="font-semibold">{channel.name}</p>
              <p className="text-sm text-gray-500">@{channel.handle}</p>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border bg-white p-6">
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

        {serverError && <p className="mt-3 text-sm text-red-600">{serverError}</p>}
        {saved && <p className="mt-3 text-sm text-green-600">Saved.</p>}
      </div>
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
        <input className="w-full rounded-lg border px-3 py-2 text-sm" {...register("handle")} />
        {errors.handle && <p className="mt-1 text-xs text-red-600">{errors.handle.message}</p>}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Channel name</label>
        <input className="w-full rounded-lg border px-3 py-2 text-sm" {...register("name")} />
        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Description</label>
        <textarea rows={3} className="w-full rounded-lg border px-3 py-2 text-sm" {...register("description")} />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h2 className="font-semibold">Basic info</h2>
      <div>
        <label className="mb-1 block text-sm font-medium">Channel name</label>
        <input className="w-full rounded-lg border px-3 py-2 text-sm" {...register("name")} />
        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Description</label>
        <textarea rows={3} className="w-full rounded-lg border px-3 py-2 text-sm" {...register("description")} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Category</label>
        <input className="w-full rounded-lg border px-3 py-2 text-sm" {...register("category")} />
      </div>

      <div className="space-y-2 border-t pt-4">
        <h2 className="font-semibold">Links</h2>
        <div className="flex items-center gap-2">
          <Globe size={16} className="flex-shrink-0 text-gray-400" />
          <input
            placeholder="Website"
            className="w-full rounded-lg border px-3 py-2 text-sm"
            {...register("socialLinks.website")}
          />
        </div>
        <div className="flex items-center gap-2">
          <Link2 size={16} className="flex-shrink-0 text-gray-400" />
          <input
            placeholder="Twitter"
            className="w-full rounded-lg border px-3 py-2 text-sm"
            {...register("socialLinks.twitter")}
          />
        </div>
        <div className="flex items-center gap-2">
          <Link2 size={16} className="flex-shrink-0 text-gray-400" />
          <input
            placeholder="Instagram"
            className="w-full rounded-lg border px-3 py-2 text-sm"
            {...register("socialLinks.instagram")}
          />
        </div>
        <div className="flex items-center gap-2">
          <Link2 size={16} className="flex-shrink-0 text-gray-400" />
          <input
            placeholder="YouTube"
            className="w-full rounded-lg border px-3 py-2 text-sm"
            {...register("socialLinks.youtube")}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {isSubmitting ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
