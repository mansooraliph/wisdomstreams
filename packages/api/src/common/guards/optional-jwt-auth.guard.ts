import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

/**
 * Like JwtAuthGuard, but never rejects the request. If a valid token is
 * present, `request.user` is populated; otherwise it's left undefined
 * instead of throwing 401. For endpoints that are public but behave
 * differently for an authenticated owner (e.g. a private draft's own page).
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard("jwt") {
  handleRequest<TUser = unknown>(_err: unknown, user: TUser): TUser {
    return user;
  }
}
