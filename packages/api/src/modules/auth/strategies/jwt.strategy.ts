import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import type { Request } from "express";
import { PrismaService } from "../../../prisma/prisma.service";

export interface JwtAccessPayload {
  sub: string;
  role: string;
}

function fromCookie(req: Request): string | null {
  return req.cookies?.access_token ?? null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        fromCookie,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET ?? "insecure-dev-access-secret",
    });
  }

  async validate(payload: JwtAccessPayload) {
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedException("User no longer exists");
    }
    if (user.status !== "ACTIVE") {
      throw new UnauthorizedException("This account has been suspended or banned");
    }
    return user;
  }
}
