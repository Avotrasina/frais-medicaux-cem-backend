import { ApiProperty } from '@nestjs/swagger';
import {
  PorteePlafond,
  UnitePlafond,
} from '../../../generated/prisma/enums.js';
import type {
  PlafondResolu,
  VersionPlafond,
} from '../plafond-resolution.service.js';

export class PlafondResoluResponseDto implements PlafondResolu {
  @ApiProperty()
  id!: number;

  @ApiProperty({ enum: UnitePlafond })
  unite!: UnitePlafond;

  @ApiProperty({ oneOf: [{ type: 'string' }, { type: 'number' }] })
  valeur!: string | number;

  @ApiProperty({ enum: ['ACTE', 'CATEGORIE'] })
  source!: 'ACTE' | 'CATEGORIE';
}

export class VersionPlafondResponseDto
  extends PlafondResoluResponseDto
  implements VersionPlafond
{
  @ApiProperty({ enum: PorteePlafond })
  porteePlafond!: PorteePlafond;

  @ApiProperty({ format: 'date' })
  dateEffet!: string;

  @ApiProperty({ format: 'date', nullable: true })
  dateFin!: string | null;
}
