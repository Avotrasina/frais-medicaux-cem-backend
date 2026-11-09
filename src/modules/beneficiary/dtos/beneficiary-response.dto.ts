import { ApiProperty } from '@nestjs/swagger';
import { Sexe } from '../../personne/personne.types.js';
import type { ReadBeneficiary } from '../types/beneficiary.types.js';
import type { CodeFamille } from '../types/idp.types.js';

export class BeneficiaryResponseDto implements ReadBeneficiary {
  @ApiProperty()
  nom!: string;

  @ApiProperty()
  prenom!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  dateNaissance!: Date;

  @ApiProperty({ enum: Sexe })
  sexe!: Sexe;

  @ApiProperty()
  idp!: string;

  @ApiProperty({ type: String, nullable: true })
  observationIDP!: string | null;

  @ApiProperty()
  matricule!: number;

  @ApiProperty({ enum: ['AGENT', 'CONJOINT', 'ENFANT'] })
  codeFamille!: CodeFamille;

  @ApiProperty({ type: String, nullable: true })
  carteSocialePath!: string | null;

  @ApiProperty({ type: String, nullable: true })
  carteProfessionnellePath!: string | null;
}
