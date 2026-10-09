import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateLieuDto {
  @IsString()
  @IsNotEmpty()
  nom!: string;
}

export class UpdateLieuDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nom?: string;
}