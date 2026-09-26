import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import Redis from "ioredis";

@Injectable()
export class RedisService extends Redis implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super(process.env.REDIS_URL ?? "redis://localhost:6379");
  }

  async onModuleInit() {
    // ioredis connects lazily on first command; nothing to do here, but
    // keeping the hook makes intent explicit and gives us a place to log.
  }

  async onModuleDestroy() {
    this.disconnect();
  }
}
