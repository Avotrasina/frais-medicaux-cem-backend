import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export class CreerFactureIndividuelleDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  libelle!: string;

  @ApiProperty({ type: String, format: 'date', example: '2026-01-15' })
  @IsDateString({ strict: true })
  @Matches(DATE)
  dateActe!: string;

  @ApiProperty({
    description: 'IDP du bénéficiaire, pas la référence sociale de la facture.',
  })
  @IsString()
  @IsNotEmpty()
  idp!: string;

  @ApiProperty()
  @IsInt()
  @IsPositive()
  acteId!: number;

  @ApiPropertyOptional({
    type: Number,
    description: 'Identifiant de l’attestation de prise en charge.',
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  numPec?: number;

  @ApiProperty({ type: Number, minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  montantActe!: number;

  @ApiPropertyOptional({ type: Number, minimum: 0, default: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  montantDepassementActe?: number;

  @ApiPropertyOptional({ type: Number, minimum: 0, default: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  montantDepassementPlafond?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observationDepassement?: string;
}

export class ModifierFactureIndividuelleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  libelle?: string;

  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(DATE)
  dateActe?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  idp?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @IsPositive()
  acteId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @IsPositive()
  numPec?: number;

  @ApiPropertyOptional({ type: Number, minimum: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  montantActe?: number;

  @ApiPropertyOptional({ type: Number, minimum: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  montantDepassementActe?: number;

  @ApiPropertyOptional({ type: Number, minimum: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  montantDepassementPlafond?: number;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  observationDepassement?: string | null;
}

export class PropositionDepassementDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  idp!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  acteId!: number;

  @ApiProperty({ type: String, format: 'date', example: '2026-01-15' })
  @IsDateString({ strict: true })
  @Matches(DATE)
  dateActe!: string;
}

export class AffecterRetenueDto {
  @ApiProperty({ type: [Number], uniqueItems: true })
  @Type(() => Number)
  @IsInt({ each: true })
  @IsPositive({ each: true })
  ligneIds!: number[];

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refPaie!: string;

  @ApiProperty({ type: String, format: 'month', example: '2026-01' })
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/)
  moisAffectation!: string;
}
