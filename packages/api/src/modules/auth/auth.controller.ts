import { Body, Controller, Get, HttpCode, Post, Query, Req, Res, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Request, Response } from "express";
import type { User } from "@prisma/client";
import { AuthService, type TokenPair } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { toPublicUser } from "../../common/utils/to-public-user";

const ACCESS_COOKIE = "access_token";
const REFRESH_COOKIE = "refresh_token";
const ACCESS_MAX_AGE_MS = 15 * 60 * 1000;
const REFRESH_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    // In production this should be the shared parent domain (e.g.
    // ".wisdomstream.com") so the cookie is visible to both api.* and the
    // main app's subdomains. Left undefined in dev so it defaults to
    // host-only, which works fine since "localhost" ignores ports.
    domain: process.env.COOKIE_DOMAIN || undefined,
    maxAge,
  };
}

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const { user, tokens } = await this.authService.register(dto);
    this.setTokenCookies(res, tokens);
    return toPublicUser(user);
  }

  @Post("login")
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { user, tokens } = await this.authService.login(dto);
    this.setTokenCookies(res, tokens);
    return toPublicUser(user);
  }

  @Post("logout")
  @HttpCode(200)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(req.cookies?.[REFRESH_COOKIE]);
    const domain = process.env.COOKIE_DOMAIN || undefined;
    res.clearCookie(ACCESS_COOKIE, { path: "/", domain });
    res.clearCookie(REFRESH_COOKIE, { path: "/", domain });
    return { success: true };
  }

  @Post("refresh")
  @HttpCode(200)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];
    if (!refreshToken) {
      return { success: false };
    }
    const { user, tokens } = await this.authService.refresh(refreshToken);
    this.setTokenCookies(res, tokens);
    return toPublicUser(user);
  }

  @Post("forgot-password")
  @HttpCode(200)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.requestPasswordReset(dto.email);
    return { success: true };
  }

  @Post("reset-password")
  @HttpCode(200)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.password);
    return { success: true };
  }

  @Get("verify-email")
  async verifyEmail(@Query("token") token: string) {
    await this.authService.verifyEmail(token);
    return { success: true };
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser() user: User) {
    return toPublicUser(user);
  }

  private setTokenCookies(res: Response, tokens: TokenPair) {
    res.cookie(ACCESS_COOKIE, tokens.accessToken, cookieOptions(ACCESS_MAX_AGE_MS));
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, cookieOptions(REFRESH_MAX_AGE_MS));
  }
}
