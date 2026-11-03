import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsOptional, Matches } from 'class-validator';

const DATE_ISO = /^\d{4}-\d{2}-\d{2}$/;

function transformerBooleen({ value }: { value: unknown }): unknown {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}

export class ActeQueryDto {
  @ApiPropertyOptional({ type: Boolean, default: false })
  @Transform(transformerBooleen)
  @IsBoolean()
  avecPlafonds = false;

  @ApiPropertyOptional({ type: String, format: 'date', example: '2026-01-15' })
  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(DATE_ISO)
  date?: string;

  @ApiPropertyOptional({ type: Boolean, default: false })
  @Transform(transformerBooleen)
  @IsBoolean()
  historique = false;
}
