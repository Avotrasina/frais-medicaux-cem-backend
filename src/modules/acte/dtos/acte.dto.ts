import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { RegimeActe } from '../../../generated/prisma/enums.js';
import { UpdatePlafondDto } from '../../plafond/dtos/plafond.dto.js';

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

export class UpdateActeDto extends UpdatePlafondDto {
  @ApiPropertyOptional({ example: 'CON-01' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  code?: string;

  @ApiPropertyOptional({ example: 'Consultation généraliste' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nomActe?: string;

  @ApiPropertyOptional({ example: 'Consultation généraliste' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  listeLibelle?: string;

  @ApiPropertyOptional({ enum: RegimeActe, example: RegimeActe.NORMAL })
  @IsOptional()
  @IsEnum(RegimeActe)
  regime?: RegimeActe;

  @ApiPropertyOptional({ type: Number, minimum: 1, example: 12 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  categorieActeId?: number;
}
