import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import type { User } from "@prisma/client";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { toPublicUser } from "../../common/utils/to-public-user";
import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";
import { UsersService } from "./users.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { CreatePlaylistDto } from "./dto/create-playlist.dto";
import { UpdatePlaylistDto } from "./dto/update-playlist.dto";
import { AddPlaylistVideoDto } from "./dto/add-playlist-video.dto";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch("me")
  @UseGuards(JwtAuthGuard)
  async updateProfile(@CurrentUser() user: User, @Body() dto: UpdateProfileDto) {
    const updated = await this.usersService.updateProfile(user.id, dto);
    return toPublicUser(updated);
  }

  @Get("me/subscriptions")
  @UseGuards(JwtAuthGuard)
  async getMySubscriptions(@CurrentUser() user: User) {
    return this.usersService.getMySubscriptions(user.id);
  }

  @Delete("me")
  @UseGuards(JwtAuthGuard)
  async deleteAccount(@CurrentUser() user: User) {
    await this.usersService.deleteAccount(user.id);
    return { success: true };
  }

  @Get("me/history")
  @UseGuards(JwtAuthGuard)
  async getHistory(@CurrentUser() user: User, @Query() query: PaginationQueryDto) {
    return this.usersService.getHistory(user.id, query.page ?? 1, query.limit ?? 20);
  }

  @Delete("me/history")
  @UseGuards(JwtAuthGuard)
  async clearHistory(@CurrentUser() user: User) {
    await this.usersService.clearHistory(user.id);
    return { success: true };
  }

  @Delete("me/history/:videoId")
  @UseGuards(JwtAuthGuard)
  async removeHistoryEntry(@CurrentUser() user: User, @Param("videoId") videoId: string) {
    await this.usersService.removeHistoryEntry(user.id, videoId);
    return { success: true };
  }

  @Get("me/liked-videos")
  @UseGuards(JwtAuthGuard)
  async getLikedVideos(@CurrentUser() user: User, @Query() query: PaginationQueryDto) {
    return this.usersService.getLikedVideos(user.id, query.page ?? 1, query.limit ?? 20);
  }

  @Get("me/playlists")
  @UseGuards(JwtAuthGuard)
  async getPlaylists(@CurrentUser() user: User) {
    return this.usersService.getPlaylists(user.id);
  }

  @Get("me/playlists/:id")
  @UseGuards(JwtAuthGuard)
  async getPlaylist(@CurrentUser() user: User, @Param("id") id: string) {
    return this.usersService.getPlaylist(user.id, id);
  }

  @Post("me/playlists")
  @UseGuards(JwtAuthGuard)
  async createPlaylist(@CurrentUser() user: User, @Body() dto: CreatePlaylistDto) {
    return this.usersService.createPlaylist(user.id, dto);
  }

  @Patch("me/playlists/:id")
  @UseGuards(JwtAuthGuard)
  async updatePlaylist(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() dto: UpdatePlaylistDto,
  ) {
    return this.usersService.updatePlaylist(user.id, id, dto);
  }

  @Delete("me/playlists/:id")
  @UseGuards(JwtAuthGuard)
  async deletePlaylist(@CurrentUser() user: User, @Param("id") id: string) {
    await this.usersService.deletePlaylist(user.id, id);
    return { success: true };
  }

  @Post("me/playlists/:id/videos")
  @UseGuards(JwtAuthGuard)
  async addPlaylistVideo(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body() dto: AddPlaylistVideoDto,
  ) {
    return this.usersService.addVideoToPlaylist(user.id, id, dto.videoId);
  }

  @Delete("me/playlists/:id/videos/:videoId")
  @UseGuards(JwtAuthGuard)
  async removePlaylistVideo(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Param("videoId") videoId: string,
  ) {
    return this.usersService.removeVideoFromPlaylist(user.id, id, videoId);
  }

  @Get(":username")
  async getPublicProfile(@Param("username") username: string) {
    return this.usersService.getPublicProfile(username);
  }
}
