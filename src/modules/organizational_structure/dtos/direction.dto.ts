import { IsNotEmpty, IsString } from "class-validator";

export class CreateDirectionDto {
  @IsString()
  @IsNotEmpty()
  codeDirection!: string;

  @IsString()
  @IsNotEmpty()
  nomDirection!: string;
}

export class UpdateDirectionDto {
  @IsString()
  @IsNotEmpty()
  nomDirection!: string;
}