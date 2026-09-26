import { Controller, Get, Param, Query } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SearchService } from "./search.service";

@Controller()
export class SearchController {
  constructor(
    private readonly searchService: SearchService,
    private readonly prisma: PrismaService,
  ) {}

  @Get("search")
  async search(
    @Query("q") q?: string,
    @Query("sort") sort?: "relevance" | "date" | "views",
    @Query("duration") duration?: "short" | "medium" | "long",
    @Query("category") category?: string,
    @Query("page") page = "1",
    @Query("limit") limit = "20",
  ) {
    return this.searchService.search({
      q,
      sort,
      duration,
      category,
      page: Number(page) || 1,
      limit: Math.min(Number(limit) || 20, 100),
    });
  }

  @Get("search/suggestions")
  async suggestions(@Query("q") q: string) {
    if (!q) return [];
    return this.searchService.suggest(q);
  }

  @Get("categories")
  async categories() {
    const rows = await this.prisma.video.findMany({
      where: { visibility: "PUBLIC", category: { not: null } },
      select: { category: true },
      distinct: ["category"],
    });
    return rows.map((r) => r.category).filter(Boolean);
  }

  @Get("categories/:slug/videos")
  async categoryVideos(
    @Param("slug") slug: string,
    @Query("page") page = "1",
    @Query("limit") limit = "20",
  ) {
    const pageNum = Number(page) || 1;
    const limitNum = Math.min(Number(limit) || 20, 100);
    return this.prisma.video.findMany({
      where: { visibility: "PUBLIC", category: slug },
      orderBy: { publishedAt: "desc" },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    });
  }
}
