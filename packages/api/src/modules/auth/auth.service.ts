import { randomBytes, randomUUID } from "node:crypto";
import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import type { User } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { RedisService } from "../../redis/redis.service";
import { EmailService } from "../../email/email.service";
import type { RegisterDto } from "./dto/register.dto";
import type { LoginDto } from "./dto/login.dto";

const ACCESS_TOKEN_TTL = "24h";
const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1 hour
const EMAIL_VERIFY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly redis: RedisService,
    private readonly email: EmailService,
  ) {}

  async register(dto: RegisterDto): Promise<{ user: User; tokens: TokenPair }> {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { username: dto.username }] },
    });
    if (existing) {
      throw new ConflictException("Email or username already in use");
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const emailVerifyToken = randomBytes(32).toString("hex");

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        passwordHash,
        emailVerifyToken,
        emailVerifyExpires: new Date(Date.now() + EMAIL_VERIFY_TTL_MS),
      },
    });

    const webUrl = process.env.WEB_APP_URL ?? "http://localhost:3000";
    await this.email.sendVerificationEmail(user.email, `${webUrl}/verify-email?token=${emailVerifyToken}`);

    const tokens = await this.issueTokens(user);
    return { user, tokens };
  }

  async login(dto: LoginDto): Promise<{ user: User; tokens: TokenPair }> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user?.passwordHash) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException("Invalid email or password");
    }
    if (user.status !== "ACTIVE") {
      throw new UnauthorizedException("This account has been suspended or banned");
    }

    const tokens = await this.issueTokens(user);
    return { user, tokens };
  }

  async issueTokens(user: User): Promise<TokenPair> {
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, role: user.role },
      { secret: process.env.JWT_ACCESS_SECRET ?? "insecure-dev-access-secret", expiresIn: ACCESS_TOKEN_TTL },
    );

    const jti = randomUUID();
    const refreshToken = await this.jwt.signAsync(
      { sub: user.id, jti },
      {
        secret: process.env.JWT_REFRESH_SECRET ?? "insecure-dev-refresh-secret",
        expiresIn: REFRESH_TOKEN_TTL_SECONDS,
      },
    );

    await this.redis.set(`refresh_token:${jti}`, user.id, "EX", REFRESH_TOKEN_TTL_SECONDS);

    return { accessToken, refreshToken };
  }

  async refresh(refreshToken: string): Promise<{ user: User; tokens: TokenPair }> {
    let payload: { sub: string; jti: string };
    try {
      payload = await this.jwt.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET ?? "insecure-dev-refresh-secret",
      });
    } catch {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }

    const storedUserId = await this.redis.get(`refresh_token:${payload.jti}`);
    if (!storedUserId || storedUserId !== payload.sub) {
      throw new UnauthorizedException("Refresh token has been revoked");
    }

    // Rotate: invalidate the used refresh token immediately.
    await this.redis.del(`refresh_token:${payload.jti}`);

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedException("User no longer exists");
    }

    const tokens = await this.issueTokens(user);
    return { user, tokens };
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) return;
    try {
      const payload = await this.jwt.verifyAsync<{ jti: string }>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET ?? "insecure-dev-refresh-secret",
        ignoreExpiration: true,
      });
      await this.redis.del(`refresh_token:${payload.jti}`);
    } catch {
      // Token was already invalid/expired — nothing to revoke.
    }
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return; // Don't reveal whether the email exists.

    const passwordResetToken = randomBytes(32).toString("hex");
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken,
        passwordResetExpires: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
      },
    });

    const webUrl = process.env.WEB_APP_URL ?? "http://localhost:3000";
    await this.email.sendPasswordResetEmail(
      user.email,
      `${webUrl}/reset-password?token=${passwordResetToken}`,
    );
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { passwordResetToken: token } });
    if (!user || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      throw new BadRequestException("Invalid or expired reset token");
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, passwordResetToken: null, passwordResetExpires: null },
    });
  }

  async verifyEmail(token: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { emailVerifyToken: token } });
    if (!user || !user.emailVerifyExpires || user.emailVerifyExpires < new Date()) {
      throw new BadRequestException("Invalid or expired verification token");
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, emailVerifyToken: null, emailVerifyExpires: null },
    });
  }
}
