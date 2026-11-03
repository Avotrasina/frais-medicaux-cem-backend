import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { RegimeActe } from '../../../generated/prisma/enums.js';

export class CreateActeDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsNotEmpty()
  nomActe!: string;

  @IsString()
  @IsNotEmpty()
  listeLibelle!: string;

  @IsOptional()
  @IsEnum(RegimeActe)
  regime?: RegimeActe;

  @IsInt()
  @IsPositive()
  categorieActeId!: number;
}

export class UpdateActeDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  code?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nomActe?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  listeLibelle?: string;

  @IsOptional()
  @IsEnum(RegimeActe)
  regime?: RegimeActe;

  @IsOptional()
  @IsInt()
  @IsPositive()
  categorieActeId?: number;
}
