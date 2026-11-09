import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Sexe } from '../../personne/personne.types.js';
import type { ReadAgentFamily } from '../types/agent-family.types.js';
import type { ReadConjoint } from '../types/conjoint.types.js';
import type { ReadEnfant } from '../types/enfant.types.js';

export class AgentFamilyResponseDto implements ReadAgentFamily {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  nom!: string;

  @ApiProperty()
  prenom!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  dateNaissance!: Date;

  @ApiProperty({ enum: Sexe })
  sexe!: Sexe;

  @ApiPropertyOptional({ type: Number, nullable: true })
  numConjoint?: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  numEnfant?: number | null;

  @ApiProperty()
  carteSocialPath!: string;

  @ApiProperty()
  agentMatricule!: number;
}

export class ConjointResponseDto implements ReadConjoint {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  nom!: string;

  @ApiProperty()
  prenom!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  dateNaissance!: Date;

  @ApiProperty({ enum: Sexe })
  sexe!: Sexe;

  @ApiProperty()
  numConjoint!: number;

  @ApiProperty()
  agentMatricule!: number;

  @ApiProperty()
  carteSocialePath!: string;
}

export class EnfantResponseDto implements ReadEnfant {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  nom!: string;

  @ApiProperty()
  prenom!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  dateNaissance!: Date;

  @ApiProperty({ enum: Sexe })
  sexe!: Sexe;

  @ApiProperty()
  numEnfant!: number;

  @ApiProperty()
  agentMatricule!: number;

  @ApiProperty()
  carteSocialePath!: string;
}
