import { Injectable } from "@nestjs/common";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";

@Injectable()
export class StorageService {
  private readonly client: S3Client;

  constructor() {
    this.client = new S3Client({
      endpoint: process.env.MINIO_ENDPOINT ?? "http://localhost:9000",
      region: "us-east-1", // MinIO ignores region, but the SDK requires a value.
      credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY ?? "wisdomstream",
        secretAccessKey: process.env.MINIO_SECRET_KEY ?? "wisdomstream123",
      },
      forcePathStyle: true,
    });
  }

  async uploadFile(bucket: string, body: Buffer, contentType: string, extension: string): Promise<string> {
    const key = `${randomUUID()}.${extension}`;
    await this.client.send(
      new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }),
    );
    const cdnUrl = process.env.CDN_URL ?? process.env.MINIO_ENDPOINT ?? "http://localhost:9000";
    return `${cdnUrl}/${bucket}/${key}`;
  }

  async deleteFile(bucket: string, url: string): Promise<void> {
    const key = url.split("/").pop();
    if (!key) return;
    await this.client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  }
}
