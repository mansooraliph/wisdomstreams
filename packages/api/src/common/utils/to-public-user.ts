import type { User } from "@prisma/client";

/**
 * Explicit allow-list rather than destructure-exclude: a new sensitive
 * field added to User later (e.g. a 2FA secret) is excluded by default
 * instead of leaking until someone remembers to blocklist it.
 */
export function toPublicUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    emailVerified: user.emailVerified,
    displayName: user.displayName,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    bannerUrl: user.bannerUrl,
    historyEnabled: user.historyEnabled,
    likedVideosPublic: user.likedVideosPublic,
    createdAt: user.createdAt,
  };
}

export function toPublicProfile(user: User) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    bannerUrl: user.bannerUrl,
    createdAt: user.createdAt,
  };
}
