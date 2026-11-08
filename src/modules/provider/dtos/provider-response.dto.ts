import { ApiProperty } from '@nestjs/swagger';
import { ProviderStatus } from '../types/provider.types.js';
import type { ReadProvider } from '../types/provider.types.js';

export class ProviderResponseDto implements ReadProvider {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  nom!: string;

  @ApiProperty()
  adresse!: string;

  @ApiProperty({ enum: ProviderStatus })
  statut!: ProviderStatus;

  @ApiProperty()
  nif!: string;

  @ApiProperty()
  stat!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  dateDebutConvention!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  dateFinConvention!: Date;

  @ApiProperty()
  listePrestation!: string;

  @ApiProperty({ type: String, nullable: true })
  echeanceRenouvellement!: string | null;

  @ApiProperty({ type: String, nullable: true })
  echeanceResiliation!: string | null;

  @ApiProperty({ type: String, nullable: true })
  observation!: string | null;

  @ApiProperty()
  lieuID!: number;

  @ApiProperty()
  categorieID!: number;
}
