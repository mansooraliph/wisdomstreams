import { Controller, Delete, Get, Param, Patch, Query, UseGuards } from "@nestjs/common";
import type { User } from "@prisma/client";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";
import { NotificationsService } from "./notifications.service";

@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async list(@CurrentUser() user: User, @Query() query: PaginationQueryDto) {
    return this.notificationsService.list(user.id, query.page ?? 1, query.limit ?? 20);
  }

  @Patch("read-all")
  async markAllRead(@CurrentUser() user: User) {
    await this.notificationsService.markAllRead(user.id);
    return { success: true };
  }

  @Patch(":id/read")
  async markRead(@CurrentUser() user: User, @Param("id") id: string) {
    await this.notificationsService.markRead(user.id, id);
    return { success: true };
  }

  @Delete(":id")
  async remove(@CurrentUser() user: User, @Param("id") id: string) {
    await this.notificationsService.remove(user.id, id);
    return { success: true };
  }
}
