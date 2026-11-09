import { ApiProperty } from '@nestjs/swagger';

export class PaieMoisResponseDto {
  @ApiProperty({ example: '2026-03', pattern: '^\\d{4}-(0[1-9]|1[0-2])$' })
  moisPaie!: string;

  @ApiProperty()
  nombreFactures!: number;

  @ApiProperty()
  nombreLignes!: number;

  @ApiProperty({ example: '125000.00' })
  totalAgent!: string;
}

export class TotauxPaieResponseDto {
  @ApiProperty({ example: '150000.00' })
  montantActe!: string;

  @ApiProperty({ example: '100000.00' })
  cem100!: string;

  @ApiProperty({ example: '0.00' })
  depassement!: string;

  @ApiProperty({ example: '40000.00' })
  cem80!: string;

  @ApiProperty({ example: '10000.00' })
  agent20!: string;

  @ApiProperty({ example: '10000.00' })
  totalAgent!: string;
}

export class LignePaieResponseDto extends TotauxPaieResponseDto {
  @ApiProperty()
  numLigne!: number;

  @ApiProperty({ type: String, format: 'date' })
  moisAffectation!: string;

  @ApiProperty({ type: String, nullable: true })
  refPaie!: string | null;

  @ApiProperty({ type: String, format: 'date' })
  dateSaisie!: string;

  @ApiProperty()
  refSociale!: string;

  @ApiProperty()
  numFacture!: string;

  @ApiProperty({ type: String, format: 'date' })
  dateFacture!: string;

  @ApiProperty()
  nomEtablissement!: string;

  @ApiProperty()
  idp!: string;

  @ApiProperty()
  nomPrenomBeneficiaire!: string;

  @ApiProperty({ enum: ['AGT', 'CJT', 'EFT'], nullable: true })
  codeFam!: 'AGT' | 'CJT' | 'EFT' | null;

  @ApiProperty({ type: String, nullable: true })
  obsIdp!: string | null;

  @ApiProperty()
  im!: number;

  @ApiProperty()
  nomPrenomAgent!: string;

  @ApiProperty({ type: String, nullable: true })
  direction!: string | null;

  @ApiProperty({ type: String, nullable: true })
  serviceAgence!: string | null;

  @ApiProperty()
  codeActe!: string;

  @ApiProperty()
  acte!: string;

  @ApiProperty()
  categorie!: string;

  @ApiProperty({ type: String, format: 'date' })
  dateActe!: string;

  @ApiProperty({ type: String, nullable: true })
  numPec!: string | null;

  @ApiProperty({ type: String, nullable: true })
  obsDepassement!: string | null;
}

export class LignesPaiePagineesResponseDto {
  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limite!: number;

  @ApiProperty({ type: [LignePaieResponseDto] })
  lignes!: LignePaieResponseDto[];
}

export class PrestataireConsommationPaieResponseDto {
  @ApiProperty()
  nomEtablissement!: string;

  @ApiProperty()
  nombreLignes!: number;

  @ApiProperty({ type: [LignePaieResponseDto] })
  lignes!: LignePaieResponseDto[];

  @ApiProperty({ type: TotauxPaieResponseDto })
  sousTotal!: TotauxPaieResponseDto;
}

export class AgentConsommationPaieResponseDto {
  @ApiProperty()
  im!: number;

  @ApiProperty({ type: [PrestataireConsommationPaieResponseDto] })
  prestataires!: PrestataireConsommationPaieResponseDto[];

  @ApiProperty({ type: TotauxPaieResponseDto })
  sousTotalAgent!: TotauxPaieResponseDto;
}

export class ConsommationPaieResponseDto {
  @ApiProperty({ type: [AgentConsommationPaieResponseDto] })
  agents!: AgentConsommationPaieResponseDto[];

  @ApiProperty({ type: TotauxPaieResponseDto })
  totalGeneral!: TotauxPaieResponseDto;
}

export class EtatAgentPaieResponseDto extends TotauxPaieResponseDto {
  @ApiProperty()
  im!: number;

  @ApiProperty()
  nomPrenom!: string;

  @ApiProperty({ type: String, nullable: true })
  direction!: string | null;

  @ApiProperty({ type: String, nullable: true })
  serviceAgence!: string | null;
}

export class EtatPaieResponseDto {
  @ApiProperty({ type: [EtatAgentPaieResponseDto] })
  agents!: EtatAgentPaieResponseDto[];

  @ApiProperty({ type: TotauxPaieResponseDto })
  total!: TotauxPaieResponseDto;
}

export class GroupePrestataireEtatIndividuelResponseDto {
  @ApiProperty()
  nomEtablissement!: string;

  @ApiProperty()
  nombreLignes!: number;

  @ApiProperty({ type: [LignePaieResponseDto] })
  lignes!: LignePaieResponseDto[];

  @ApiProperty({ type: TotauxPaieResponseDto })
  totalEtablissement!: TotauxPaieResponseDto;
}

export class EtatIndividuelPaieResponseDto {
  @ApiProperty()
  im!: number;

  @ApiProperty()
  nomPrenom!: string;

  @ApiProperty({ type: [GroupePrestataireEtatIndividuelResponseDto] })
  groupes!: GroupePrestataireEtatIndividuelResponseDto[];

  @ApiProperty({ type: TotauxPaieResponseDto })
  totalGeneral!: TotauxPaieResponseDto;
}

export class FactureClotureeResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  refSociale!: string;

  @ApiProperty()
  nombreLignes!: number;

  @ApiProperty({ example: '125000.00' })
  totalAgent!: string;
}

export class CloturePaieResponseDto {
  @ApiProperty({ example: '2026-03', pattern: '^\\d{4}-(0[1-9]|1[0-2])$' })
  moisPaie!: string;

  @ApiProperty({ example: '2026-03-25', format: 'date' })
  dateCloture!: string;

  @ApiProperty({ type: [FactureClotureeResponseDto] })
  factures!: FactureClotureeResponseDto[];
}

export class RefusClotureDetailResponseDto {
  @ApiProperty({ enum: ['montantTotal', 'total100Cem', 'totalDepassement'] })
  champ!: 'montantTotal' | 'total100Cem' | 'totalDepassement';

  @ApiProperty()
  valeurFacture!: string;

  @ApiProperty()
  totalLignes!: string;

  @ApiProperty()
  ecart!: string;
}

export class RefusClotureResponseDto {
  @ApiProperty()
  factureId!: number;

  @ApiProperty({ type: String, nullable: true })
  refSociale!: string | null;

  @ApiProperty({
    enum: ['INTROUVABLE', 'SUPPRIMEE', 'DEJA_CLOTUREE', 'INCOMPLET', 'ECART'],
  })
  raison!:
    | 'INTROUVABLE'
    | 'SUPPRIMEE'
    | 'DEJA_CLOTUREE'
    | 'INCOMPLET'
    | 'ECART';

  @ApiProperty({ type: RefusClotureDetailResponseDto, required: false })
  detail?: RefusClotureDetailResponseDto;
}
