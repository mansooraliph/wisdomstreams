import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, type Role, type UserStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { VideosService } from "../videos/videos.service";
import { CommentsService } from "../comments/comments.service";
import { NotificationsService } from "../notifications/notifications.service";

const ADMIN_USER_SELECT = {
  id: true,
  email: true,
  username: true,
  role: true,
  status: true,
  emailVerified: true,
  createdAt: true,
} as const;

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly videosService: VideosService,
    private readonly commentsService: CommentsService,
    private readonly notifications: NotificationsService,
  ) {}

  async getStats() {
    const [totalUsers, totalVideos, totalChannels, viewAggregate] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.video.count(),
      this.prisma.channel.count(),
      this.prisma.video.aggregate({ _sum: { viewCount: true } }),
    ]);

    return {
      totalUsers,
      totalVideos,
      totalChannels,
      totalViews: viewAggregate._sum.viewCount ?? 0,
    };
  }

  async listUsers(search: string | undefined, page: number, limit: number) {
    const where: Prisma.UserWhereInput = search
      ? {
          OR: [
            { email: { contains: search, mode: "insensitive" } },
            { username: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    return this.prisma.user.findMany({
      where,
      select: ADMIN_USER_SELECT,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async updateUserStatus(userId: string, status: UserStatus) {
    await this.getUserOr404(userId);
    return this.prisma.user.update({ where: { id: userId }, data: { status }, select: ADMIN_USER_SELECT });
  }

  async updateUserRole(userId: string, role: Role) {
    await this.getUserOr404(userId);
    return this.prisma.user.update({ where: { id: userId }, data: { role }, select: ADMIN_USER_SELECT });
  }

  async listReports(status?: "PENDING" | "REVIEWED" | "DISMISSED") {
    const reports = await this.prisma.report.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: "desc" },
      include: { reporter: { select: { id: true, username: true } } },
    });

    return Promise.all(
      reports.map(async (report) => ({
        ...report,
        target:
          report.targetType === "VIDEO"
            ? await this.prisma.video.findUnique({
                where: { id: report.targetId },
                select: { id: true, title: true },
              })
            : await this.prisma.comment.findUnique({
                where: { id: report.targetId },
                select: { id: true, body: true, userId: true },
              }),
      })),
    );
  }

  async actionReport(reportId: string, action: "remove" | "dismiss" | "warn") {
    const report = await this.prisma.report.findUnique({ where: { id: reportId } });
    if (!report) {
      throw new NotFoundException("Report not found");
    }

    if (action === "dismiss") {
      return this.prisma.report.update({ where: { id: reportId }, data: { status: "DISMISSED" } });
    }

    if (action === "remove") {
      if (report.targetType === "VIDEO") {
        await this.videosService.forceDeleteVideo(report.targetId);
      } else {
        const comment = await this.prisma.comment.findUnique({ where: { id: report.targetId } });
        if (comment) {
          await this.commentsService.adminDeleteComment(report.targetId);
        }
      }
    } else if (action === "warn") {
      const ownerId = await this.getTargetOwnerId(report.targetType, report.targetId);
      if (ownerId) {
        await this.notifications.createModerationWarning(ownerId, report.reason);
      }
    }

    return this.prisma.report.update({ where: { id: reportId }, data: { status: "REVIEWED" } });
  }

  private async getTargetOwnerId(targetType: "VIDEO" | "COMMENT", targetId: string): Promise<string | null> {
    if (targetType === "COMMENT") {
      const comment = await this.prisma.comment.findUnique({ where: { id: targetId } });
      return comment?.userId ?? null;
    }
    const video = await this.prisma.video.findUnique({ where: { id: targetId }, include: { channel: true } });
    return video?.channel.userId ?? null;
  }

  async listChannels(search: string | undefined, page: number, limit: number) {
    const where: Prisma.ChannelWhereInput = search
      ? {
          OR: [
            { handle: { contains: search, mode: "insensitive" } },
            { name: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    return this.prisma.channel.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async verifyChannel(channelId: string, isVerified: boolean) {
    const channel = await this.prisma.channel.findUnique({ where: { id: channelId } });
    if (!channel) {
      throw new NotFoundException("Channel not found");
    }
    return this.prisma.channel.update({ where: { id: channelId }, data: { isVerified } });
  }

  async forceDeleteVideo(videoId: string): Promise<void> {
    await this.videosService.forceDeleteVideo(videoId);
  }

  async listCategories() {
    return this.prisma.category.findMany({ orderBy: { name: "asc" } });
  }

  async createCategory(name: string, slug: string) {
    try {
      return await this.prisma.category.create({ data: { name, slug } });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new BadRequestException("That category slug already exists");
      }
      throw err;
    }
  }

  async updateCategory(id: string, name: string) {
    await this.getCategoryOr404(id);
    return this.prisma.category.update({ where: { id }, data: { name } });
  }

  async deleteCategory(id: string): Promise<void> {
    await this.getCategoryOr404(id);
    await this.prisma.category.delete({ where: { id } });
  }

  private async getUserOr404(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return user;
  }

  private async getCategoryOr404(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException("Category not found");
    }
    return category;
  }
}
