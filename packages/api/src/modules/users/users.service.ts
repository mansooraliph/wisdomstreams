import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { User } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { toPublicProfile } from "../../common/utils/to-public-user";
import type { UpdateProfileDto } from "./dto/update-profile.dto";
import type { CreatePlaylistDto } from "./dto/create-playlist.dto";
import type { UpdatePlaylistDto } from "./dto/update-playlist.dto";

const VIDEO_SUMMARY_SELECT = {
  id: true,
  title: true,
  thumbnailUrl: true,
  duration: true,
  channelId: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublicProfile(username: string) {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return toPublicProfile(user);
  }

  async getMySubscriptions(userId: string) {
    const subscriptions = await this.prisma.subscription.findMany({
      where: { subscriberId: userId },
      include: { channel: true },
      orderBy: { createdAt: "desc" },
    });
    return subscriptions.map((s) => ({ ...s.channel, notifyLevel: s.notifyLevel }));
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<User> {
    return this.prisma.user.update({ where: { id: userId }, data: dto });
  }

  async deleteAccount(userId: string): Promise<void> {
    const channelCount = await this.prisma.channel.count({ where: { userId } });
    if (channelCount > 0) {
      throw new ConflictException(
        "Delete or transfer your channels before deleting your account",
      );
    }
    await this.prisma.user.delete({ where: { id: userId } });
  }

  async getHistory(userId: string, page: number, limit: number) {
    return this.prisma.watchHistory.findMany({
      where: { userId },
      orderBy: { watchedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { video: { select: VIDEO_SUMMARY_SELECT } },
    });
  }

  async clearHistory(userId: string): Promise<void> {
    await this.prisma.watchHistory.deleteMany({ where: { userId } });
  }

  async removeHistoryEntry(userId: string, videoId: string): Promise<void> {
    await this.prisma.watchHistory.deleteMany({ where: { userId, videoId } });
  }

  async getLikedVideos(userId: string, page: number, limit: number) {
    return this.prisma.videoLike.findMany({
      where: { userId, isLike: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { video: { select: VIDEO_SUMMARY_SELECT } },
    });
  }

  async getPlaylists(userId: string) {
    return this.prisma.playlist.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });
  }

  async getPlaylist(userId: string, playlistId: string) {
    return this.assertOwnsPlaylist(userId, playlistId);
  }

  async createPlaylist(userId: string, dto: CreatePlaylistDto) {
    return this.prisma.playlist.create({
      data: {
        userId,
        title: dto.title,
        description: dto.description,
        visibility: dto.visibility,
      },
    });
  }

  async updatePlaylist(userId: string, playlistId: string, dto: UpdatePlaylistDto) {
    await this.assertOwnsPlaylist(userId, playlistId);
    return this.prisma.playlist.update({ where: { id: playlistId }, data: dto });
  }

  async deletePlaylist(userId: string, playlistId: string): Promise<void> {
    await this.assertOwnsPlaylist(userId, playlistId);
    await this.prisma.playlist.delete({ where: { id: playlistId } });
  }

  async addVideoToPlaylist(userId: string, playlistId: string, videoId: string) {
    const playlist = await this.assertOwnsPlaylist(userId, playlistId);

    const video = await this.prisma.video.findUnique({ where: { id: videoId } });
    if (!video) {
      throw new BadRequestException("Video not found");
    }
    if (playlist.videoIds.includes(videoId)) {
      return playlist;
    }

    return this.prisma.playlist.update({
      where: { id: playlistId },
      data: { videoIds: { push: videoId } },
    });
  }

  async removeVideoFromPlaylist(userId: string, playlistId: string, videoId: string) {
    const playlist = await this.assertOwnsPlaylist(userId, playlistId);
    return this.prisma.playlist.update({
      where: { id: playlistId },
      data: { videoIds: playlist.videoIds.filter((id) => id !== videoId) },
    });
  }

  private async assertOwnsPlaylist(userId: string, playlistId: string) {
    const playlist = await this.prisma.playlist.findUnique({ where: { id: playlistId } });
    if (!playlist) {
      throw new NotFoundException("Playlist not found");
    }
    if (playlist.userId !== userId) {
      throw new ForbiddenException("You do not own this playlist");
    }
    return playlist;
  }
}
