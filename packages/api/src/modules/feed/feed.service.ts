import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class FeedService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Phase 1 per the blueprint's own milestones: "Home feed (no
   * recommendations yet — latest videos)". Module 12 replaces this with
   * real personalization/ranking later.
   */
  async getHomeFeed(page: number, limit: number) {
    return this.prisma.video.findMany({
      where: { visibility: "PUBLIC" },
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async getTrending(page: number, limit: number) {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // last 30 days
    return this.prisma.video.findMany({
      where: { visibility: "PUBLIC", publishedAt: { gte: since } },
      orderBy: { viewCount: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async getSubscriptionsFeed(userId: string, page: number, limit: number) {
    const subscriptions = await this.prisma.subscription.findMany({
      where: { subscriberId: userId },
      select: { channelId: true },
    });
    const channelIds = subscriptions.map((s) => s.channelId);
    if (channelIds.length === 0) return [];

    return this.prisma.video.findMany({
      where: { visibility: "PUBLIC", channelId: { in: channelIds } },
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });
  }
}
