import { IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class CreateChannelDto {
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-z0-9_-]+$/, {
    message: "Handle can only contain lowercase letters, numbers, hyphens, and underscores",
  })
  handle!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(60)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;
}
