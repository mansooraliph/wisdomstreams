import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { Client } from "@elastic/elasticsearch";
import type { Video } from "@prisma/client";

const INDEX = "videos";

export interface SearchFilters {
  q?: string;
  sort?: "relevance" | "date" | "views";
  duration?: "short" | "medium" | "long";
  category?: string;
  page: number;
  limit: number;
}

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name);
  private readonly client: Client;

  constructor() {
    this.client = new Client({ node: process.env.ELASTICSEARCH_URL ?? "http://localhost:9200" });
  }

  async onModuleInit() {
    try {
      const exists = await this.client.indices.exists({ index: INDEX });
      if (!exists) {
        await this.client.indices.create({
          index: INDEX,
          mappings: {
            properties: {
              id: { type: "keyword" },
              title: { type: "text", analyzer: "english" },
              description: { type: "text", analyzer: "english" },
              tags: { type: "keyword" },
              category: { type: "keyword" },
              channelName: { type: "text" },
              channelId: { type: "keyword" },
              viewCount: { type: "long" },
              likeCount: { type: "long" },
              duration: { type: "float" },
              publishedAt: { type: "date" },
              language: { type: "keyword" },
              thumbnailUrl: { type: "keyword", index: false },
            },
          },
        });
      }
    } catch (err) {
      this.logger.warn(`Elasticsearch unavailable at startup — search will be degraded: ${err}`);
    }
  }

  async indexVideo(video: Video, channelName: string): Promise<void> {
    try {
      await this.client.index({
        index: INDEX,
        id: video.id,
        document: {
          id: video.id,
          title: video.title,
          description: video.description,
          tags: video.tags,
          category: video.category,
          channelName,
          channelId: video.channelId,
          viewCount: video.viewCount,
          likeCount: video.likeCount,
          duration: video.duration,
          publishedAt: video.publishedAt,
          language: video.language,
          thumbnailUrl: video.thumbnailUrl,
        },
      });
    } catch (err) {
      this.logger.warn(`Failed to index video ${video.id}: ${err}`);
    }
  }

  async removeVideo(videoId: string): Promise<void> {
    try {
      await this.client.delete({ index: INDEX, id: videoId });
    } catch {
      // Not indexed (e.g. was never public) — fine to ignore.
    }
  }

  async search(filters: SearchFilters) {
    const must: object[] = [];
    if (filters.q) {
      must.push({ multi_match: { query: filters.q, fields: ["title^2", "description", "tags", "channelName"] } });
    }
    if (filters.category) {
      must.push({ term: { category: filters.category } });
    }
    if (filters.duration) {
      const ranges = { short: { lt: 240 }, medium: { gte: 240, lt: 1200 }, long: { gte: 1200 } };
      must.push({ range: { duration: ranges[filters.duration] } });
    }

    const sort =
      filters.sort === "date"
        ? [{ publishedAt: "desc" as const }]
        : filters.sort === "views"
          ? [{ viewCount: "desc" as const }]
          : undefined; // default: relevance (ES _score)

    try {
      const result = await this.client.search({
        index: INDEX,
        query: must.length > 0 ? { bool: { must } } : { match_all: {} },
        sort,
        from: (filters.page - 1) * filters.limit,
        size: filters.limit,
      });
      return result.hits.hits.map((hit) => hit._source);
    } catch (err) {
      this.logger.warn(`Search query failed: ${err}`);
      return [];
    }
  }

  async suggest(q: string): Promise<string[]> {
    try {
      const result = await this.client.search({
        index: INDEX,
        query: { match_phrase_prefix: { title: q } },
        size: 5,
        _source: ["title"],
      });
      return result.hits.hits.map((hit) => (hit._source as { title: string }).title);
    } catch {
      return [];
    }
  }
}
