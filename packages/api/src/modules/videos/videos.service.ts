import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { Video } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { StorageService } from "../../storage/storage.service";
import { MuxService } from "../../mux/mux.service";
import { SearchService } from "../../search/search.service";
import { NotificationsService } from "../notifications/notifications.service";
import type { MuxWebhookEvent } from "../../mux/mux.service";
import type { UpdateMetadataDto } from "./dto/update-metadata.dto";
import type { UpdateVisibilityDto } from "./dto/update-visibility.dto";
import type { UpdateChaptersDto } from "./dto/update-chapters.dto";

const THUMBNAIL_BUCKET = process.env.MINIO_BUCKET_THUMBNAILS ?? "wisdomstream-thumbnails";

/** Mux auto-generates a thumbnail for every public playback ID at this URL — no extra API call needed. */
function muxThumbnailUrl(playbackId: string | undefined): string | undefined {
  return playbackId ? `https://image.mux.com/${playbackId}/thumbnail.jpg` : undefined;
}

/** A Mux-hosted thumbnail isn't a file in our own bucket — nothing to delete there. */
function isOwnStorageThumbnail(url: string): boolean {
  return !url.startsWith("https://image.mux.com/");
}

@Injectable()
export class VideosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly mux: MuxService,
    private readonly search: SearchService,
    private readonly notifications: NotificationsService,
  ) {}

  async initUpload(userId: string, channelId: string, corsOrigin: string) {
    await this.assertOwnsChannel(userId, channelId);

    const { uploadId, uploadUrl } = await this.mux.createDirectUpload(corsOrigin);

    const video = await this.prisma.video.create({
      data: {
        channelId,
        title: "Untitled video",
        muxUploadId: uploadId,
        muxStatus: "waiting",
      },
    });

    return { videoId: video.id, uploadUrl };
  }

  async getChannelVideosForOwner(userId: string, channelId: string): Promise<Video[]> {
    await this.assertOwnsChannel(userId, channelId);
    return this.prisma.video.findMany({ where: { channelId }, orderBy: { createdAt: "desc" } });
  }

  /**
   * Shared by the public watch page and Studio's own editor: owners can see
   * their video in any state (including PRIVATE/processing drafts);
   * everyone else only sees it once it's PUBLIC or UNLISTED.
   */
  async getVideo(videoId: string, requestingUserId?: string): Promise<Video> {
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
      include: { channel: true },
    });
    if (!video) {
      throw new NotFoundException("Video not found");
    }

    const isOwner = requestingUserId != null && video.channel.userId === requestingUserId;
    if (!isOwner && video.visibility !== "PUBLIC" && video.visibility !== "UNLISTED") {
      throw new NotFoundException("Video not found");
    }

    return video;
  }

  async recordView(videoId: string): Promise<void> {
    await this.prisma.video.update({
      where: { id: videoId },
      data: { viewCount: { increment: 1 } },
    });
  }

  async saveProgress(userId: string, videoId: string, progress: number): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.historyEnabled) return;

    await this.prisma.watchHistory.upsert({
      where: { userId_videoId: { userId, videoId } },
      create: { userId, videoId, progress },
      update: { progress, watchedAt: new Date() },
    });
  }

  async getProgress(userId: string, videoId: string): Promise<number> {
    const entry = await this.prisma.watchHistory.findUnique({
      where: { userId_videoId: { userId, videoId } },
    });
    return entry?.progress ?? 0;
  }

  async likeVideo(userId: string, videoId: string): Promise<void> {
    await this.setVideoReaction(userId, videoId, true);
  }

  async dislikeVideo(userId: string, videoId: string): Promise<void> {
    await this.setVideoReaction(userId, videoId, false);
  }

  async removeVideoReaction(userId: string, videoId: string): Promise<void> {
    const existing = await this.prisma.videoLike.findUnique({
      where: { userId_videoId: { userId, videoId } },
    });
    if (!existing) return;

    await this.prisma.$transaction([
      this.prisma.videoLike.delete({ where: { id: existing.id } }),
      ...(existing.isLike
        ? [this.prisma.video.update({ where: { id: videoId }, data: { likeCount: { decrement: 1 } } })]
        : []),
    ]);
  }

  async reportVideo(userId: string, videoId: string, reason: string) {
    await this.getVideo(videoId, userId);
    return this.prisma.report.create({
      data: { reporterId: userId, targetType: "VIDEO", targetId: videoId, reason },
    });
  }

  private async setVideoReaction(userId: string, videoId: string, isLike: boolean): Promise<void> {
    const existing = await this.prisma.videoLike.findUnique({
      where: { userId_videoId: { userId, videoId } },
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.videoLike.upsert({
        where: { userId_videoId: { userId, videoId } },
        create: { userId, videoId, isLike },
        update: { isLike },
      });

      // Only the like counter is denormalized on Video; dislikes aren't shown publicly.
      if (!existing && isLike) {
        await tx.video.update({ where: { id: videoId }, data: { likeCount: { increment: 1 } } });
      } else if (existing && existing.isLike && !isLike) {
        await tx.video.update({ where: { id: videoId }, data: { likeCount: { decrement: 1 } } });
      } else if (existing && !existing.isLike && isLike) {
        await tx.video.update({ where: { id: videoId }, data: { likeCount: { increment: 1 } } });
      }
    });
  }

  async getRelated(videoId: string, limit = 10): Promise<Video[]> {
    const video = await this.prisma.video.findUnique({ where: { id: videoId } });
    if (!video) {
      throw new NotFoundException("Video not found");
    }

    const or: Prisma.VideoWhereInput[] = [{ channelId: video.channelId }];
    if (video.category) or.push({ category: video.category });

    return this.prisma.video.findMany({
      where: { id: { not: videoId }, visibility: "PUBLIC", OR: or },
      orderBy: { publishedAt: "desc" },
      take: limit,
    });
  }

  async updateMetadata(userId: string, videoId: string, dto: UpdateMetadataDto): Promise<Video> {
    await this.assertOwnsVideo(userId, videoId);
    const updated = await this.prisma.video.update({ where: { id: videoId }, data: dto });
    await this.syncSearchIndex(updated);
    return updated;
  }

  async updateVisibility(userId: string, videoId: string, dto: UpdateVisibilityDto): Promise<Video> {
    const video = await this.assertOwnsVideo(userId, videoId);

    if (dto.visibility === "SCHEDULED" && !dto.scheduledAt) {
      throw new BadRequestException("scheduledAt is required when visibility is SCHEDULED");
    }

    const isFirstPublish = dto.visibility === "PUBLIC" && !video.publishedAt;

    const updated = await this.prisma.video.update({
      where: { id: videoId },
      data: {
        visibility: dto.visibility,
        scheduledAt: dto.visibility === "SCHEDULED" ? dto.scheduledAt : null,
        publishedAt: isFirstPublish ? new Date() : video.publishedAt,
      },
    });
    await this.syncSearchIndex(updated);
    if (isFirstPublish) {
      await this.notifications.notifyNewVideo(updated.channelId, updated.id, updated.title);
    }
    return updated;
  }

  private async syncSearchIndex(video: Video): Promise<void> {
    if (video.visibility === "PUBLIC") {
      const channel = await this.prisma.channel.findUnique({ where: { id: video.channelId } });
      await this.search.indexVideo(video, channel?.name ?? "");
    } else {
      await this.search.removeVideo(video.id);
    }
  }

  async uploadThumbnail(userId: string, videoId: string, file: Express.Multer.File): Promise<Video> {
    const video = await this.assertOwnsVideo(userId, videoId);

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException("Only JPEG, PNG, or WebP images are allowed");
    }

    const extension = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[
      file.mimetype
    ]!;
    const url = await this.storage.uploadFile(THUMBNAIL_BUCKET, file.buffer, file.mimetype, extension);

    if (video.thumbnailUrl && isOwnStorageThumbnail(video.thumbnailUrl)) {
      await this.storage.deleteFile(THUMBNAIL_BUCKET, video.thumbnailUrl);
    }

    return this.prisma.video.update({ where: { id: videoId }, data: { thumbnailUrl: url } });
  }

  async deleteVideo(userId: string, videoId: string): Promise<void> {
    const video = await this.assertOwnsVideo(userId, videoId);
    await this.destroyVideo(video);
  }

  /** Admin override — bypasses the ownership check for moderation takedowns. */
  async forceDeleteVideo(videoId: string): Promise<void> {
    const video = await this.prisma.video.findUnique({ where: { id: videoId } });
    if (!video) {
      throw new NotFoundException("Video not found");
    }
    await this.destroyVideo(video);
  }

  private async destroyVideo(video: Video): Promise<void> {
    if (video.muxAssetId) {
      await this.mux.deleteAsset(video.muxAssetId);
    }
    if (video.thumbnailUrl && isOwnStorageThumbnail(video.thumbnailUrl)) {
      await this.storage.deleteFile(THUMBNAIL_BUCKET, video.thumbnailUrl);
    }

    await this.prisma.video.delete({ where: { id: video.id } });
    await this.search.removeVideo(video.id);
  }

  async getUploadStatus(userId: string, videoId: string) {
    let video = await this.assertOwnsVideo(userId, videoId);

    // The Mux webhook only reaches us if this server has a public URL (a
    // real deployment, or a tunnel like ngrok in dev). Without that, DB
    // status would stay "waiting" forever even after Mux finishes
    // processing — so poll Mux's API directly as a fallback.
    if (video.muxStatus !== "ready" && video.muxStatus !== "errored") {
      video = await this.reconcileWithMux(video);
    }

    return {
      muxStatus: video.muxStatus,
      muxPlaybackId: video.muxPlaybackId,
      duration: video.duration,
      aspectRatio: video.aspectRatio,
      thumbnailUrl: video.thumbnailUrl,
    };
  }

  private async reconcileWithMux(video: Video): Promise<Video> {
    try {
      let assetId = video.muxAssetId;

      if (!assetId && video.muxUploadId) {
        const upload = await this.mux.getUpload(video.muxUploadId);
        if (upload.status === "errored") {
          return this.prisma.video.update({ where: { id: video.id }, data: { muxStatus: "errored" } });
        }
        assetId = upload.asset_id ?? null;
        if (assetId) {
          video = await this.prisma.video.update({ where: { id: video.id }, data: { muxAssetId: assetId } });
        }
      }

      if (!assetId) return video; // Mux hasn't linked an asset to this upload yet.

      const asset = await this.mux.getAsset(assetId);
      if (asset.status === "errored") {
        return this.prisma.video.update({ where: { id: video.id }, data: { muxStatus: "errored" } });
      }
      if (asset.status === "ready") {
        const playbackId = asset.playback_ids?.[0]?.id;
        const updated = await this.prisma.video.update({
          where: { id: video.id },
          data: {
            muxAssetId: assetId,
            muxPlaybackId: playbackId,
            muxStatus: "ready",
            duration: asset.duration,
            aspectRatio: asset.aspect_ratio,
            thumbnailUrl: video.thumbnailUrl ?? muxThumbnailUrl(playbackId),
          },
        });
        await this.syncSearchIndex(updated);
        return updated;
      }

      return video; // Still preparing on Mux's side.
    } catch {
      // Mux API hiccup — don't fail the status check, just report current DB state.
      return video;
    }
  }

  async updateChapters(userId: string, videoId: string, dto: UpdateChaptersDto) {
    await this.assertOwnsVideo(userId, videoId);

    return this.prisma.$transaction(async (tx) => {
      await tx.chapter.deleteMany({ where: { videoId } });
      if (dto.chapters.length > 0) {
        await tx.chapter.createMany({
          data: dto.chapters.map((c) => ({ videoId, title: c.title, startTime: c.startTime })),
        });
      }
      return tx.chapter.findMany({ where: { videoId }, orderBy: { startTime: "asc" } });
    });
  }

  async handleWebhookEvent(event: MuxWebhookEvent): Promise<void> {
    const data = event.data as Record<string, unknown>;

    switch (event.type) {
      case "video.upload.asset_created": {
        const uploadId = data.id as string | undefined;
        const assetId = data.asset_id as string | undefined;
        if (!uploadId || !assetId) break;
        await this.prisma.video.updateMany({
          where: { muxUploadId: uploadId },
          data: { muxAssetId: assetId },
        });
        break;
      }

      case "video.asset.ready": {
        const assetId = data.id as string | undefined;
        const uploadId = data.upload_id as string | undefined;
        if (!assetId) break;

        const playbackIds = data.playback_ids as Array<{ id: string }> | undefined;
        const duration = data.duration as number | undefined;
        const aspectRatio = data.aspect_ratio as string | undefined;

        const target = await this.prisma.video.findFirst({
          where: uploadId ? { muxUploadId: uploadId } : { muxAssetId: assetId },
        });
        if (!target) break;

        const playbackId = playbackIds?.[0]?.id;
        const updated = await this.prisma.video.update({
          where: { id: target.id },
          data: {
            muxAssetId: assetId,
            muxPlaybackId: playbackId,
            muxStatus: "ready",
            duration,
            aspectRatio,
            thumbnailUrl: target.thumbnailUrl ?? muxThumbnailUrl(playbackId),
          },
        });
        await this.syncSearchIndex(updated);
        break;
      }

      case "video.asset.errored": {
        const assetId = data.id as string | undefined;
        const uploadId = data.upload_id as string | undefined;
        if (!assetId && !uploadId) break;

        await this.prisma.video.updateMany({
          where: uploadId ? { muxUploadId: uploadId } : { muxAssetId: assetId },
          data: { muxStatus: "errored" },
        });
        break;
      }
    }
  }

  private async assertOwnsVideo(userId: string, videoId: string): Promise<Video> {
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
      include: { channel: true },
    });
    if (!video) {
      throw new NotFoundException("Video not found");
    }
    if (video.channel.userId !== userId) {
      throw new ForbiddenException("You do not own this video");
    }
    return video;
  }

  private async assertOwnsChannel(userId: string, channelId: string): Promise<void> {
    const channel = await this.prisma.channel.findUnique({ where: { id: channelId } });
    if (!channel) {
      throw new NotFoundException("Channel not found");
    }
    if (channel.userId !== userId) {
      throw new ForbiddenException("You do not own this channel");
    }
  }
}
