import { BadRequestException, Controller, Post, Req, UnauthorizedException } from "@nestjs/common";
import type { RawBodyRequest } from "@nestjs/common";
import type { Request } from "express";
import { MuxService } from "../../mux/mux.service";
import { VideosService } from "./videos.service";

@Controller("webhooks/mux")
export class MuxWebhookController {
  constructor(
    private readonly mux: MuxService,
    private readonly videosService: VideosService,
  ) {}

  @Post()
  async handle(@Req() req: RawBodyRequest<Request>) {
    if (!req.rawBody) {
      throw new BadRequestException("Missing raw request body");
    }

    let event;
    try {
      event = await this.mux.unwrapWebhookEvent(req.rawBody.toString("utf-8"), req.headers);
    } catch {
      throw new UnauthorizedException("Invalid webhook signature");
    }

    await this.videosService.handleWebhookEvent(event);

    return { received: true };
  }
}
