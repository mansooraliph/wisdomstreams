import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, type NotifyLevel } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { StorageService } from "../../storage/storage.service";
import type { CreateChannelDto } from "./dto/create-channel.dto";
import type { UpdateChannelDto } from "./dto/update-channel.dto";
import type { CreatePlaylistDto } from "../users/dto/create-playlist.dto";
import type { UpdatePlaylistDto } from "../users/dto/update-playlist.dto";

const AVATAR_BUCKET = process.env.MINIO_BUCKET_AVATARS ?? "wisdomstream-avatars";
const BANNER_BUCKET = process.env.MINIO_BUCKET_BANNERS ?? "wisdomstream-banners";

@Injectable()
export class ChannelsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async createChannel(userId: string, dto: CreateChannelDto) {
    try {
      const channel = await this.prisma.channel.create({
        data: {
          userId,
          handle: dto.handle,
          name: dto.name,
          description: dto.description,
          category: dto.category,
        },
      });

      // Creating a channel is what makes someone a creator.
      await this.prisma.user.updateMany({
        where: { id: userId, role: "VIEWER" },
        data: { role: "CREATOR" },
      });

      return channel;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ConflictException("That channel handle is already taken");
      }
      throw err;
    }
  }

  async getMyChannels(userId: string) {
    return this.prisma.channel.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });
  }

  async getByHandle(handle: string) {
    const channel = await this.prisma.channel.findUnique({ where: { handle } });
    if (!channel) {
      throw new NotFoundException("Channel not found");
    }
    return channel;
  }

  async updateChannel(userId: string, channelId: string, dto: UpdateChannelDto) {
    await this.assertOwnsChannel(userId, channelId);
    return this.prisma.channel.update({ where: { id: channelId }, data: dto });
  }

  async deleteChannel(userId: string, channelId: string): Promise<void> {
    const channel = await this.assertOwnsChannel(userId, channelId);

    const [videoCount, playlistCount] = await Promise.all([
      this.prisma.video.count({ where: { channelId } }),
      this.prisma.playlist.count({ where: { channelId } }),
    ]);
    if (videoCount > 0 || playlistCount > 0) {
      throw new ConflictException("Delete this channel's videos and playlists before deleting it");
    }

    if (channel.avatarUrl) await this.storage.deleteFile(AVATAR_BUCKET, channel.avatarUrl);
    if (channel.bannerUrl) await this.storage.deleteFile(BANNER_BUCKET, channel.bannerUrl);

    await this.prisma.channel.delete({ where: { id: channelId } });
  }

  async getVideos(channelId: string, page: number, limit: number) {
    await this.getById(channelId);
    return this.prisma.video.findMany({
      where: { channelId, visibility: "PUBLIC" },
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async getPlaylists(channelId: string) {
    await this.getById(channelId);
    return this.prisma.playlist.findMany({
      where: { channelId, visibility: "PUBLIC" },
      orderBy: { updatedAt: "desc" },
    });
  }

  async getOverview(userId: string, channelId: string) {
    const channel = await this.assertOwnsChannel(userId, channelId);
    const [videoCount, aggregate, recentVideos] = await Promise.all([
      this.prisma.video.count({ where: { channelId } }),
      this.prisma.video.aggregate({
        where: { channelId },
        _sum: { viewCount: true, likeCount: true },
      }),
      this.prisma.video.findMany({
        where: { channelId },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    return {
      subscriberCount: channel.subscriberCount,
      videoCount,
      totalViews: aggregate._sum.viewCount ?? 0,
      totalLikes: aggregate._sum.likeCount ?? 0,
      recentVideos,
    };
  }

  async getMyChannelPlaylists(userId: string, channelId: string) {
    await this.assertOwnsChannel(userId, channelId);
    return this.prisma.playlist.findMany({ where: { channelId }, orderBy: { updatedAt: "desc" } });
  }

  async createChannelPlaylist(userId: string, channelId: string, dto: CreatePlaylistDto) {
    await this.assertOwnsChannel(userId, channelId);
    return this.prisma.playlist.create({
      data: {
        channelId,
        title: dto.title,
        description: dto.description,
        visibility: dto.visibility,
      },
    });
  }

  async updateChannelPlaylist(
    userId: string,
    channelId: string,
    playlistId: string,
    dto: UpdatePlaylistDto,
  ) {
    await this.assertOwnsChannelPlaylist(userId, channelId, playlistId);
    return this.prisma.playlist.update({ where: { id: playlistId }, data: dto });
  }

  async deleteChannelPlaylist(userId: string, channelId: string, playlistId: string): Promise<void> {
    await this.assertOwnsChannelPlaylist(userId, channelId, playlistId);
    await this.prisma.playlist.delete({ where: { id: playlistId } });
  }

  private async assertOwnsChannelPlaylist(userId: string, channelId: string, playlistId: string) {
    await this.assertOwnsChannel(userId, channelId);
    const playlist = await this.prisma.playlist.findUnique({ where: { id: playlistId } });
    if (!playlist || playlist.channelId !== channelId) {
      throw new NotFoundException("Playlist not found");
    }
    return playlist;
  }

  async subscribe(userId: string, channelId: string, notifyLevel: NotifyLevel = "PERSONALIZED") {
    const channel = await this.getById(channelId);
    if (channel.userId === userId) {
      throw new BadRequestException("You cannot subscribe to your own channel");
    }

    const existing = await this.prisma.subscription.findUnique({
      where: { subscriberId_channelId: { subscriberId: userId, channelId } },
    });
    if (existing) return existing;

    const [subscription] = await this.prisma.$transaction([
      this.prisma.subscription.create({ data: { subscriberId: userId, channelId, notifyLevel } }),
      this.prisma.channel.update({
        where: { id: channelId },
        data: { subscriberCount: { increment: 1 } },
      }),
    ]);
    return subscription;
  }

  async unsubscribe(userId: string, channelId: string): Promise<void> {
    const existing = await this.prisma.subscription.findUnique({
      where: { subscriberId_channelId: { subscriberId: userId, channelId } },
    });
    if (!existing) return;

    await this.prisma.$transaction([
      this.prisma.subscription.delete({ where: { id: existing.id } }),
      this.prisma.channel.update({
        where: { id: channelId },
        data: { subscriberCount: { decrement: 1 } },
      }),
    ]);
  }

  async updateNotifyLevel(userId: string, channelId: string, notifyLevel: NotifyLevel) {
    const existing = await this.prisma.subscription.findUnique({
      where: { subscriberId_channelId: { subscriberId: userId, channelId } },
    });
    if (!existing) {
      throw new NotFoundException("You are not subscribed to this channel");
    }
    return this.prisma.subscription.update({ where: { id: existing.id }, data: { notifyLevel } });
  }

  async getSubscriberCount(channelId: string): Promise<{ subscriberCount: number }> {
    const channel = await this.getById(channelId);
    return { subscriberCount: channel.subscriberCount };
  }

  async getSubscriptionStatus(userId: string, channelId: string) {
    const existing = await this.prisma.subscription.findUnique({
      where: { subscriberId_channelId: { subscriberId: userId, channelId } },
    });
    return { subscribed: !!existing, notifyLevel: existing?.notifyLevel ?? null };
  }

  async getAbout(channelId: string) {
    const channel = await this.getById(channelId);
    return {
      description: channel.description,
      category: channel.category,
      socialLinks: channel.socialLinks,
      subscriberCount: channel.subscriberCount,
      createdAt: channel.createdAt,
    };
  }

  async updateSections(userId: string, channelId: string, sections: unknown[]) {
    await this.assertOwnsChannel(userId, channelId);
    return this.prisma.channel.update({
      where: { id: channelId },
      data: { sections: sections as Prisma.InputJsonValue },
    });
  }

  async uploadAvatar(userId: string, channelId: string, file: Express.Multer.File) {
    const channel = await this.assertOwnsChannel(userId, channelId);
    this.assertIsImage(file);

    const url = await this.storage.uploadFile(
      AVATAR_BUCKET,
      file.buffer,
      file.mimetype,
      this.extensionFor(file.mimetype),
    );
    if (channel.avatarUrl) await this.storage.deleteFile(AVATAR_BUCKET, channel.avatarUrl);

    return this.prisma.channel.update({ where: { id: channelId }, data: { avatarUrl: url } });
  }

  async uploadBanner(userId: string, channelId: string, file: Express.Multer.File) {
    const channel = await this.assertOwnsChannel(userId, channelId);
    this.assertIsImage(file);

    const url = await this.storage.uploadFile(
      BANNER_BUCKET,
      file.buffer,
      file.mimetype,
      this.extensionFor(file.mimetype),
    );
    if (channel.bannerUrl) await this.storage.deleteFile(BANNER_BUCKET, channel.bannerUrl);

    return this.prisma.channel.update({ where: { id: channelId }, data: { bannerUrl: url } });
  }

  private async getById(channelId: string) {
    const channel = await this.prisma.channel.findUnique({ where: { id: channelId } });
    if (!channel) {
      throw new NotFoundException("Channel not found");
    }
    return channel;
  }

  private async assertOwnsChannel(userId: string, channelId: string) {
    const channel = await this.getById(channelId);
    if (channel.userId !== userId) {
      throw new ForbiddenException("You do not own this channel");
    }
    return channel;
  }

  private assertIsImage(file: Express.Multer.File) {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException("Only JPEG, PNG, or WebP images are allowed");
    }
  }

  private extensionFor(mimetype: string): string {
    return { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[mimetype] ?? "bin";
  }
}
