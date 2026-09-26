import { IsArray } from "class-validator";

export class UpdateSectionsDto {
  @IsArray()
  sections!: unknown[];
}
