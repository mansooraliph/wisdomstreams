import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { User } from "@prisma/client";
import type { AuthenticatedRequest } from "../guards/jwt-auth.guard";

export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): User => {
  const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
  return request.user;
});
