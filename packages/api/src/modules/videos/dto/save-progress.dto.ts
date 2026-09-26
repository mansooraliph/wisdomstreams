import { IsNumber, Min } from "class-validator";

export class SaveProgressDto {
  @IsNumber()
  @Min(0)
  progress!: number;
}
