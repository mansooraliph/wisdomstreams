import { IsEnum, IsOptional } from "class-validator";
import { Type } from "class-transformer";
import { Visibility } from "@prisma/client";

export class UpdateVisibilityDto {
  @IsEnum(Visibility)
  visibility!: Visibility;

  @IsOptional()
  @Type(() => Date)
  scheduledAt?: Date;
}
