import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { UpdatePlafondDto } from '../../plafond/dtos/plafond.dto.js';

export class CreateCategorieActeDto {
  @IsString()
  @IsNotEmpty()
  nomCategorie!: string;
}

export class UpdateCategorieActeDto extends UpdatePlafondDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nomCategorie?: string;
}
