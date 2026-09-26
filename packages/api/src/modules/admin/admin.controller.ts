import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { AdminService } from "./admin.service";
import { UpdateUserStatusDto } from "./dto/update-user-status.dto";
import { UpdateUserRoleDto } from "./dto/update-user-role.dto";
import { ReportActionDto } from "./dto/report-action.dto";
import { CreateCategoryDto, UpdateCategoryDto } from "./dto/category.dto";

@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("stats")
  async getStats() {
    return this.adminService.getStats();
  }

  @Get("users")
  async listUsers(
    @Query("search") search?: string,
    @Query("page") page = "1",
    @Query("limit") limit = "20",
  ) {
    return this.adminService.listUsers(search, Number(page) || 1, Math.min(Number(limit) || 20, 100));
  }

  @Patch("users/:id/status")
  async updateUserStatus(@Param("id") id: string, @Body() dto: UpdateUserStatusDto) {
    return this.adminService.updateUserStatus(id, dto.status);
  }

  @Patch("users/:id/role")
  async updateUserRole(@Param("id") id: string, @Body() dto: UpdateUserRoleDto) {
    return this.adminService.updateUserRole(id, dto.role);
  }

  @Get("reports")
  async listReports(@Query("status") status?: "PENDING" | "REVIEWED" | "DISMISSED") {
    return this.adminService.listReports(status);
  }

  @Patch("reports/:id/action")
  async actionReport(@Param("id") id: string, @Body() dto: ReportActionDto) {
    return this.adminService.actionReport(id, dto.action);
  }

  @Get("channels")
  async listChannels(
    @Query("search") search?: string,
    @Query("page") page = "1",
    @Query("limit") limit = "20",
  ) {
    return this.adminService.listChannels(search, Number(page) || 1, Math.min(Number(limit) || 20, 100));
  }

  @Patch("channels/:id/verify")
  async verifyChannel(@Param("id") id: string, @Body("isVerified") isVerified: boolean) {
    return this.adminService.verifyChannel(id, isVerified);
  }

  @Delete("videos/:id")
  async forceDeleteVideo(@Param("id") id: string) {
    await this.adminService.forceDeleteVideo(id);
    return { success: true };
  }

  @Get("categories")
  async listCategories() {
    return this.adminService.listCategories();
  }

  @Post("categories")
  async createCategory(@Body() dto: CreateCategoryDto) {
    return this.adminService.createCategory(dto.name, dto.slug);
  }

  @Patch("categories/:id")
  async updateCategory(@Param("id") id: string, @Body() dto: UpdateCategoryDto) {
    return this.adminService.updateCategory(id, dto.name);
  }

  @Delete("categories/:id")
  async deleteCategory(@Param("id") id: string) {
    await this.adminService.deleteCategory(id);
    return { success: true };
  }
}
