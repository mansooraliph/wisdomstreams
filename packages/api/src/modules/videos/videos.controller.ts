import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Request } from "express";
import type { User } from "@prisma/client";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { OptionalJwtAuthGuard } from "../../common/guards/optional-jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { VideosService } from "./videos.service";
import { InitUploadDto } from "./dto/init-upload.dto";
import { UpdateMetadataDto } from "./dto/update-metadata.dto";
import { UpdateVisibilityDto } from "./dto/update-visibility.dto";
import { UpdateChaptersDto } from "./dto/update-chapters.dto";
import { SaveProgressDto } from "./dto/save-progress.dto";
import { CommentsService } from "../comments/comments.service";
import { CreateCommentDto } from "../comments/dto/create-comment.dto";
import { ReportDto } from "../comments/dto/report.dto";
import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";

const MAX_THUMBNAIL_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

@Controller("videos")
export class VideosController {
  constructor(
    private readonly videosService: VideosService,
    private readonly commentsService: CommentsService,
  ) {}

  @Post("init")
  @UseGuards(JwtAuthGuard)
  async init(@CurrentUser() user: User, @Body() dto: InitUploadDto, @Req() req: Request) {
    const corsOrigin =
      (req.headers.origin as string | undefined) ??
      process.env.STUDIO_APP_URL ??
      "http://localhost:3002";
    return this.videosService.initUpload(user.id, dto.channelId, corsOrigin);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async list(
    @CurrentUser() user: User,
    @Query("channelId") channelId: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.videosService.getChannelVideosForOwner(
      user.id,
      channelId,
      Number(page) || 1,
      Number(limit) || 50,
    );
  }

  @Get(":id")
  @UseGuards(OptionalJwtAuthGuard)
  async getOne(@CurrentUser() user: User | undefined, @Param("id") id: string) {
    return this.videosService.getVideo(id, user?.id);
  }

  @Post(":id/view")
  async recordView(@Param("id") id: string) {
    await this.videosService.recordView(id);
    return { success: true };
  }

  @Post(":id/progress")
  @UseGuards(JwtAuthGuard)
  async saveProgress(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() dto: SaveProgressDto,
  ) {
    await this.videosService.saveProgress(user.id, id, dto.progress);
    return { success: true };
  }

  @Get(":id/progress")
  @UseGuards(JwtAuthGuard)
  async getProgress(@CurrentUser() user: User, @Param("id") id: string) {
    const progress = await this.videosService.getProgress(user.id, id);
    return { progress };
  }

  @Get(":id/related")
  async getRelated(@Param("id") id: string) {
    return this.videosService.getRelated(id);
  }

  @Get(":id/comments")
  async getComments(
    @Param("id") id: string,
    @Query() query: PaginationQueryDto,
    @Query("sort") sort?: "top" | "new",
  ) {
    return this.commentsService.listComments(id, query.page ?? 1, query.limit ?? 20, sort ?? "top");
  }

  @Post(":id/comments")
  @UseGuards(JwtAuthGuard)
  async createComment(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.createComment(user.id, id, dto);
  }

  @Post(":id/like")
  @UseGuards(JwtAuthGuard)
  async like(@CurrentUser() user: User, @Param("id") id: string) {
    await this.videosService.likeVideo(user.id, id);
    return { success: true };
  }

  @Delete(":id/like")
  @UseGuards(JwtAuthGuard)
  async unlike(@CurrentUser() user: User, @Param("id") id: string) {
    await this.videosService.removeVideoReaction(user.id, id);
    return { success: true };
  }

  @Post(":id/dislike")
  @UseGuards(JwtAuthGuard)
  async dislike(@CurrentUser() user: User, @Param("id") id: string) {
    await this.videosService.dislikeVideo(user.id, id);
    return { success: true };
  }

  @Post(":id/report")
  @UseGuards(JwtAuthGuard)
  async report(@CurrentUser() user: User, @Param("id") id: string, @Body() dto: ReportDto) {
    return this.videosService.reportVideo(user.id, id, dto.reason);
  }

  @Patch(":id/metadata")
  @UseGuards(JwtAuthGuard)
  async updateMetadata(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() dto: UpdateMetadataDto,
  ) {
    return this.videosService.updateMetadata(user.id, id, dto);
  }

  @Patch(":id/visibility")
  @UseGuards(JwtAuthGuard)
  async updateVisibility(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() dto: UpdateVisibilityDto,
  ) {
    return this.videosService.updateVisibility(user.id, id, dto);
  }

  @Post(":id/thumbnail")
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: MAX_THUMBNAIL_SIZE_BYTES } }))
  async uploadThumbnail(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException("No file uploaded");
    return this.videosService.uploadThumbnail(user.id, id, file);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  async remove(@CurrentUser() user: User, @Param("id") id: string) {
    await this.videosService.deleteVideo(user.id, id);
    return { success: true };
  }

  @Get(":id/upload-status")
  @UseGuards(JwtAuthGuard)
  async getUploadStatus(@CurrentUser() user: User, @Param("id") id: string) {
    return this.videosService.getUploadStatus(user.id, id);
  }

  @Patch(":id/chapters")
  @UseGuards(JwtAuthGuard)
  async updateChapters(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() dto: UpdateChaptersDto,
  ) {
    return this.videosService.updateChapters(user.id, id, dto);
  }
}
