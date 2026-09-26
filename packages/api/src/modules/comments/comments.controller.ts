import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import type { User } from "@prisma/client";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";
import { CommentsService } from "./comments.service";
import { UpdateCommentDto } from "./dto/update-comment.dto";
import { ReportDto } from "./dto/report.dto";

@Controller("comments")
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  async update(@CurrentUser() user: User, @Param("id") id: string, @Body() dto: UpdateCommentDto) {
    return this.commentsService.updateComment(user.id, id, dto.body);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  async remove(@CurrentUser() user: User, @Param("id") id: string) {
    await this.commentsService.deleteComment(user.id, id);
    return { success: true };
  }

  @Post(":id/like")
  @UseGuards(JwtAuthGuard)
  async like(@CurrentUser() user: User, @Param("id") id: string) {
    return this.commentsService.likeComment(user.id, id);
  }

  @Delete(":id/like")
  @UseGuards(JwtAuthGuard)
  async unlike(@CurrentUser() user: User, @Param("id") id: string) {
    return this.commentsService.unlikeComment(user.id, id);
  }

  @Get(":id/replies")
  async getReplies(@Param("id") id: string, @Query() query: PaginationQueryDto) {
    return this.commentsService.getReplies(id, query.page ?? 1, query.limit ?? 20);
  }

  @Post(":id/replies")
  @UseGuards(JwtAuthGuard)
  async reply(@CurrentUser() user: User, @Param("id") id: string, @Body() dto: UpdateCommentDto) {
    return this.commentsService.replyToComment(user.id, id, dto.body);
  }

  @Post(":id/pin")
  @UseGuards(JwtAuthGuard)
  async pin(@CurrentUser() user: User, @Param("id") id: string) {
    return this.commentsService.pinComment(user.id, id);
  }

  @Post(":id/report")
  @UseGuards(JwtAuthGuard)
  async report(@CurrentUser() user: User, @Param("id") id: string, @Body() dto: ReportDto) {
    return this.commentsService.reportComment(user.id, id, dto.reason);
  }
}
