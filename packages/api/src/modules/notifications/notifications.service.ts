import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, page: number, limit: number) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async markRead(userId: string, notificationId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  async markAllRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
  }

  async remove(userId: string, notificationId: string): Promise<void> {
    await this.prisma.notification.deleteMany({ where: { id: notificationId, userId } });
  }

  /**
   * Internal — called by VideosService when a video is first published.
   * Email delivery ("New video published" per the blueprint's notification
   * table) isn't wired up yet; this only creates the in-app notification.
   */
  async notifyNewVideo(channelId: string, videoId: string, videoTitle: string): Promise<void> {
    const subscribers = await this.prisma.subscription.findMany({
      where: { channelId, notifyLevel: { not: "NONE" } },
      select: { subscriberId: true },
    });
    if (subscribers.length === 0) return;

    await this.prisma.notification.createMany({
      data: subscribers.map((s) => ({
        userId: s.subscriberId,
        type: "new_video",
        data: { channelId, videoId, videoTitle },
      })),
    });
  }

  /** Internal — called by AdminService when a report is actioned as "warn". */
  async createModerationWarning(userId: string, reason: string): Promise<void> {
    await this.prisma.notification.create({
      data: { userId, type: "moderation_warning", data: { reason } },
    });
  }
}
