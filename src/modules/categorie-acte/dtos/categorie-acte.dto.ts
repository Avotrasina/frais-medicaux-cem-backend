import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UpdatePlafondDto } from '../../plafond/dtos/plafond.dto.js';
import { PlafondsModificationDto } from '../../plafond/dtos/plafond.dto.js';

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

  /**
   * Constraint of the category, written with the category itself.
   *
   * The provided scopes replace the existing ones, the omitted scopes are
   * cleared, `null` clears every scope. Setting a constraint clears the own
   * constraints of the acts of the category, in the same transaction.
   */
  @ApiPropertyOptional({ type: PlafondsModificationDto, nullable: true })
  @IsOptional()
  plafonds?: PlafondsModificationDto | null;
}
