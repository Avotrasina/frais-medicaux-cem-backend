import { IsNotEmpty, IsString } from "class-validator";

export class CreateAgenceDto {
  @IsString()
  @IsNotEmpty()
  codeAgence!: string;

  @IsString()
  @IsNotEmpty()
  nomAgence!: string;
}

export class UpdateAgenceDto {
  @IsString()
  @IsNotEmpty()
  nomAgence!: string;
}