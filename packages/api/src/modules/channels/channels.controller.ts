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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { User } from "@prisma/client";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";
import { ChannelsService } from "./channels.service";
import { CreateChannelDto } from "./dto/create-channel.dto";
import { UpdateChannelDto } from "./dto/update-channel.dto";
import { UpdateSectionsDto } from "./dto/update-sections.dto";
import { UpdateSubscriptionDto } from "./dto/update-subscription.dto";
import { OptionalJwtAuthGuard } from "../../common/guards/optional-jwt-auth.guard";
import { CreatePlaylistDto } from "../users/dto/create-playlist.dto";
import { UpdatePlaylistDto } from "../users/dto/update-playlist.dto";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

@Controller("channels")
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@CurrentUser() user: User, @Body() dto: CreateChannelDto) {
    return this.channelsService.createChannel(user.id, dto);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  async getMine(@CurrentUser() user: User) {
    return this.channelsService.getMyChannels(user.id);
  }

  @Get(":handle")
  async getByHandle(@Param("handle") handle: string) {
    return this.channelsService.getByHandle(handle);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  async update(@CurrentUser() user: User, @Param("id") id: string, @Body() dto: UpdateChannelDto) {
    return this.channelsService.updateChannel(user.id, id, dto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  async remove(@CurrentUser() user: User, @Param("id") id: string) {
    await this.channelsService.deleteChannel(user.id, id);
    return { success: true };
  }

  @Get(":id/videos")
  async getVideos(@Param("id") id: string, @Query() query: PaginationQueryDto) {
    return this.channelsService.getVideos(id, query.page ?? 1, query.limit ?? 20);
  }

  @Get(":id/playlists")
  async getPlaylists(@Param("id") id: string) {
    return this.channelsService.getPlaylists(id);
  }

  @Get(":id/playlists/mine")
  @UseGuards(JwtAuthGuard)
  async getMyChannelPlaylists(@CurrentUser() user: User, @Param("id") id: string) {
    return this.channelsService.getMyChannelPlaylists(user.id, id);
  }

  @Post(":id/playlists")
  @UseGuards(JwtAuthGuard)
  async createChannelPlaylist(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() dto: CreatePlaylistDto,
  ) {
    return this.channelsService.createChannelPlaylist(user.id, id, dto);
  }

  @Patch(":id/playlists/:playlistId")
  @UseGuards(JwtAuthGuard)
  async updateChannelPlaylist(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Param("playlistId") playlistId: string,
    @Body() dto: UpdatePlaylistDto,
  ) {
    return this.channelsService.updateChannelPlaylist(user.id, id, playlistId, dto);
  }

  @Delete(":id/playlists/:playlistId")
  @UseGuards(JwtAuthGuard)
  async deleteChannelPlaylist(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Param("playlistId") playlistId: string,
  ) {
    await this.channelsService.deleteChannelPlaylist(user.id, id, playlistId);
    return { success: true };
  }

  @Get(":id/overview")
  @UseGuards(JwtAuthGuard)
  async getOverview(@CurrentUser() user: User, @Param("id") id: string) {
    return this.channelsService.getOverview(user.id, id);
  }

  @Get(":id/about")
  async getAbout(@Param("id") id: string) {
    return this.channelsService.getAbout(id);
  }

  @Post(":id/subscribe")
  @UseGuards(JwtAuthGuard)
  async subscribe(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() dto: UpdateSubscriptionDto,
  ) {
    return this.channelsService.subscribe(user.id, id, dto.notifyLevel);
  }

  @Delete(":id/subscribe")
  @UseGuards(JwtAuthGuard)
  async unsubscribe(@CurrentUser() user: User, @Param("id") id: string) {
    await this.channelsService.unsubscribe(user.id, id);
    return { success: true };
  }

  @Patch(":id/subscribe")
  @UseGuards(JwtAuthGuard)
  async updateSubscription(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() dto: UpdateSubscriptionDto,
  ) {
    if (!dto.notifyLevel) throw new BadRequestException("notifyLevel is required");
    return this.channelsService.updateNotifyLevel(user.id, id, dto.notifyLevel);
  }

  @Get(":id/subscribers")
  async getSubscribers(@Param("id") id: string) {
    return this.channelsService.getSubscriberCount(id);
  }

  @Get(":id/subscription-status")
  @UseGuards(OptionalJwtAuthGuard)
  async getSubscriptionStatus(@CurrentUser() user: User | undefined, @Param("id") id: string) {
    if (!user) return { subscribed: false, notifyLevel: null };
    return this.channelsService.getSubscriptionStatus(user.id, id);
  }

  @Patch(":id/sections")
  @UseGuards(JwtAuthGuard)
  async updateSections(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() dto: UpdateSectionsDto,
  ) {
    return this.channelsService.updateSections(user.id, id, dto.sections);
  }

  @Post(":id/avatar")
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: MAX_IMAGE_SIZE_BYTES } }))
  async uploadAvatar(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException("No file uploaded");
    return this.channelsService.uploadAvatar(user.id, id, file);
  }

  @Post(":id/banner")
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: MAX_IMAGE_SIZE_BYTES } }))
  async uploadBanner(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException("No file uploaded");
    return this.channelsService.uploadBanner(user.id, id, file);
  }
}
