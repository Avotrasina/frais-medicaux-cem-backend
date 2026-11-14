import { ApiProperty } from '@nestjs/swagger';
import type { ReadLieu } from '../types/location.types.js';

export class LocationResponseDto implements ReadLieu {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  nom!: string;
}
