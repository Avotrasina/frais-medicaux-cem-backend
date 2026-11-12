import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../../../generated/prisma/client.js';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service.js';
import { FactureCalculService } from '../../shared/facture-calcul.service.js';

const INCLUDE_LIGNES_PAIE = {
  factureGlobale: { include: { prestataire: true } },
  acte: { include: { categorieActe: true } },
  beneficiaire: {
    include: {
      personne: {
        include: {
          agent: {
            include: {
              personne: true,
              service: { include: { direction: true } },
              structureOrganisationnelle: {
                include: { direction: true, agence: true },
              },
            },
          },
          familleAgent: {
            include: {
              conjoint: true,
              enfant: true,
              agent: {
                include: {
                  personne: true,
                  service: { include: { direction: true } },
                  structureOrganisationnelle: {
                    include: { direction: true, agence: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.FactureIndividuelleInclude;

type LignePaieDb = Prisma.FactureIndividuelleGetPayload<{
  include: typeof INCLUDE_LIGNES_PAIE;
}>;

type TotauxPaieDecimal = {
  montantActe: Prisma.Decimal;
  cem100: Prisma.Decimal;
  depassement: Prisma.Decimal;
  cem80: Prisma.Decimal;
  agent20: Prisma.Decimal;
  totalAgent: Prisma.Decimal;
};

type LignePaie = {
  numLigne: number;
  prestataireId: number;
  factureId: number;
  agentId: number;
  moisAffectation: string;
  refPaie: string | null;
  dateSaisie: string;
  refSociale: string;
  numFacture: string;
  dateFacture: string;
  nomEtablissement: string;
  idp: string;
  nomPrenomBeneficiaire: string;
  codeFam: 'AGT' | 'CJT' | 'EFT' | null;
  obsIdp: string | null;
  im: number;
  nomPrenomAgent: string;
  direction: string | null;
  serviceAgence: string | null;
  codeActe: string;
  acte: string;
  categorie: string;
  dateActe: string;
  numPec: string | null;
  montantActe: Prisma.Decimal;
  cem100: Prisma.Decimal;
  depassement: Prisma.Decimal;
  obsDepassement: string | null;
  cem80: Prisma.Decimal;
  agent20: Prisma.Decimal;
  totalAgent: Prisma.Decimal;
};

type LignePaieFormatee = Omit<
  LignePaie,
  | 'prestataireId'
  | 'factureId'
  | 'agentId'
  | 'montantActe'
  | 'cem100'
  | 'depassement'
  | 'cem80'
  | 'agent20'
  | 'totalAgent'
> & {
  montantActe: string;
  cem100: string;
  depassement: string;
  cem80: string;
  agent20: string;
  totalAgent: string;
};

type FiltreLignes = {
  im?: number;
  prestataireId?: number;
  factureId?: number;
  direction?: string;
};

const CLES_TOTAUX: Array<keyof TotauxPaieDecimal> = [
  'montantActe',
  'cem100',
  'depassement',
  'cem80',
  'agent20',
  'totalAgent',
];

@Injectable()
export class PaieEtatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly factureCalcul: FactureCalculService,
  ) {}

  async listerPaies() {
    const lignesDb = await this.prisma.factureIndividuelle.findMany({
      where: {
        moisAffectation: { not: null },
        factureGlobale: { dateCloture: { not: null } },
      },
      include: INCLUDE_LIGNES_PAIE,
    });
    const lignes = lignesDb.map((ligne) => this.formaterLigne(ligne));
    const mois = new Map<
      string,
      { factures: Set<number>; lignes: LignePaie[] }
    >();
    for (const ligne of lignes) {
      const moisPaie = ligne.moisAffectation.slice(0, 7);
      const groupe = mois.get(moisPaie) ?? {
        factures: new Set<number>(),
        lignes: [],
      };
      groupe.factures.add(ligne.factureId);
      groupe.lignes.push(ligne);
      mois.set(moisPaie, groupe);
    }
    return [...mois.entries()]
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([moisPaie, groupe]) => ({
        moisPaie,
        nombreFactures: groupe.factures.size,
        nombreLignes: groupe.lignes.length,
        totalAgent: this.formaterMontant(this.sommer(groupe.lignes).totalAgent),
      }));
  }

  async listerLignes(
    mois: string,
    filtres: FiltreLignes,
    page: number,
    limite: number,
  ) {
    const lignes = await this.chargerLignes(mois);
    const resultats = this.appliquerFiltres(lignes, filtres).sort(
      (a, b) =>
        a.refSociale.localeCompare(b.refSociale) || a.numLigne - b.numLigne,
    );
    const debut = (page - 1) * limite;
    return {
      total: resultats.length,
      page,
      limite,
      lignes: resultats
        .slice(debut, debut + limite)
        .map((ligne) => this.serialiserLigne(ligne)),
    };
  }

  async consommation(mois: string) {
    const lignes = await this.chargerLignes(mois);
    const parAgent = this.grouperParAgent(lignes);
    const agents = [...parAgent.entries()]
      .sort(([a], [b]) => a - b)
      .map(([im, lignesAgent]) => {
        const parPrestataire = new Map<
          number,
          { nom: string; lignes: LignePaie[] }
        >();
        for (const ligne of lignesAgent) {
          const groupe = parPrestataire.get(ligne.prestataireId) ?? {
            nom: ligne.nomEtablissement,
            lignes: [],
          };
          groupe.lignes.push(ligne);
          parPrestataire.set(ligne.prestataireId, groupe);
        }
        return {
          im,
          prestataires: [...parPrestataire.entries()]
            .sort(
              ([idA, a], [idB, b]) => a.nom.localeCompare(b.nom) || idA - idB,
            )
            .map(([, groupe]) => ({
              nomEtablissement: groupe.nom,
              nombreLignes: groupe.lignes.length,
              lignes: groupe.lignes.map((ligne) => this.serialiserLigne(ligne)),
              sousTotal: this.serialiserTotaux(this.sommer(groupe.lignes)),
            })),
          sousTotalAgent: this.serialiserTotaux(this.sommer(lignesAgent)),
        };
      });
    return {
      agents,
      totalGeneral: this.serialiserTotaux(this.sommer(lignes)),
    };
  }

  async etat(mois: string) {
    const lignes = await this.chargerLignes(mois);
    const agents = [...this.grouperParAgent(lignes).entries()]
      .sort(([a], [b]) => a - b)
      .map(([, lignesAgent]) => {
        const premiereLigne = lignesAgent[0];
        return {
          im: premiereLigne.im,
          nomPrenom: premiereLigne.nomPrenomAgent,
          direction: premiereLigne.direction,
          serviceAgence: premiereLigne.serviceAgence,
          ...this.serialiserTotaux(this.sommer(lignesAgent)),
        };
      });
    return { agents, total: this.serialiserTotaux(this.sommer(lignes)) };
  }

  async etatIndividuel(mois: string, im: number) {
    const agent = await this.prisma.agent.findUnique({
      where: { matricule: im },
      select: {
        matricule: true,
        personne: { select: { nom: true, prenom: true } },
      },
    });
    if (agent === null) {
      throw new NotFoundException(`L’agent ${im} est introuvable.`);
    }
    const lignes = (await this.chargerLignes(mois)).filter(
      (ligne) => ligne.im === im,
    );
    const parPrestataire = new Map<
      number,
      { nom: string; lignes: LignePaie[] }
    >();
    for (const ligne of lignes) {
      const groupe = parPrestataire.get(ligne.prestataireId) ?? {
        nom: ligne.nomEtablissement,
        lignes: [],
      };
      groupe.lignes.push(ligne);
      parPrestataire.set(ligne.prestataireId, groupe);
    }
    return {
      im: agent.matricule,
      nomPrenom: `${agent.personne.nom} ${agent.personne.prenom}`,
      groupes: [...parPrestataire.entries()]
        .sort(([idA, a], [idB, b]) => a.nom.localeCompare(b.nom) || idA - idB)
        .map(([, groupe]) => ({
          nomEtablissement: groupe.nom,
          nombreLignes: groupe.lignes.length,
          lignes: groupe.lignes.map((ligne) => this.serialiserLigne(ligne)),
          totalEtablissement: this.serialiserTotaux(this.sommer(groupe.lignes)),
        })),
      totalGeneral: this.serialiserTotaux(this.sommer(lignes)),
    };
  }

  private async chargerLignes(mois: string): Promise<LignePaie[]> {
    const moisAffectation = new Date(`${mois}-01T00:00:00.000Z`);
    const lignes = await this.prisma.factureIndividuelle.findMany({
      where: {
        moisAffectation,
        factureGlobale: { dateCloture: { not: null } },
      },
      include: INCLUDE_LIGNES_PAIE,
    });
    return lignes
      .map((ligne) => this.formaterLigne(ligne))
      .sort(
        (a, b) =>
          a.refSociale.localeCompare(b.refSociale) || a.numLigne - b.numLigne,
      );
  }

  private formaterLigne(ligne: LignePaieDb): LignePaie {
    const personne = ligne.beneficiaire.personne;
    const famille = personne.familleAgent;
    const agent = personne.agent ?? famille?.agent;
    if (agent === null || agent === undefined) {
      throw new Error(
        `Le bénéficiaire ${ligne.beneficiaire.idp} n’est rattaché à aucun agent.`,
      );
    }
    const parts = this.factureCalcul.calculerPartsLigne({
      montantActe: ligne.montantActe,
      montantDepassementActe: ligne.montantDepassementActe,
      montantDepassementPlafond: ligne.montantDepassementPlafond,
      tauxCem: ligne.tauxCem,
      montantCemIntegral: ligne.montantCemIntegral,
    });
    const codeFam =
      personne.agent !== null
        ? 'AGT'
        : famille?.conjoint !== null && famille?.conjoint !== undefined
          ? 'CJT'
          : famille?.enfant !== null && famille?.enfant !== undefined
            ? 'EFT'
            : null;
    return {
      numLigne: ligne.numLigne,
      prestataireId: ligne.factureGlobale.prestataireId,
      factureId: ligne.factureGlobaleId,
      agentId: agent.id,
      moisAffectation: this.dateTexte(ligne.moisAffectation),
      refPaie: ligne.refPaie,
      dateSaisie: this.dateTexte(ligne.createdAt),
      refSociale: ligne.factureGlobale.refSociale,
      numFacture: ligne.factureGlobale.numFacture,
      dateFacture: this.dateTexte(ligne.factureGlobale.dateFacture),
      nomEtablissement: ligne.factureGlobale.prestataire.nom,
      idp: ligne.beneficiaire.idp,
      nomPrenomBeneficiaire: `${personne.nom} ${personne.prenom}`,
      codeFam,
      obsIdp: ligne.beneficiaire.observationIDP,
      im: agent.matricule,
      nomPrenomAgent: `${agent.personne.nom} ${agent.personne.prenom}`,
      direction:
        agent.structureOrganisationnelle?.direction?.nom ??
        agent.service?.direction.nom ??
        null,
      serviceAgence:
        agent.service?.nom ??
        agent.structureOrganisationnelle?.agence?.codeAgence ??
        null,
      codeActe: ligne.acte.code,
      acte: ligne.libelle,
      categorie: ligne.acte.categorieActe.nomCategorie,
      dateActe: this.dateTexte(ligne.dateActe),
      numPec:
        ligne.priseEnChargeId === null
          ? null
          : String(ligne.priseEnChargeId).padStart(4, '0'),
      montantActe: ligne.montantActe,
      cem100: ligne.montantCemIntegral,
      depassement: parts.montantDepassement,
      obsDepassement: ligne.observationDepassement,
      cem80: parts.montantCem.minus(ligne.montantCemIntegral),
      agent20: parts.montantAgent,
      totalAgent: parts.totalChargeAgent,
    };
  }

  private appliquerFiltres(
    lignes: LignePaie[],
    filtres: FiltreLignes,
  ): LignePaie[] {
    return lignes.filter(
      (ligne) =>
        (filtres.im === undefined || ligne.im === filtres.im) &&
        (filtres.prestataireId === undefined ||
          ligne.prestataireId === filtres.prestataireId) &&
        (filtres.factureId === undefined ||
          ligne.factureId === filtres.factureId) &&
        (filtres.direction === undefined ||
          ligne.direction === filtres.direction),
    );
  }

  private grouperParAgent(lignes: LignePaie[]) {
    const groupes = new Map<number, LignePaie[]>();
    for (const ligne of lignes) {
      const groupe = groupes.get(ligne.im) ?? [];
      groupe.push(ligne);
      groupes.set(ligne.im, groupe);
    }
    return groupes;
  }

  private sommer(lignes: LignePaie[]): TotauxPaieDecimal {
    const totaux = this.creerTotauxVides();
    for (const ligne of lignes) {
      totaux.montantActe = totaux.montantActe.plus(ligne.montantActe);
      totaux.cem100 = totaux.cem100.plus(ligne.cem100);
      totaux.depassement = totaux.depassement.plus(ligne.depassement);
      totaux.cem80 = totaux.cem80.plus(ligne.cem80);
      totaux.agent20 = totaux.agent20.plus(ligne.agent20);
      totaux.totalAgent = totaux.totalAgent.plus(ligne.totalAgent);
    }
    return totaux;
  }

  private creerTotauxVides(): TotauxPaieDecimal {
    return {
      montantActe: new Prisma.Decimal(0),
      cem100: new Prisma.Decimal(0),
      depassement: new Prisma.Decimal(0),
      cem80: new Prisma.Decimal(0),
      agent20: new Prisma.Decimal(0),
      totalAgent: new Prisma.Decimal(0),
    };
  }

  private serialiserTotaux(totaux: TotauxPaieDecimal) {
    return Object.fromEntries(
      CLES_TOTAUX.map((cle) => [cle, this.formaterMontant(totaux[cle])]),
    ) as Record<keyof TotauxPaieDecimal, string>;
  }

  private serialiserLigne(ligne: LignePaie): LignePaieFormatee {
    const {
      prestataireId: _prestataireId,
      factureId: _factureId,
      agentId: _agentId,
      ...resultat
    } = ligne;
    return {
      ...resultat,
      montantActe: this.formaterMontant(ligne.montantActe),
      cem100: this.formaterMontant(ligne.cem100),
      depassement: this.formaterMontant(ligne.depassement),
      cem80: this.formaterMontant(ligne.cem80),
      agent20: this.formaterMontant(ligne.agent20),
      totalAgent: this.formaterMontant(ligne.totalAgent),
    };
  }

  private formaterMontant(montant: Prisma.Decimal): string {
    return montant.toFixed(2);
  }

  private dateTexte(date: Date | null): string {
    if (date === null) {
      throw new Error('Une ligne de paie clôturée doit avoir un mois affecté.');
    }
    return date.toISOString().slice(0, 10);
  }
}
