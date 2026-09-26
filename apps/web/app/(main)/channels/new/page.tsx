"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { channelCreateSchema, type ChannelCreateInput, type Channel } from "@wisdomstream/shared";
import { apiFetch } from "../../../../lib/api";
import { useAuth } from "../../../../lib/auth-context";

export default function CreateChannelPage() {
  const router = useRouter();
  const { user, loading: authLoading, refresh } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChannelCreateInput>({ resolver: zodResolver(channelCreateSchema) });

  const onSubmit = async (data: ChannelCreateInput) => {
    setServerError(null);
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
      setServerError(res.error.message);
      return;
    }
    await refresh();
    router.push(`/channel/${res.data!.handle}`);
  };

  if (authLoading) return null;
  if (!user) return <p className="p-6 text-sm text-gray-500">Sign in to create a channel.</p>;

  return (
    <main className="mx-auto max-w-lg space-y-4 p-6">
      <h1 className="text-xl font-semibold">Create your channel</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div>
          <label className="mb-1 block text-sm font-medium">Handle</label>
          <div className="flex items-center gap-1">
            <span className="text-sm text-gray-500">@</span>
            <input className="w-full rounded border px-3 py-2 text-sm" {...register("handle")} />
          </div>
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

        <div>
          <label className="mb-1 block text-sm font-medium">Category</label>
          <input className="w-full rounded border px-3 py-2 text-sm" {...register("category")} />
        </div>

        {serverError && <p className="text-sm text-red-600">{serverError}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded bg-blue-600 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {isSubmitting ? "Creating..." : "Create channel"}
        </button>
      </form>
    </main>
  );
}
