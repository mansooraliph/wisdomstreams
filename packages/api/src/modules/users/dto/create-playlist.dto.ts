import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { Visibility } from "@prisma/client";

export class CreatePlaylistDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsEnum(Visibility)
  visibility?: Visibility;
}
