import { Module } from "@nestjs/common";
import { VideosController } from "./videos.controller";
import { MuxWebhookController } from "./mux-webhook.controller";
import { VideosService } from "./videos.service";
import { CommentsModule } from "../comments/comments.module";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [CommentsModule, NotificationsModule],
  controllers: [VideosController, MuxWebhookController],
  providers: [VideosService],
  exports: [VideosService],
})
export class VideosModule {}
