import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  RoleUtilisateur,
  ServiceSortie,
  StatutFacture,
  TypeMouvement,
} from '../../../generated/prisma/enums.js';
import type {
  FactureListee,
  FactureWorkflowLue,
} from '../factures/globale/facture-globale.service.js';
import type { MontantsSerialises } from '../shared/serialiser-montants.js';
import type {
  ControleTotaux,
  LigneFactureCalculee,
  TotauxLignesFacture,
} from '../factures/individuelle/facture-individuelle.service.js';

export class PrestataireFactureResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  nom!: string;
}

export class MouvementFactureActionResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  factureGlobaleId!: number;

  @ApiProperty({ enum: TypeMouvement })
  type!: TypeMouvement;

  @ApiProperty({ type: String, format: 'date-time' })
  date!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, nullable: true })
  remarque!: string | null;

  @ApiProperty({ enum: ServiceSortie, nullable: true })
  service!: ServiceSortie | null;

  @ApiProperty()
  effectueParId!: number;

  @ApiProperty({ type: Number, nullable: true })
  adresseAId!: number | null;
}

export class PieceJointeListeFactureResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty({ type: String, nullable: true })
  nomFichier!: string | null;

  @ApiProperty()
  typeFichier!: string;

  @ApiProperty()
  tailleOctets!: number;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

export class FactureGlobaleResponseDto implements MontantsSerialises<FactureWorkflowLue> {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  refSociale!: string;

  @ApiProperty()
  annee!: number;

  @ApiProperty({ type: String, format: 'date-time' })
  dateReception!: Date;

  @ApiProperty()
  numFacture!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  dateFacture!: Date;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  moisPrestation!: Date | null;

  @ApiProperty({ type: String, nullable: true })
  refAgence!: string | null;

  @ApiProperty({ type: String, nullable: true })
  remarque!: string | null;

  @ApiProperty({ type: String, nullable: true })
  montantTotal!: string | null;

  @ApiProperty()
  total100Cem!: string;

  @ApiProperty()
  totalDepassement!: string;

  @ApiProperty()
  tauxCem!: string;

  @ApiProperty({ enum: StatutFacture })
  statut!: StatutFacture;

  @ApiProperty({ enum: StatutFacture, nullable: true })
  statutAvantSuppression!: StatutFacture | null;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  dateValidation!: Date | null;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  moisPaie!: Date | null;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  dateCloture!: Date | null;

  @ApiProperty()
  prestataireId!: number;

  @ApiProperty()
  enregistreParId!: number;

  @ApiProperty({ type: Number, nullable: true })
  valideParId!: number | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;

  @ApiProperty({ type: PrestataireFactureResponseDto })
  prestataire!: PrestataireFactureResponseDto;
}

export class FactureGlobaleListeeResponseDto
  extends FactureGlobaleResponseDto
  implements MontantsSerialises<FactureListee>
{
  @ApiProperty({ type: [PieceJointeListeFactureResponseDto] })
  piecesJointes!: PieceJointeListeFactureResponseDto[];
}

export class FactureGlobaleDetailResponseDto extends FactureGlobaleResponseDto {
  @ApiProperty()
  nombrePiecesJointes!: number;
}

export class FactureGlobaleCreeeResponseDto extends FactureGlobaleResponseDto {
  @ApiProperty({ type: [String] })
  avertissements!: string[];
}

export class UtilisateurMouvementResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  nom!: string;

  @ApiProperty({ enum: RoleUtilisateur })
  role!: RoleUtilisateur;
}

export class MouvementFactureResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  factureGlobaleId!: number;

  @ApiProperty({ enum: TypeMouvement })
  type!: TypeMouvement;

  @ApiProperty({ type: String, format: 'date-time' })
  date!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, nullable: true })
  remarque!: string | null;

  @ApiProperty({ enum: ServiceSortie, nullable: true })
  service!: ServiceSortie | null;

  @ApiProperty()
  effectueParId!: number;

  @ApiProperty({ type: Number, nullable: true })
  adresseAId!: number | null;

  @ApiProperty({ type: () => UtilisateurMouvementResponseDto })
  effectuePar!: UtilisateurMouvementResponseDto;

  @ApiProperty({
    type: () => UtilisateurMouvementResponseDto,
    nullable: true,
  })
  adresseA!: UtilisateurMouvementResponseDto | null;
}

