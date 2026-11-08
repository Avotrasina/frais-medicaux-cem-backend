import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { AgentUseCaseTypes } from '../types/use-case.agent.types.js';
import type { ReadPersonneAgent } from '../types/agent.types.js';
import { BackOfficeFrontOffice } from '../types/agent.enum.types.js';
import { Sexe } from '../../personne/personne.types.js';
import { AgentType, StatutPEC } from '../types/agent.types.js';

export class AgentResponseDto implements AgentUseCaseTypes {
  @ApiProperty()
  matricule!: number;

  @ApiProperty()
  nom!: string;

  @ApiProperty()
  prenom!: string;

  @ApiProperty({ enum: StatutPEC })
  statutPEC!: StatutPEC;

  @ApiProperty({ type: String, format: 'date-time' })
  dateNaissance!: Date;

  @ApiProperty({ enum: Sexe })
  sexe!: Sexe;

  @ApiProperty({ enum: BackOfficeFrontOffice })
  backOfficeFrontOffice!: BackOfficeFrontOffice;

  @ApiPropertyOptional({ type: String, nullable: true })
  observationMatricule?: string | null;

  @ApiProperty()
  carteProfessionnellePath!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  dateEntree!: Date;

  @ApiPropertyOptional({ type: String, nullable: true })
  fonction?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  categorieID?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  structureID?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  codeService?: string | null;
}

class AgentDetailResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  matricule!: number;

  @ApiPropertyOptional({ type: String, nullable: true })
  fonction?: string | null;

  @ApiProperty({ enum: StatutPEC })
  statutPEC!: StatutPEC;

  @ApiPropertyOptional({ type: String, nullable: true })
  observationMatricule?: string | null;

  @ApiProperty()
  carteProfessionnellePath!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  dateEntree!: Date;

  @ApiProperty({ enum: AgentType })
  agentType!: AgentType;

  @ApiPropertyOptional({ type: String, nullable: true })
  structureID?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  codeDirection?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  codeService?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  codeAgence?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  categorieID?: string | null;
}

export class AgentDeletionRequestResponseDto implements ReadPersonneAgent {
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

  @ApiProperty({ type: AgentDetailResponseDto })
  agent!: AgentDetailResponseDto;
}
