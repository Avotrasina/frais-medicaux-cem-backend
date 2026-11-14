import { ApiPropertyOptional } from '@nestjs/swagger';
import { ActeQueryDto } from '../../acte/dtos/acte-query.dto.js';
import { Transform } from 'class-transformer';
import { IsBoolean } from 'class-validator';

export class CategorieActeQueryDto extends ActeQueryDto {
  @ApiPropertyOptional({ type: Boolean, default: false })
  @Transform(({ value }: { value: unknown }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  inclureActes = false;
}
