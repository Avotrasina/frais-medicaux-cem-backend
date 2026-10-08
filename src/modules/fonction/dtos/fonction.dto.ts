import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateFonctionDto {
  @IsString()
  @IsNotEmpty()
  nom!: string;
}

export class UpdateFonctionDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nom?: string;
}