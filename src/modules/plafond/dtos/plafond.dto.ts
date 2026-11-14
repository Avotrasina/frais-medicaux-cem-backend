import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  Min,
  ValidateIf,
  ValidateNested,
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

/** Ceiling carried by an act for a single act. */
export class PlafondModificationParActeDto {
  @ApiPropertyOptional({ type: Number, minimum: 0.01, example: 100000 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  montant!: number;
}

/** Ceiling carried by an act or a category over a year. */
export class PlafondModificationParAnDto {
  @ApiPropertyOptional({ enum: UnitePlafond, example: UnitePlafond.MONTANT })
  @IsEnum(UnitePlafond)
  unite!: UnitePlafond;

  @ValidateIf((plafond: PlafondModificationParAnDto) => plafond.unite === UnitePlafond.MONTANT)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  montant?: number;

  @ValidateIf((plafond: PlafondModificationParAnDto) => plafond.unite === UnitePlafond.SEANCES)
  @IsInt()
  @IsPositive()
  nbSeances?: number;
}

/**
 * Constraint of a target carried by a single write.
 *
 * The provided scopes replace the existing ones, the omitted scopes are
 * cleared. A `null` payload clears every scope.
 */
export class PlafondsModificationDto {
  @ApiPropertyOptional({ type: PlafondModificationParActeDto, nullable: true })
  @IsOptional()
  @ValidateIf((dto: PlafondsModificationDto) => dto.parActe !== undefined)
  @IsObject({ message: 'Le plafond par acte doit être un objet.' })
  @ValidateNested()
  @Type(() => PlafondModificationParActeDto)
  parActe?: PlafondModificationParActeDto | null;

  @ApiPropertyOptional({ type: PlafondModificationParAnDto, nullable: true })
  @IsOptional()
  @ValidateIf((dto: PlafondsModificationDto) => dto.parAn !== undefined)
  @IsObject({ message: 'Le plafond annuel doit être un objet.' })
  @ValidateNested()
  @Type(() => PlafondModificationParAnDto)
  parAn?: PlafondModificationParAnDto | null;
}