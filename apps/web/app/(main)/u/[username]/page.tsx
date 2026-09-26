import type { ApiResponse, PublicProfile } from "@wisdomstream/shared";
import { serverApiFetch } from "../../../../lib/api";

export default async function UserProfilePage({ params }: { params: { username: string } }) {
  const res = (await serverApiFetch<PublicProfile>(`/users/${params.username}`)) as ApiResponse<PublicProfile>;

  if (!res.data) {
    return <p className="p-6 text-sm text-gray-500">User not found.</p>;
  }

  const profile = res.data;

  return (
    <main className="mx-auto max-w-2xl">
      <div className="h-32 w-full rounded bg-gray-200">
        {profile.bannerUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.bannerUrl} alt="" className="h-32 w-full rounded object-cover" />
        )}
      </div>
      <div className="flex items-end gap-4 px-6 pt-4">
        <div className="-mt-12 h-20 w-20 flex-shrink-0 rounded-full border-4 border-white bg-gray-300">
          {profile.avatarUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
          )}
        </div>
        <div>
          <h1 className="text-xl font-semibold">{profile.displayName ?? profile.username}</h1>
          <p className="text-sm text-gray-500">@{profile.username}</p>
        </div>
      </div>
      {profile.bio && <p className="px-6 pt-4 text-sm text-gray-700">{profile.bio}</p>}
      <p className="px-6 pb-6 pt-2 text-xs text-gray-400">
        Joined {new Date(profile.createdAt).toLocaleDateString()}
      </p>
    </main>
  );
}
