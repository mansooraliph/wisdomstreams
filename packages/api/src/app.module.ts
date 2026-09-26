import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { AppController } from "./app.controller";
import { PrismaModule } from "./prisma/prisma.module";
import { RedisModule } from "./redis/redis.module";
import { EmailModule } from "./email/email.module";
import { StorageModule } from "./storage/storage.module";
import { MuxModule } from "./mux/mux.module";
import { SearchModule } from "./search/search.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { ChannelsModule } from "./modules/channels/channels.module";
import { VideosModule } from "./modules/videos/videos.module";
import { FeedModule } from "./modules/feed/feed.module";
import { CommentsModule } from "./modules/comments/comments.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { AdminModule } from "./modules/admin/admin.module";

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    RedisModule,
    EmailModule,
    StorageModule,
    MuxModule,
    SearchModule,
    AuthModule,
    UsersModule,
    ChannelsModule,
    VideosModule,
    FeedModule,
    CommentsModule,
    NotificationsModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
