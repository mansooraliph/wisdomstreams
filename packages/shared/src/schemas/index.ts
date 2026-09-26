import { z } from "zod";

export const videoMetadataSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(5000).optional().or(z.literal("")),
  tags: z.array(z.string()).max(500).default([]),
  category: z.string().optional().or(z.literal("")),
  language: z.string().max(10).optional().or(z.literal("")),
});

export const videoVisibilitySchema = z.object({
  visibility: z.enum(["PUBLIC", "UNLISTED", "PRIVATE", "SCHEDULED"]),
  scheduledAt: z.coerce.date().optional(),
});

export const channelCreateSchema = z.object({
  handle: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_-]+$/, "Handle can only contain lowercase letters, numbers, hyphens, and underscores"),
  name: z.string().min(1).max(60),
  description: z.string().max(1000).optional().or(z.literal("")),
  category: z.string().max(50).optional().or(z.literal("")),
});

export const channelUpdateSchema = z.object({
  name: z.string().min(1).max(60).optional(),
  description: z.string().max(1000).optional().or(z.literal("")),
  category: z.string().max(50).optional().or(z.literal("")),
  socialLinks: z
    .object({
      website: z.string().url().optional().or(z.literal("")),
      twitter: z.string().url().optional().or(z.literal("")),
      instagram: z.string().url().optional().or(z.literal("")),
      youtube: z.string().url().optional().or(z.literal("")),
    })
    .partial()
    .optional(),
});

export const commentCreateSchema = z.object({
  body: z.string().min(1).max(10000),
  parentId: z.string().cuid().optional(),
});

export const registerSchema = z.object({
  email: z.string().email(),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, hyphens, and underscores"),
  password: z.string().min(8).max(72),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(72),
});

export const updateProfileSchema = z.object({
  displayName: z.string().max(60).optional().or(z.literal("")),
  bio: z.string().max(1000).optional().or(z.literal("")),
  avatarUrl: z.string().url().optional().or(z.literal("")),
  bannerUrl: z.string().url().optional().or(z.literal("")),
  historyEnabled: z.boolean(),
  likedVideosPublic: z.boolean(),
});

export const createPlaylistSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(1000).optional().or(z.literal("")),
  visibility: z.enum(["PUBLIC", "UNLISTED", "PRIVATE"]).default("PUBLIC"),
});

export const updatePlaylistSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(1000).optional().or(z.literal("")),
  visibility: z.enum(["PUBLIC", "UNLISTED", "PRIVATE"]).optional(),
});

export type VideoMetadataInput = z.infer<typeof videoMetadataSchema>;
export type VideoVisibilityInput = z.infer<typeof videoVisibilitySchema>;
export type ChannelCreateInput = z.infer<typeof channelCreateSchema>;
export type ChannelUpdateInput = z.infer<typeof channelUpdateSchema>;
export type CommentCreateInput = z.infer<typeof commentCreateSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreatePlaylistInput = z.infer<typeof createPlaylistSchema>;
export type UpdatePlaylistInput = z.infer<typeof updatePlaylistSchema>;
