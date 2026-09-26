import { IsString, MinLength } from "class-validator";

export class AddPlaylistVideoDto {
  @IsString()
  @MinLength(1)
  videoId!: string;
}