export class FactureWorkflowResponseDto extends FactureGlobaleResponseDto {
  @ApiProperty({ type: MouvementFactureActionResponseDto })
  mouvement!: MouvementFactureActionResponseDto;
}

export class FactureGlobaleModificationResponseDto extends FactureGlobaleResponseDto {
  @ApiProperty()
  message!: string;
}

export class TransitionFactureResponseDto {
  @ApiProperty({ enum: TypeMouvement })
  type!: TypeMouvement;

  @ApiProperty({ enum: StatutFacture })
  statutResultat!: StatutFacture;

  @ApiProperty({ type: [String] })
  champsRequis!: readonly string[];
}

export class LigneActeResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  nom!: string;
}

export class LigneFactureResponseDto implements LigneFactureCalculee {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  numLigne!: number;

  @ApiProperty()
  libelle!: string;

  @ApiProperty({ format: 'date' })
  dateActe!: string;

  @ApiProperty()
  idp!: string;

  @ApiProperty({ type: LigneActeResponseDto })
  acte!: LigneActeResponseDto;

  @ApiProperty()
  montantActe!: string;

  @ApiProperty()
  montantDepassementActe!: string;

  @ApiProperty()
  montantDepassementPlafond!: string;

  @ApiProperty({ type: String, nullable: true })
  observationDepassement!: string | null;

  @ApiProperty()
  tauxCem!: string;

  @ApiProperty()
  montantCemIntegral!: string;

  @ApiProperty()
  montantCem!: string;

  @ApiProperty()
  montantAgent!: string;

  @ApiProperty()
  montantDepassement!: string;

  @ApiProperty()
  totalChargeAgent!: string;

  @ApiProperty({ type: Number, nullable: true })
  numPec!: number | null;

  @ApiProperty({ type: String, nullable: true })
  refPaie!: string | null;

  @ApiProperty({ type: String, format: 'date', nullable: true })
  moisAffectation!: string | null;

  @ApiProperty({ type: [String] })
  avertissements!: string[];
}

export class TotauxLignesFactureResponseDto implements TotauxLignesFacture {
  @ApiProperty()
  montantActe!: string;

  @ApiProperty()
  montantCemIntegral!: string;

  @ApiProperty()
  montantCem!: string;

  @ApiProperty()
  montantAgent!: string;

  @ApiProperty()
  montantDepassement!: string;

  @ApiProperty()
  totalChargeAgent!: string;
}

export class LignesFactureResponseDto {
  @ApiProperty({ type: [LigneFactureResponseDto] })
  lignes!: LigneFactureResponseDto[];

  @ApiProperty({ type: TotauxLignesFactureResponseDto })
  totaux!: TotauxLignesFactureResponseDto;
}

export class PropositionDepassementResponseDto {
  @ApiProperty()
  montantDepassementActe!: string;

  @ApiProperty()
  montantDepassementPlafond!: string;
}

export class AffectationRetenueResponseDto {
  @ApiProperty({ type: [Number] })
  ligneIds!: number[];

  @ApiProperty()
  refPaie!: string;

  @ApiPropertyOptional({ format: 'date' })
  moisAffectation?: string;
}

class ControleTotauxMontantsResponseDto {
  @ApiProperty()
  montantActe!: string;

  @ApiProperty()
  montantCemIntegral!: string;

  @ApiProperty()
  depassement!: string;
}

class ControleTotauxFactureResponseDto {
  @ApiProperty()
  montantTotal!: string;

  @ApiProperty()
  total100Cem!: string;

  @ApiProperty()
  totalDepassement!: string;
}

export class ControleTotauxResponseDto implements ControleTotaux {
  @ApiProperty()
  nombreLignes!: number;

  @ApiProperty()
  concordant!: boolean;

  @ApiProperty({ type: ControleTotauxMontantsResponseDto })
  sommes!: ControleTotauxMontantsResponseDto;

  @ApiProperty({ type: ControleTotauxFactureResponseDto })
  facture!: ControleTotauxFactureResponseDto;

  @ApiProperty({ type: ControleTotauxMontantsResponseDto })
  ecarts!: ControleTotauxMontantsResponseDto;
}
