import { ApiProperty } from '@nestjs/swagger';
import type { ReadAttestation } from '../types/attestation.types.js';
import { StatutAttestation } from '../types/attestation.types.js';

export class AttestationResponseDto implements ReadAttestation {
  @ApiProperty()
  id!: number;

  @ApiProperty({ type: String, nullable: true })
  attestationPath!: string | null;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  dateValidation!: Date | null;

  @ApiProperty()
  naturePrestation!: string;

  @ApiProperty({ type: String, nullable: true })
  servicePrestataire!: string | null;

  @ApiProperty({ enum: StatutAttestation })
  statut!: StatutAttestation;

  @ApiProperty()
  prestataireID!: number;

  @ApiProperty()
  idpBeneficiaire!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  datePEC!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ enum: StatutAttestation })
  attestationStatut!: StatutAttestation;
}
