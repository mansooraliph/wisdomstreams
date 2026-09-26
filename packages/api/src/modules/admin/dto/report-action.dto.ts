import { IsIn } from "class-validator";

export class ReportActionDto {
  @IsIn(["remove", "dismiss", "warn"])
  action!: "remove" | "dismiss" | "warn";
}
