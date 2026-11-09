import { ApiProperty } from '@nestjs/swagger';
import {
  PorteePlafond,
  UnitePlafond,
} from '../../../generated/prisma/enums.js';
import type { ReadPlafond } from '../types/plafond.types.js';

export class PlafondResponseDto implements ReadPlafond {
  @ApiProperty({ format: 'date' })
  dateEffet!: string;

  @ApiProperty({ format: 'date', nullable: true })
  dateFin!: string | null;

  @ApiProperty()
  id!: number;

  @ApiProperty({ enum: PorteePlafond })
  porteePlafond!: PorteePlafond;

  @ApiProperty({ enum: UnitePlafond })
  unite!: UnitePlafond;

  @ApiProperty({ type: String, nullable: true })
  montant!: string | null;

  @ApiProperty({ type: Number, nullable: true })
  nbSeances!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  acteID!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  categorieActeID!: number | null;
}
