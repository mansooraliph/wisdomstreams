import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import type { CreateCommentDto } from "./dto/create-comment.dto";

const COMMENT_AUTHOR_SELECT = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
} as const;

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async listComments(videoId: string, page: number, limit: number, sort: "top" | "new") {
    return this.prisma.comment.findMany({
      where: { videoId, parentId: null, isHeld: false },
      orderBy: sort === "top" ? [{ isPinned: "desc" }, { likeCount: "desc" }] : { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { user: { select: COMMENT_AUTHOR_SELECT }, _count: { select: { replies: true } } },
    });
  }

  async createComment(userId: string, videoId: string, dto: CreateCommentDto) {
    const video = await this.prisma.video.findUnique({ where: { id: videoId } });
    if (!video) {
      throw new NotFoundException("Video not found");
    }

    // Threading is one level deep: replying to a reply attaches to its
    // top-level parent instead of creating a third level.
    let parentId = dto.parentId ?? null;
    if (parentId) {
      const parent = await this.prisma.comment.findUnique({ where: { id: parentId } });
      if (!parent || parent.videoId !== videoId) {
        throw new NotFoundException("Parent comment not found");
      }
      parentId = parent.parentId ?? parent.id;
    }

    const [comment] = await this.prisma.$transaction([
      this.prisma.comment.create({
        data: { videoId, userId, body: dto.body, parentId },
        include: { user: { select: COMMENT_AUTHOR_SELECT } },
      }),
      this.prisma.video.update({ where: { id: videoId }, data: { commentCount: { increment: 1 } } }),
    ]);

    return comment;
  }

  async replyToComment(userId: string, parentCommentId: string, body: string) {
    const parent = await this.getCommentOr404(parentCommentId);
    const videoId = parent.videoId;
    const topLevelParentId = parent.parentId ?? parent.id;

    const [comment] = await this.prisma.$transaction([
      this.prisma.comment.create({
        data: { videoId, userId, body, parentId: topLevelParentId },
        include: { user: { select: COMMENT_AUTHOR_SELECT } },
      }),
      this.prisma.video.update({ where: { id: videoId }, data: { commentCount: { increment: 1 } } }),
    ]);

    return comment;
  }

  async updateComment(userId: string, commentId: string, body: string) {
    const comment = await this.assertOwnsComment(userId, commentId);
    return this.prisma.comment.update({
      where: { id: comment.id },
      data: { body, editedAt: new Date() },
    });
  }

  async deleteComment(userId: string, commentId: string): Promise<void> {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: { video: { include: { channel: true } } },
    });
    if (!comment) {
      throw new NotFoundException("Comment not found");
    }
    const isAuthor = comment.userId === userId;
    const isVideoOwner = comment.video.channel.userId === userId;
    if (!isAuthor && !isVideoOwner) {
      throw new ForbiddenException("You cannot delete this comment");
    }

    await this.destroyComment(commentId, comment.videoId);
  }

  /** Admin override — bypasses the author/video-owner check for moderation takedowns. */
  async adminDeleteComment(commentId: string): Promise<void> {
    const comment = await this.getCommentOr404(commentId);
    await this.destroyComment(commentId, comment.videoId);
  }

  private async destroyComment(commentId: string, videoId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.comment.delete({ where: { id: commentId } }),
      this.prisma.video.update({
        where: { id: videoId },
        data: { commentCount: { decrement: 1 } },
      }),
    ]);
  }

  async likeComment(userId: string, commentId: string) {
    await this.getCommentOr404(commentId);
    try {
      await this.prisma.$transaction([
        this.prisma.commentLike.create({ data: { userId, commentId } }),
        this.prisma.comment.update({
          where: { id: commentId },
          data: { likeCount: { increment: 1 } },
        }),
      ]);
    } catch {
      // Already liked — treat as idempotent.
    }
    return { success: true };
  }

  async unlikeComment(userId: string, commentId: string) {
    const existing = await this.prisma.commentLike.findUnique({
      where: { userId_commentId: { userId, commentId } },
    });
    if (existing) {
      await this.prisma.$transaction([
        this.prisma.commentLike.delete({ where: { id: existing.id } }),
        this.prisma.comment.update({
          where: { id: commentId },
          data: { likeCount: { decrement: 1 } },
        }),
      ]);
    }
    return { success: true };
  }

  async getReplies(commentId: string, page: number, limit: number) {
    await this.getCommentOr404(commentId);
    return this.prisma.comment.findMany({
      where: { parentId: commentId },
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { user: { select: COMMENT_AUTHOR_SELECT } },
    });
  }

  async pinComment(userId: string, commentId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: { video: { include: { channel: true } } },
    });
    if (!comment) {
      throw new NotFoundException("Comment not found");
    }
    if (comment.video.channel.userId !== userId) {
      throw new ForbiddenException("Only the video's channel owner can pin a comment");
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.comment.updateMany({
        where: { videoId: comment.videoId, isPinned: true },
        data: { isPinned: false },
      });
      return tx.comment.update({ where: { id: commentId }, data: { isPinned: true } });
    });
  }

  async reportComment(userId: string, commentId: string, reason: string) {
    await this.getCommentOr404(commentId);
    return this.prisma.report.create({
      data: { reporterId: userId, targetType: "COMMENT", targetId: commentId, reason },
    });
  }

  private async getCommentOr404(commentId: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) {
      throw new NotFoundException("Comment not found");
    }
    return comment;
  }

  private async assertOwnsComment(userId: string, commentId: string) {
    const comment = await this.getCommentOr404(commentId);
    if (comment.userId !== userId) {
      throw new ForbiddenException("You do not own this comment");
    }
    return comment;
  }
}
