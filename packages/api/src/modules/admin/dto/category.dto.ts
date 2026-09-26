import { IsString, Matches, MaxLength, MinLength } from "class-validator";

export class CreateCategoryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Matches(/^[a-z0-9-]+$/, { message: "Slug can only contain lowercase letters, numbers, and hyphens" })
  slug!: string;
}

export class UpdateCategoryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name!: string;
}
