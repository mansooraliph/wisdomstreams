export type Role = "VIEWER" | "CREATOR" | "MODERATOR" | "ADMIN";
export type Visibility = "PUBLIC" | "UNLISTED" | "PRIVATE" | "SCHEDULED";
export type NotifyLevel = "ALL" | "PERSONALIZED" | "NONE";
export type UserStatus = "ACTIVE" | "SUSPENDED" | "BANNED";
export type ReportStatus = "PENDING" | "REVIEWED" | "DISMISSED";
export type ReportTargetType = "VIDEO" | "COMMENT";

export interface PlatformStats {
  totalUsers: number;
  totalVideos: number;
  totalChannels: number;
  totalViews: number;
}

export interface AdminUser {
  id: string;
  email: string;
  username: string;
  role: Role;
  status: UserStatus;
  emailVerified: boolean;
  createdAt: string;
}

export interface ReportWithTarget {
  id: string;
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  status: ReportStatus;
  createdAt: string;
  reporter: { id: string; username: string };
  target: { id: string; title?: string; body?: string; userId?: string } | null;
}

export interface CategoryItem {
  id: string;
  slug: string;
  name: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: string;
  data: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export interface PublicUser {
  id: string;
  email: string;
  username: string;
  role: Role;
  emailVerified: boolean;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  historyEnabled: boolean;
  likedVideosPublic: boolean;
  createdAt: string;
}

/** Public-facing profile — no email, role, or privacy-setting internals. */
export interface PublicProfile {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  createdAt: string;
}

export interface PlaylistSummary {
  id: string;
  title: string;
  description: string | null;
  visibility: Visibility;
  videoIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface WatchHistoryEntry {
  id: string;
  videoId: string;
  progress: number;
  watchedAt: string;
  video: {
    id: string;
    title: string;
    thumbnailUrl: string | null;
    duration: number | null;
    channelId: string;
  };
}

export interface LikedVideoEntry {
  id: string;
  videoId: string;
  createdAt: string;
  video: {
    id: string;
    title: string;
    thumbnailUrl: string | null;
    duration: number | null;
    channelId: string;
  };
}

export interface Channel {
  id: string;
  userId: string;
  handle: string;
  name: string;
  description: string | null;
  category: string | null;
  socialLinks: Record<string, string> | null;
  sections: unknown[] | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  isVerified: boolean;
  subscriberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChannelAbout {
  description: string | null;
  category: string | null;
  socialLinks: Record<string, string> | null;
  subscriberCount: number;
  createdAt: string;
}

export interface VideoSummary {
  id: string;
  channelId: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  duration: number | null;
  viewCount: number;
  likeCount: number;
  visibility: Visibility;
  publishedAt: string | null;
  createdAt: string;
}

/** GET /search — an Elasticsearch document, not a raw Prisma Video row. */
export interface SearchHit {
  id: string;
  title: string;
  description: string | null;
  channelName: string;
  channelId: string;
  viewCount: number;
  likeCount: number;
  duration: number | null;
  thumbnailUrl: string | null;
}

/** GET /videos/:id — public watch page (or owner viewing their own draft). */
export interface VideoDetail extends VideoSummary {
  tags: string[];
  category: string | null;
  language: string | null;
  commentCount: number;
  muxPlaybackId: string | null;
  muxStatus: string;
  aspectRatio: string | null;
  channel: Channel;
}

export interface CommentAuthor {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface CommentThread {
  id: string;
  videoId: string;
  userId: string;
  parentId: string | null;
  body: string;
  isPinned: boolean;
  isHeld: boolean;
  isHearted: boolean;
  likeCount: number;
  createdAt: string;
  editedAt: string | null;
  user: CommentAuthor;
  _count?: { replies: number };
}

/** Full video shape as seen by the owning creator in Studio. */
export interface StudioVideo {
  id: string;
  channelId: string;
  title: string;
  description: string | null;
  tags: string[];
  category: string | null;
  language: string | null;
  visibility: Visibility;
  thumbnailUrl: string | null;
  duration: number | null;
  muxUploadId: string | null;
  muxAssetId: string | null;
  muxPlaybackId: string | null;
  muxStatus: string;
  scheduledAt: string | null;
  publishedAt: string | null;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
}

export interface ChannelOverview {
  subscriberCount: number;
  videoCount: number;
  totalViews: number;
  totalLikes: number;
  recentVideos: StudioVideo[];
}

export interface InitUploadResponse {
  videoId: string;
  uploadUrl: string;
}

export interface VideoUploadStatus {
  muxStatus: string;
  muxPlaybackId: string | null;
  duration: number | null;
  aspectRatio: string | null;
  thumbnailUrl: string | null;
}

export interface Chapter {
  id: string;
  videoId: string;
  title: string;
  startTime: number;
}

export interface ApiSuccess<T> {
  data: T;
  error: null;
  meta?: Record<string, unknown>;
}

export interface ApiError {
  data: null;
  error: {
    code: string;
    message: string;
  };
  meta?: Record<string, unknown>;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
