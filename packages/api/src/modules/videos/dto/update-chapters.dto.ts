import { Type } from "class-transformer";
import { ArrayMaxSize, IsArray, IsNumber, IsString, Min, MinLength, ValidateNested } from "class-validator";

class ChapterDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsNumber()
  @Min(0)
  startTime!: number;
}

export class UpdateChaptersDto {
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => ChapterDto)
  chapters!: ChapterDto[];
}
