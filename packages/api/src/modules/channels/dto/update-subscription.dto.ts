import { IsEnum, IsOptional } from "class-validator";
import { NotifyLevel } from "@prisma/client";

export class UpdateSubscriptionDto {
  @IsOptional()
  @IsEnum(NotifyLevel)
  notifyLevel?: NotifyLevel;
}
