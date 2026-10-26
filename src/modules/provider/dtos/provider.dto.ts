import {
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProviderStatus } from '../types/provider.types.js';

export class CreateProviderDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nom!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  adresse!: string;

  @ApiProperty({ enum: ProviderStatus })
  @IsEnum(ProviderStatus)
  statut!: ProviderStatus;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nif!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  stat!: string;

  @ApiProperty({ type: String, format: 'date', example: '2026-01-01' })
  @Type(() => Date)
  @IsDate()
  dateDebutConvention!: Date;

  @ApiProperty({ type: String, format: 'date', example: '2026-12-31' })
  @Type(() => Date)
  @IsDate()
  dateFinConvention!: Date;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  listePrestation!: string;

  @ApiProperty({ type: Number })
  @Type(() => Number)
  @IsInt()
  lieuID!: number;

  @ApiProperty({ type: Number })
  @Type(() => Number)
  @IsInt()
  categorieID!: number;
}

export class UpdateProviderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  adresse?: string;

  @ApiPropertyOptional({ enum: ProviderStatus })
  @IsOptional()
  @IsEnum(ProviderStatus)
  statut?: ProviderStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nif?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  stat?: string;

  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dateDebutConvention?: Date;

  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dateFinConvention?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  listePrestation?: string;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  lieuID?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categorieID?: number;
}
