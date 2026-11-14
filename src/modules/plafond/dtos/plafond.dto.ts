import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  Min,
} from 'class-validator';
import {
  PorteePlafond,
  UnitePlafond,
} from '../../../generated/prisma/enums.js';

export class CreatePlafondDto {
  @ApiPropertyOptional({
    type: String,
    format: 'date',
    example: '2026-01-15',
    description:
      'Date d’effet facultative. Sans plafond existant, elle vaut 1900-01-01 si aucun acte suivi ne concerne la cible, sinon aujourd’hui à Antananarivo. Si un plafond existe déjà pour la portée, elle vaut aujourd’hui à Antananarivo.',
  })
  @IsDateString({}, { message: 'La date d’effet est invalide.' })
  @IsOptional()
  dateEffet?: string;

  @ApiPropertyOptional({ enum: PorteePlafond })
  @IsOptional()
  @IsEnum(PorteePlafond)
  porteePlafond?: PorteePlafond;

  @ApiPropertyOptional({ enum: UnitePlafond })
  @IsOptional()
  @IsEnum(UnitePlafond)
  unite?: UnitePlafond;

  @ApiPropertyOptional({ type: Number, minimum: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  montant?: number | null;

  @ApiPropertyOptional({ type: Number, minimum: 1 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  nbSeances?: number | null;

  @ApiPropertyOptional({ type: Number, minimum: 1 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  acteID?: number | null;

  @ApiPropertyOptional({ type: Number, minimum: 1 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  categorieActeID?: number | null;
}

export class UpdatePlafondDto {
  @ApiPropertyOptional({ type: String, format: 'date', example: '2026-01-15' })
  @IsDateString({}, { message: 'La date d’effet est invalide.' })
  @IsOptional()
  dateEffet?: string;

  @ApiPropertyOptional({ type: String, format: 'date', nullable: true })
  @IsDateString({}, { message: 'La date de fin est invalide.' })
  @IsOptional()
  dateFin?: string | null;

  @ApiPropertyOptional({ enum: PorteePlafond })
  @IsOptional()
  @IsEnum(PorteePlafond)
  porteePlafond?: PorteePlafond;

  @ApiPropertyOptional({ enum: UnitePlafond })
  @IsOptional()
  @IsEnum(UnitePlafond)
  unite?: UnitePlafond;

  @ApiPropertyOptional({ type: Number, minimum: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  montant?: number | null;

  @ApiPropertyOptional({ type: Number, minimum: 1 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  nbSeances?: number | null;

  @ApiPropertyOptional({ type: Number, minimum: 1 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  acteID?: number | null;

  @ApiPropertyOptional({ type: Number, minimum: 1 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  categorieActeID?: number | null;
}
