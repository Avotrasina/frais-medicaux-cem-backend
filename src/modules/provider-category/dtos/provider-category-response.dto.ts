import { ApiProperty } from '@nestjs/swagger';
import type { ReadProviderCategory } from '../types/provider-category.types.js';

export class ProviderCategoryResponseDto implements ReadProviderCategory {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  nom!: string;
}
