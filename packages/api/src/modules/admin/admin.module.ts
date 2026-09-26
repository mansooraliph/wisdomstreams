import { Module } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { VideosModule } from "../videos/videos.module";
import { CommentsModule } from "../comments/comments.module";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [VideosModule, CommentsModule, NotificationsModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
