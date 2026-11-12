import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsInt,
  IsPositive,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CloturerPaieDto {
  @ApiProperty({ example: '2026-03-25', format: 'date' })
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  dateCloture!: string;

  @ApiProperty({ type: [Number], uniqueItems: true, minItems: 1 })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  @IsPositive({ each: true })
  factureIds!: number[];
}
