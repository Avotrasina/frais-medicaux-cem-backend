import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCategorieActeDto {
  @IsString()
  @IsNotEmpty()
  nomCategorie!: string;
}

export class UpdateCategorieActeDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nomCategorie?: string;
}
