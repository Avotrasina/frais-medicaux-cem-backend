import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UnitePlafond } from '../../../generated/prisma/enums.js';
import type { CibleSuivi, FeuilleSuivi } from '../suivi/suivi.service.js';
import type { ModeleSuivi } from '../suivi/suivi-modele.js';
import {
  PlafondResoluResponseDto,
  VersionPlafondResponseDto,
} from '../../plafond/dtos/plafond-resolution-response.dto.js';

class EnteteFeuilleSuiviResponseDto {
  @ApiProperty()
  idp!: string;

  @ApiProperty({ type: Number, nullable: true })
  im!: number | null;

  @ApiProperty()
  nomPrenomBeneficiaire!: string;

  @ApiProperty({ type: String, nullable: true })
  nomPrenomAgent!: string | null;

  @ApiProperty({ enum: ['Agent', 'Conjoint', 'Enfant'], nullable: true })
  codeFam!: 'Agent' | 'Conjoint' | 'Enfant' | null;

  @ApiProperty({ type: String, nullable: true })
  direction!: string | null;

  @ApiProperty({ type: String, nullable: true })
  serviceAgence!: string | null;

  @ApiProperty({ type: String, nullable: true })
  observationIdp!: string | null;
}

class ColonneSuiviResponseDto {
  @ApiProperty()
  cle!: string;

  @ApiProperty()
  libelle!: string;
}

class CibleFeuilleSuiviResponseDto {
  @ApiProperty({ enum: ['acte', 'categorie'] })
  type!: 'acte' | 'categorie';

  @ApiProperty()
  id!: number;

  @ApiProperty()
  nom!: string;
}

class PlafondFeuilleSuiviResponseDto {
  @ApiProperty({ enum: UnitePlafond })
  unite!: UnitePlafond;

  @ApiProperty()
  valeur!: string;

  @ApiPropertyOptional({ format: 'date' })
  dateEffet?: string;
}

class PlafondAnnuelFeuilleSuiviResponseDto extends PlafondFeuilleSuiviResponseDto {
  @ApiProperty()
  modifieEnCoursDAnnee!: boolean;
}

class PlafondsFeuilleSuiviResponseDto {
  @ApiProperty({ type: PlafondFeuilleSuiviResponseDto, nullable: true })
  parActe!: PlafondFeuilleSuiviResponseDto | null;

  @ApiProperty({ type: PlafondAnnuelFeuilleSuiviResponseDto })
  parAn!: PlafondAnnuelFeuilleSuiviResponseDto;

  @ApiPropertyOptional({ type: [VersionPlafondResponseDto] })
  historique?: VersionPlafondResponseDto[];
}

class ActeLigneSuiviResponseDto {
  @ApiProperty()
  code!: string;

  @ApiProperty()
  nom!: string;
}

class LigneFeuilleSuiviResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  refSociale!: string;

  @ApiProperty({ format: 'date' })
  dateActe!: string;

  @ApiProperty()
  libelle!: string;

  @ApiProperty({ type: ActeLigneSuiviResponseDto })
  acte!: ActeLigneSuiviResponseDto;

  @ApiProperty()
  montantActe!: string;

  @ApiProperty({ type: String, nullable: true })
  depassementActe!: string | null;

  @ApiProperty({ type: String, nullable: true })
  cumulActeConsomme!: string | null;

  @ApiProperty({ type: String, nullable: true })
  soldePlafond!: string | null;

  @ApiProperty({ type: String, nullable: true })
  depassementPlafond!: string | null;

  @ApiProperty()
  totalDepassement!: string;

  @ApiProperty()
  nomEtablissement!: string;

  @ApiProperty({ type: String, nullable: true })
  libelleSeance!: string | null;

  @ApiProperty({ type: Number, nullable: true })
  numeroSeance!: number | null;

  @ApiProperty()
  plafondAnnuelApplique!: string;

  @ApiProperty({ type: String, nullable: true })
  capaciteRestante!: string | null;

  @ApiProperty({ type: String, nullable: true })
  seancesRestantes!: string | null;

  @ApiProperty()
  verrouillee!: boolean;
}

