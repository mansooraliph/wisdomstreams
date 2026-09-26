import { Injectable, InternalServerErrorException } from "@nestjs/common";
import Mux from "@mux/mux-node";
import type { HeadersLike } from "@mux/mux-node/internal/headers";

/**
 * The Mux SDK's real `unwrap()` return type is a discriminated union with a
 * precisely-typed `data` per event (VideoAssetReadyWebhookEvent, etc). We
 * only ever read `.type` and treat `.data` as an untyped bag of fields, so we
 * widen to this loose shape rather than fight the union's exact typing.
 */
export interface MuxWebhookEvent {
  type: string;
  data: Record<string, unknown>;
}

@Injectable()
export class MuxService {
  private readonly client: Mux | null;

  constructor() {
    const tokenId = process.env.MUX_TOKEN_ID;
    const tokenSecret = process.env.MUX_TOKEN_SECRET;
    this.client =
      tokenId && tokenSecret
        ? new Mux({
            tokenId,
            tokenSecret,
            jwtSigningKey: process.env.MUX_SIGNING_KEY_ID,
            jwtPrivateKey: process.env.MUX_SIGNING_PRIVATE_KEY,
          })
        : null;
  }

  private requireClient(): Mux {
    if (!this.client) {
      throw new InternalServerErrorException(
        "Mux is not configured on the server (missing MUX_TOKEN_ID/MUX_TOKEN_SECRET)",
      );
    }
    return this.client;
  }

  async createDirectUpload(corsOrigin: string): Promise<{ uploadId: string; uploadUrl: string }> {
    const mux = this.requireClient();
    const upload = await mux.video.uploads.create({
      cors_origin: corsOrigin,
      new_asset_settings: {
        playback_policies: ["public"],
        normalize_audio: true,
      },
    });
    if (!upload.url) {
      throw new InternalServerErrorException("Mux did not return an upload URL");
    }
    return { uploadId: upload.id, uploadUrl: upload.url };
  }

  async deleteAsset(assetId: string): Promise<void> {
    const mux = this.requireClient();
    await mux.video.assets.delete(assetId);
  }

  async getSignedPlaybackToken(playbackId: string): Promise<string> {
    const mux = this.requireClient();
    return mux.jwt.signPlaybackId(playbackId, { expiration: "1d" });
  }

  async unwrapWebhookEvent(rawBody: string, headers: HeadersLike): Promise<MuxWebhookEvent> {
    const mux = this.requireClient();
    const secret = process.env.MUX_WEBHOOK_SECRET;
    const event = await mux.webhooks.unwrap(rawBody, headers, secret);
    return event as unknown as MuxWebhookEvent;
  }
}
