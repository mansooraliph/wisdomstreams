import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import type { User } from "@prisma/client";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";
import { FeedService } from "./feed.service";

@Controller("feed")
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get()
  async getHomeFeed(@Query() query: PaginationQueryDto) {
    return this.feedService.getHomeFeed(query.page ?? 1, query.limit ?? 20);
  }

  @Get("trending")
  async getTrending(@Query() query: PaginationQueryDto) {
    return this.feedService.getTrending(query.page ?? 1, query.limit ?? 20);
  }

  @Get("subscriptions")
  @UseGuards(JwtAuthGuard)
  async getSubscriptionsFeed(@CurrentUser() user: User, @Query() query: PaginationQueryDto) {
    return this.feedService.getSubscriptionsFeed(user.id, query.page ?? 1, query.limit ?? 20);
  }
}