class TotauxFeuilleSuiviResponseDto {
  @ApiProperty()
  montantActe!: string;

  @ApiProperty()
  totalDepassement!: string;

  @ApiPropertyOptional()
  depassementActe?: string;

  @ApiPropertyOptional()
  depassementPlafond?: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  cumulActeConsomme?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  soldePlafond?: string | null;

  @ApiPropertyOptional()
  seancesUtilisees?: number;
}

export class FeuilleSuiviResponseDto implements FeuilleSuivi {
  @ApiProperty({ type: EnteteFeuilleSuiviResponseDto })
  entete!: EnteteFeuilleSuiviResponseDto;

  @ApiProperty({
    enum: ['PLAFOND_ANNUEL', 'SEANCES', 'PLAFOND_ACTE_ET_ANNUEL'],
  })
  modele!: ModeleSuivi;

  @ApiProperty({ type: [ColonneSuiviResponseDto] })
  colonnes!: ColonneSuiviResponseDto[];

  @ApiProperty({ type: CibleFeuilleSuiviResponseDto })
  cible!: CibleFeuilleSuiviResponseDto;

  @ApiProperty()
  annee!: number;

  @ApiProperty({ type: PlafondsFeuilleSuiviResponseDto })
  plafonds!: PlafondsFeuilleSuiviResponseDto;

  @ApiProperty({ type: [LigneFeuilleSuiviResponseDto] })
  lignes!: LigneFeuilleSuiviResponseDto[];

  @ApiProperty({ type: TotauxFeuilleSuiviResponseDto })
  totaux!: TotauxFeuilleSuiviResponseDto;
}

export class FeuilleSuiviCompacteResponseDto implements Pick<
  FeuilleSuivi,
  'modele' | 'annee' | 'lignes' | 'totaux'
> {
  @ApiProperty({
    enum: ['PLAFOND_ANNUEL', 'SEANCES', 'PLAFOND_ACTE_ET_ANNUEL'],
  })
  modele!: ModeleSuivi;

  @ApiProperty()
  annee!: number;

  @ApiProperty({ type: [LigneFeuilleSuiviResponseDto] })
  lignes!: LigneFeuilleSuiviResponseDto[];

  @ApiProperty({ type: TotauxFeuilleSuiviResponseDto })
  totaux!: TotauxFeuilleSuiviResponseDto;
}

class PlafondsCibleSuiviResponseDto {
  @ApiProperty({ type: PlafondResoluResponseDto, nullable: true })
  parAn!: PlafondResoluResponseDto | null;

  @ApiProperty({ type: PlafondResoluResponseDto, nullable: true })
  parActe!: PlafondResoluResponseDto | null;
}

export class CibleSuiviResponseDto implements CibleSuivi {
  @ApiProperty({ enum: ['ACTE', 'CATEGORIE'] })
  type!: 'ACTE' | 'CATEGORIE';

  @ApiProperty()
  id!: number;

  @ApiProperty()
  nom!: string;

  @ApiPropertyOptional()
  code?: string;

  @ApiPropertyOptional()
  categorieActeId?: number;

  @ApiPropertyOptional()
  categorieActe?: string;

  @ApiProperty({ type: PlafondsCibleSuiviResponseDto })
  plafonds!: PlafondsCibleSuiviResponseDto;

  @ApiProperty({
    enum: ['PLAFOND_ANNUEL', 'SEANCES', 'PLAFOND_ACTE_ET_ANNUEL'],
  })
  modeleSuivi!: ModeleSuivi;
}

export class FeuilleSuiviModifieeResponseDto {
  @ApiProperty({ type: FeuilleSuiviResponseDto })
  ancienne!: FeuilleSuiviResponseDto;

  @ApiProperty({ type: FeuilleSuiviResponseDto })
  nouvelle!: FeuilleSuiviResponseDto;
}
