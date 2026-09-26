import { IsString, MinLength } from "class-validator";

export class InitUploadDto {
  @IsString()
  @MinLength(1)
  channelId!: string;
}
