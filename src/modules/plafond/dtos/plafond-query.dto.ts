import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsPositive,
  Matches,
} from 'class-validator';

const DATE_ISO = /^\d{4}-\d{2}-\d{2}$/;

export class PlafondQueryDto {
  @ApiPropertyOptional({ type: Number, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  acteId?: number;

  @ApiPropertyOptional({ type: Number, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  categorieActeId?: number;

  @ApiPropertyOptional({ type: String, format: 'date', example: '2026-01-15' })
  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(DATE_ISO)
  date?: string;
}
