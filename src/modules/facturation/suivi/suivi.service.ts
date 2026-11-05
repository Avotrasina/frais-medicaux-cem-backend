import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client.js';
import {
  PorteePlafond,
  StatutFacture,
  UnitePlafond,
} from '../../../generated/prisma/enums.js';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import type { ActeurFacture } from '../factures/globale/facture-globale.service.js';
import { ActionFacture } from '../shared/action-facture.js';
import { FacturePermissionsService } from '../shared/facture-permissions.service.js';
import {
  SuiviCalculService,
  type LigneSuiviCalculee,
} from './suivi-calcul.service.js';
import { determinerModeleSuivi, type ModeleSuivi } from './suivi-modele.js';
import {
  PlafondResolutionService,
  type CiblePlafond,
  type VersionPlafond,
} from '../../plafond/plafond-resolution.service.js';
import type {
  CreerLigneSuiviDto,
  ModifierLigneSuiviDto,
} from '../dtos/suivi.dto.js';

const STATUTS_ECRITURE_INTERDITE: readonly StatutFacture[] = [
  StatutFacture.RETOURNEE,
  StatutFacture.SUPPRESSION_DEMANDEE,
  StatutFacture.SUPPRIMEE,
];

interface PlafondLu {
  unite: UnitePlafond;
  valeur: Prisma.Decimal;
  dateEffet: Date;
}

interface ContexteLigne {
  id: number;
  factureGlobaleId: number;
  beneficiaireId: number;
  acteId: number;
  dateActe: Date;
  libelle: string;
  montantActe: Prisma.Decimal;
  refSociale: string;
  prestataire: string;
  acteCode: string;
  acteNom: string;
  cible: string;
  plafondAnnuel: PlafondLu;
  plafondParActe?: PlafondLu;
}

interface ColonneSuivi {
  cle: string;
  libelle: string;
}

export interface FeuilleSuivi {
  entete: {
    idp: string;
    im: number | null;
    nomPrenomBeneficiaire: string;
    nomPrenomAgent: string | null;
    codeFam: 'Agent' | 'Conjoint' | 'Enfant' | null;
    direction: string | null;
    serviceAgence: string | null;
    observationIdp: string | null;
  };
  modele: ModeleSuivi;
  colonnes: ColonneSuivi[];
  cible: { type: 'acte' | 'categorie'; id: number; nom: string };
  annee: number;
  plafonds: {
    parActe: {
      unite: UnitePlafond;
      valeur: string;
      dateEffet?: string;
    } | null;
    parAn: {
      unite: UnitePlafond;
      valeur: string;
      dateEffet?: string;
      modifieEnCoursDAnnee: boolean;
    };
    historique?: VersionPlafond[];
  };
  lignes: Array<{
    id: number;
    refSociale: string;
    dateActe: string;
    libelle: string;
    acte: { code: string; nom: string };
    montantActe: string;
    depassementActe: string | null;
    cumulActeConsomme: string | null;
    soldePlafond: string | null;
    depassementPlafond: string | null;
    totalDepassement: string;
    nomEtablissement: string;
    libelleSeance: string | null;
    numeroSeance: number | null;
    plafondAnnuelApplique: string;
    capaciteRestante: string | null;
    seancesRestantes: string | null;
    verrouillee: boolean;
  }>;
  totaux: {
    montantActe: string;
    totalDepassement: string;
    depassementActe?: string;
    depassementPlafond?: string;
    cumulActeConsomme?: string | null;
    soldePlafond?: string | null;
    seancesUtilisees?: number;
  };
}

const COLONNES_COMMUNES: ColonneSuivi[] = [
  { cle: 'refSociale', libelle: 'Ref Social' },
  { cle: 'dateActe', libelle: "Date de l'Acte" },
  { cle: 'libelle', libelle: 'Libellé' },
  { cle: 'montantActe', libelle: "Montant de l'acte" },
];

const COLONNES_PAR_MODELE: Record<ModeleSuivi, ColonneSuivi[]> = {
  PLAFOND_ANNUEL: [
    ...COLONNES_COMMUNES,
    { cle: 'cumulActeConsomme', libelle: 'Montant cumulé' },
    { cle: 'soldePlafond', libelle: 'Solde du Plafond' },
    { cle: 'totalDepassement', libelle: 'Montant Dépassement' },
    { cle: 'nomEtablissement', libelle: "Nom de l'établissement" },
  ],
  SEANCES: [
    ...COLONNES_COMMUNES,
    { cle: 'libelleSeance', libelle: 'N° Séance' },
    { cle: 'totalDepassement', libelle: 'Montant Dépassement' },
    { cle: 'nomEtablissement', libelle: "Nom de l'établissement" },
  ],
  PLAFOND_ACTE_ET_ANNUEL: [
    ...COLONNES_COMMUNES,
    { cle: 'depassementActe', libelle: "Dépassement à l'acte" },
    { cle: 'cumulActeConsomme', libelle: 'Cumul Acte Consommé' },
    { cle: 'soldePlafond', libelle: 'Solde du Plafond' },
    { cle: 'depassementPlafond', libelle: 'Dépassement au Plafond' },
    { cle: 'totalDepassement', libelle: 'Total Dépassement' },
    { cle: 'nomEtablissement', libelle: "Nom de l'établissement" },
  ],
};

@Injectable()
export class SuiviService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly calcul: SuiviCalculService,
    private readonly permissions: FacturePermissionsService,
    private readonly plafondResolution: PlafondResolutionService,
  ) {}

  async creer(
    idFacture: number,
    acteur: ActeurFacture,
    donnees: CreerLigneSuiviDto,
  ): Promise<FeuilleSuivi> {
    this.permissions.verifier(ActionFacture.SUIVI_CREER, acteur.role);
    const dateActe = this.convertirDate(donnees.dateActe);
    this.verifierDatePasDansLeFutur(dateActe);
    const contexte = await this.resoudreNouvelleLigne(
      idFacture,
      donnees.idp,
      donnees.acteId,
      dateActe,
      donnees.libelle,
      donnees.montantActe,
    );
    await this.prisma.ligneSuivi.create({
      data: {
        factureGlobaleId: idFacture,
        beneficiaireId: contexte.beneficiaireId,
        acteId: contexte.acteId,
        dateActe,
        libelle: donnees.libelle ?? contexte.acteNom,
        montantActe: new Prisma.Decimal(String(donnees.montantActe)),
        saisiParId: acteur.id,
      },
    });
    return this.obtenirFeuille(
      donnees.idp,
      donnees.acteId,
      dateActe.getUTCFullYear(),
    );
  }

  async lire(
    idp: string,
    acteId: number,
    annee: number,
    factureId?: number,
    historique = false,
  ): Promise<FeuilleSuivi> {
    if (!Number.isInteger(annee) || annee < 1900 || annee > 2200)
      throw new BadRequestException('L’année est invalide.');
    return this.obtenirFeuille(idp, acteId, annee, factureId, historique);
  }

  async modifier(
    ligneId: number,
    acteur: ActeurFacture,
    donnees: ModifierLigneSuiviDto,
  ): Promise<
    FeuilleSuivi | { ancienne: FeuilleSuivi; nouvelle: FeuilleSuivi }
  > {
    this.permissions.verifier(ActionFacture.SUIVI_MODIFIER, acteur.role);
    if (Object.keys(donnees).length === 0)
      throw new BadRequestException('Au moins un champ doit être fourni.');
    const ligne = await this.prisma.ligneSuivi.findUnique({
      where: { id: ligneId },
      include: { factureGlobale: true, beneficiaire: true, acte: true },
    });
    if (ligne === null)
      throw new NotFoundException(
        `La ligne de suivi ${ligneId} est introuvable.`,
      );
    this.verifierEcritureFacture(ligne.factureGlobale.statut);
    await this.verifierVerrou(
      ligne.factureGlobaleId,
      ligne.beneficiaireId,
      ligne.acteId,
      ligne.dateActe,
      ligneId,
    );
    const dateActe =
      donnees.dateActe === undefined
        ? ligne.dateActe
        : this.convertirDate(donnees.dateActe);
    this.verifierDatePasDansLeFutur(dateActe);
    const acteId = donnees.acteId ?? ligne.acteId;
    const acte = await this.prisma.acte.findUnique({ where: { id: acteId } });
    if (acte === null)
      throw new NotFoundException(`L’acte ${acteId} est introuvable.`);
    const ancien = await this.obtenirFeuille(
      ligne.beneficiaire.idp,
      ligne.acteId,
      ligne.dateActe.getUTCFullYear(),
    );
    await this.resoudreNouvelleLigne(
      ligne.factureGlobaleId,
      ligne.beneficiaire.idp,
      acteId,
      dateActe,
      donnees.libelle ?? ligne.libelle,
      donnees.montantActe ?? Number(ligne.montantActe.toString()),
    );
    await this.prisma.ligneSuivi.update({
      where: { id: ligneId },
      data: {
        acteId,
        dateActe,
        libelle: donnees.libelle,
        montantActe:
          donnees.montantActe === undefined
            ? undefined
            : new Prisma.Decimal(String(donnees.montantActe)),
      },
    });
    const nouvelle = await this.obtenirFeuille(
      ligne.beneficiaire.idp,
      acteId,
      dateActe.getUTCFullYear(),
    );
    return ancien.annee === nouvelle.annee &&
      ancien.cible.id === nouvelle.cible.id
      ? nouvelle
      : { ancienne: ancien, nouvelle };
  }

  async supprimer(
    ligneId: number,
    acteur: ActeurFacture,
  ): Promise<FeuilleSuivi> {
    this.permissions.verifier(ActionFacture.SUIVI_SUPPRIMER, acteur.role);
    const ligne = await this.prisma.ligneSuivi.findUnique({
      where: { id: ligneId },
      include: { factureGlobale: true, beneficiaire: true },
    });
    if (ligne === null)
      throw new NotFoundException(
        `La ligne de suivi ${ligneId} est introuvable.`,
      );
    this.verifierEcritureFacture(ligne.factureGlobale.statut);
    await this.verifierVerrou(
      ligne.factureGlobaleId,
      ligne.beneficiaireId,
      ligne.acteId,
      ligne.dateActe,
      ligneId,
    );
    await this.prisma.ligneSuivi.delete({ where: { id: ligneId } });
    return this.obtenirFeuille(
      ligne.beneficiaire.idp,
      ligne.acteId,
      ligne.dateActe.getUTCFullYear(),
    );
  }

  private async resoudreNouvelleLigne(
    idFacture: number,
    idp: string,
    acteId: number,
    dateActe: Date,
    libelle: string | undefined,
    montant: number,
  ): Promise<ContexteLigne> {
    const facture = await this.prisma.factureGlobale.findUnique({
      where: { id: idFacture },
      select: {
        id: true,
        statut: true,
        refSociale: true,
        prestataire: { select: { nom: true } },
      },
    });
    if (facture === null)
      throw new NotFoundException(`La facture ${idFacture} est introuvable.`);
    this.verifierEcritureFacture(facture.statut);
    const beneficiaire = await this.prisma.beneficiaire.findUnique({
      where: { idp },
      include: { personne: true },
    });
    if (beneficiaire === null)
      throw new NotFoundException(`Le bénéficiaire ${idp} est introuvable.`);
    const acte = await this.prisma.acte.findUnique({
      where: { id: acteId },
      include: { categorieActe: true },
    });
    if (acte === null)
      throw new NotFoundException(`L’acte ${acteId} est introuvable.`);
    const plafonds = await this.resoudrePlafonds(
      acte.id,
      acte.categorieActeId,
      dateActe,
    );
    if (plafonds.annuel === null)
      throw new UnprocessableEntityException(
        'Aucun plafond annuel en vigueur pour cet acte à la date de l’acte.',
      );
    return {
      id: 0,
      factureGlobaleId: facture.id,
      beneficiaireId: beneficiaire.id,
      acteId: acte.id,
      dateActe,
      libelle: libelle ?? acte.nomActe,
      montantActe: new Prisma.Decimal(String(montant)),
      refSociale: facture.refSociale,
      prestataire: facture.prestataire.nom,
      acteCode: acte.code,
      acteNom: acte.nomActe,
      cible: plafonds.cible,
      plafondAnnuel: plafonds.annuel,
      plafondParActe: plafonds.parActe,
    };
  }

  private async obtenirFeuille(
    idp: string,
    acteId: number,
    annee: number,
    factureId?: number,
    inclureHistorique = false,
  ): Promise<FeuilleSuivi> {
    const beneficiaire = await this.prisma.beneficiaire.findUnique({
      where: { idp },
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
    });
    if (beneficiaire === null)
      throw new NotFoundException(`Le bénéficiaire ${idp} est introuvable.`);
    const acteDemande = await this.prisma.acte.findUnique({
      where: { id: acteId },
      include: { categorieActe: true },
    });
    if (acteDemande === null)
      throw new NotFoundException(`L’acte ${acteId} est introuvable.`);
    const bornes = {
      gte: new Date(Date.UTC(annee, 0, 1)),
      lt: new Date(Date.UTC(annee + 1, 0, 1)),
    };
    const lignes = await this.prisma.ligneSuivi.findMany({
      where: {
        beneficiaireId: beneficiaire.id,
        dateActe: bornes,
        ...(factureId === undefined ? {} : { factureGlobaleId: factureId }),
        factureGlobale: { statut: { not: StatutFacture.SUPPRIMEE } },
      },
      include: {
        factureGlobale: {
          select: {
            refSociale: true,
            prestataire: { select: { nom: true } },
            statut: true,
          },
        },
        acte: { include: { categorieActe: true } },
      },
      orderBy: { id: 'asc' },
    });
    const contextes: ContexteLigne[] = [];
    for (const ligne of lignes) {
      const plafonds = await this.resoudrePlafonds(
        ligne.acteId,
        ligne.acte.categorieActeId,
        ligne.dateActe,
      );
      if (plafonds.annuel === null) continue;
      contextes.push({
        id: ligne.id,
        factureGlobaleId: ligne.factureGlobaleId,
        beneficiaireId: ligne.beneficiaireId,
        acteId: ligne.acteId,
        dateActe: ligne.dateActe,
        libelle: ligne.libelle,
        montantActe: ligne.montantActe,
        refSociale: ligne.factureGlobale.refSociale,
        prestataire: ligne.factureGlobale.prestataire.nom,
        acteCode: ligne.acte.code,
        acteNom: ligne.acte.nomActe,
        cible: plafonds.cible,
        plafondAnnuel: plafonds.annuel,
        plafondParActe: plafonds.parActe,
      });
    }
    const dateReference = this.dateReferencePlafonds(annee);
    const plafondsReference = await this.resoudrePlafonds(
      acteDemande.id,
      acteDemande.categorieActeId,
      dateReference,
    );
    if (plafondsReference.annuel === null) {
      throw new UnprocessableEntityException(
        'Aucun suivi n’est disponible pour cette cible : aucun plafond annuel n’est en vigueur pour l’année demandée.',
      );
    }
    const cibleActe = plafondsReference.cible;
    const feuille = contextes.filter((ligne) => ligne.cible === cibleActe);
    const calculees = this.calcul.calculer(feuille);
    const verrous = await Promise.all(
      feuille.map((ligne) =>
        this.estVerrouillee(
          ligne.factureGlobaleId,
          ligne.beneficiaireId,
          ligne.acteId,
          ligne.dateActe,
        ),
      ),
    );
    const versionsAnnuelles = await this.prisma.plafond.findMany({
      where: {
        ...(cibleActe.startsWith('acte:')
          ? { acteID: acteDemande.id, categorieActeID: null }
          : { acteID: null, categorieActeID: acteDemande.categorieActeId }),
        porteePlafond: PorteePlafond.PAR_AN,
        dateEffet: { lte: dateReference },
        OR: [
          { dateFin: null },
          { dateFin: { gte: new Date(Date.UTC(annee, 0, 1)) } },
        ],
      },
      select: { id: true },
    });
    const personne = beneficiaire.personne;
    const famille = personne.familleAgent;
    const agent = personne.agent ?? famille?.agent ?? null;
    const codeFam: FeuilleSuivi['entete']['codeFam'] =
      personne.agent !== null
        ? 'Agent'
        : famille?.conjoint !== null && famille?.conjoint !== undefined
          ? 'Conjoint'
          : famille?.enfant !== null && famille?.enfant !== undefined
            ? 'Enfant'
            : null;
    const nomPrenomAgent =
      agent?.personne === undefined || agent.personne === null
        ? null
        : `${agent.personne.nom} ${agent.personne.prenom}`;
    const serviceAgence =
      agent?.service?.nom ??
      agent?.structureOrganisationnelle?.agence?.nomAgence ??
      null;
    const direction =
      agent?.structureOrganisationnelle?.direction?.nom ??
      agent?.service?.direction?.nom ??
      null;
    const entete = {
      idp,
      im: agent?.matricule ?? null,
      nomPrenomBeneficiaire: `${personne.nom} ${personne.prenom}`,
      nomPrenomAgent,
      codeFam,
      direction,
      serviceAgence,
      observationIdp: beneficiaire.observationIDP,
    };
    let historique: VersionPlafond[] | undefined;
    if (inclureHistorique) {
      const cibleHistorique: CiblePlafond = cibleActe.startsWith('acte:')
        ? {
            type: 'ACTE',
            id: acteDemande.id,
            categorieActeId: acteDemande.categorieActeId,
          }
        : { type: 'CATEGORIE', id: acteDemande.categorieActeId };
      const resolutionHistorique = (
        await this.plafondResolution.resoudre(
          [cibleHistorique],
          dateReference,
          true,
        )
      ).get(this.plafondResolution.cleCible(cibleHistorique));
      if (resolutionHistorique?.historique === undefined) {
        throw new Error(
          `L’historique des plafonds de ${cibleActe} n’a pas été résolu.`,
        );
      }
      historique = resolutionHistorique.historique;
    }
    return this.formaterFeuille(
      entete,
      acteDemande,
      acteDemande.categorieActe.nomCategorie,
      feuille,
      calculees,
      verrous,
      annee,
      cibleActe,
      plafondsReference,
      versionsAnnuelles.length > 1,
      historique,
    );
  }

  private async resoudrePlafonds(
    acteId: number,
    categorieId: number,
    date: Date,
  ): Promise<{ annuel: PlafondLu | null; parActe?: PlafondLu; cible: string }> {
    const acteAnnuel = await this.plafond(
      acteId,
      null,
      PorteePlafond.PAR_AN,
      date,
    );
    const annuel =
      acteAnnuel ??
      (await this.plafond(null, categorieId, PorteePlafond.PAR_AN, date));
    const cible =
      acteAnnuel === null ? `categorie:${categorieId}` : `acte:${acteId}`;
    const parActe =
      (await this.plafond(acteId, null, PorteePlafond.PAR_ACTE, date)) ??
      (await this.plafond(null, categorieId, PorteePlafond.PAR_ACTE, date));
    return { annuel, parActe: parActe ?? undefined, cible };
  }

  private async plafond(
    acteId: number | null,
    categorieActeID: number | null,
    porteePlafond: PorteePlafond,
    date: Date,
  ): Promise<PlafondLu | null> {
    const plafond = await this.prisma.plafond.findFirst({
      where: {
        acteID: acteId,
        categorieActeID,
        porteePlafond,
        dateEffet: { lte: date },
        OR: [{ dateFin: null }, { dateFin: { gte: date } }],
      },
      orderBy: { dateEffet: 'desc' },
    });
    if (plafond === null) return null;
    const valeur =
      plafond.unite === UnitePlafond.MONTANT
        ? plafond.montant
        : plafond.nbSeances;
    if (valeur === null)
      throw new UnprocessableEntityException(
        'La valeur du plafond en vigueur est absente.',
      );
    return {
      unite: plafond.unite,
      valeur: new Prisma.Decimal(String(valeur)),
      dateEffet: plafond.dateEffet,
    };
  }

  private formaterFeuille(
    entete: FeuilleSuivi['entete'],
    acte: { id: number; nomActe: string; categorieActeId: number },
    nomCategorie: string,
    lignes: readonly ContexteLigne[],
    calculees: readonly LigneSuiviCalculee[],
    verrous: readonly boolean[],
    annee: number,
    cible: string,
    plafondsReference: {
      annuel: PlafondLu | null;
      parActe?: PlafondLu;
      cible: string;
    },
    modifieEnCoursDAnnee: boolean,
    historique?: VersionPlafond[],
  ): FeuilleSuivi {
    const annuel = plafondsReference.annuel;
    if (annuel === null) {
      throw new UnprocessableEntityException(
        'Aucun suivi n’est disponible pour cette cible : aucun plafond annuel n’est en vigueur pour l’année demandée.',
      );
    }
    const modele = determinerModeleSuivi(annuel, plafondsReference.parActe);
    if (modele === null) {
      throw new Error(
        'Le modèle de suivi ne peut être résolu sans plafond annuel.',
      );
    }
    const resultat = calculees.map((calculee, index) => {
      const ligne = lignes[index];
      const depassementActe =
        modele === 'PLAFOND_ACTE_ET_ANNUEL'
          ? (calculee.depassementActe?.toFixed(2) ?? null)
          : null;
      const depassementPlafond =
        modele === 'PLAFOND_ACTE_ET_ANNUEL'
          ? (calculee.depassementPlafond?.toFixed(2) ?? null)
          : null;
      return {
        id: calculee.id,
        refSociale: ligne.refSociale,
        dateActe: calculee.dateActe.toISOString().slice(0, 10),
        libelle: ligne.libelle,
        acte: { code: ligne.acteCode, nom: ligne.acteNom },
        montantActe: calculee.montantActe.toFixed(2),
        depassementActe,
        cumulActeConsomme:
          modele === 'SEANCES'
            ? null
            : (calculee.cumulActeConsomme?.toFixed(2) ?? null),
        soldePlafond:
          modele === 'SEANCES'
            ? null
            : (calculee.soldePlafond?.toFixed(2) ?? null),
        depassementPlafond,
        totalDepassement: calculee.totalDepassement.toFixed(2),
        nomEtablissement: ligne.prestataire,
        libelleSeance:
          modele === 'SEANCES' && calculee.numeroSeance !== undefined
            ? this.formaterNumeroSeance(calculee.numeroSeance)
            : null,
        numeroSeance: calculee.numeroSeance ?? null,
        plafondAnnuelApplique: ligne.plafondAnnuel.valeur.toFixed(2),
        capaciteRestante:
          modele === 'SEANCES'
            ? null
            : (calculee.capaciteRestante?.toFixed(2) ?? null),
        seancesRestantes: calculee.seancesRestantes?.toFixed(0) ?? null,
        verrouillee: verrous[index],
      };
    });
    const montantActe = lignes.reduce(
      (total, ligne) => total.plus(ligne.montantActe),
      new Prisma.Decimal(0),
    );
    const totalDepassement = calculees.reduce(
      (total, ligne) => total.plus(ligne.totalDepassement),
      new Prisma.Decimal(0),
    );
    const totaux: FeuilleSuivi['totaux'] = {
      montantActe: montantActe.toFixed(2),
      totalDepassement: totalDepassement.toFixed(2),
    };
    if (modele !== 'SEANCES') {
      totaux.cumulActeConsomme =
        calculees.at(-1)?.cumulActeConsomme?.toFixed(2) ?? null;
      totaux.soldePlafond = calculees.at(-1)?.soldePlafond?.toFixed(2) ?? null;
    }
    if (modele === 'PLAFOND_ACTE_ET_ANNUEL') {
      totaux.depassementActe = calculees
        .reduce(
          (total, ligne) =>
            total.plus(ligne.depassementActe ?? new Prisma.Decimal(0)),
          new Prisma.Decimal(0),
        )
        .toFixed(2);
      totaux.depassementPlafond = calculees
        .reduce(
          (total, ligne) =>
            total.plus(ligne.depassementPlafond ?? new Prisma.Decimal(0)),
          new Prisma.Decimal(0),
        )
        .toFixed(2);
    }
    if (modele === 'SEANCES') {
      totaux.seancesUtilisees = calculees.at(-1)?.numeroSeance ?? 0;
    }
    const categorie = cible.startsWith('categorie:');
    return {
      entete,
      modele,
      colonnes: COLONNES_PAR_MODELE[modele],
      cible: {
        type: categorie ? 'categorie' : 'acte',
        id: Number(cible.split(':')[1]),
        nom: categorie ? nomCategorie : acte.nomActe,
      },
      annee,
      plafonds: {
        parActe:
          plafondsReference.parActe === undefined
            ? null
            : {
                unite: plafondsReference.parActe.unite,
                valeur: plafondsReference.parActe.valeur.toFixed(2),
                ...(historique === undefined
                  ? {}
                  : {
                      dateEffet: plafondsReference.parActe.dateEffet
                        .toISOString()
                        .slice(0, 10),
                    }),
              },
        parAn: {
          unite: annuel.unite,
          valeur: annuel.valeur.toFixed(2),
          ...(historique === undefined
            ? {}
            : { dateEffet: annuel.dateEffet.toISOString().slice(0, 10) }),
          modifieEnCoursDAnnee,
        },
        ...(historique === undefined ? {} : { historique }),
      },
      lignes: resultat,
      totaux,
    };
  }

  private dateReferencePlafonds(annee: number): Date {
    const dateLocale = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Indian/Antananarivo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
    const [anneeLocale, moisLocal, jourLocal] = dateLocale
      .split('-')
      .map(Number);
    return annee === anneeLocale
      ? new Date(Date.UTC(anneeLocale, moisLocal - 1, jourLocal))
      : new Date(Date.UTC(annee, 11, 31));
  }

  private formaterNumeroSeance(numero: number): string {
    return `${numero}${numero === 1 ? 'ère' : 'ème'} séance`;
  }

  private verifierEcritureFacture(statut: StatutFacture): void {
    if (STATUTS_ECRITURE_INTERDITE.includes(statut))
      throw new ConflictException(
        'Cette facture ne permet plus la saisie d’un suivi T5_x.',
      );
  }

  private async verifierVerrou(
    factureGlobaleId: number,
    beneficiaireId: number,
    acteId: number,
    dateActe: Date,
    ligneId: number,
  ): Promise<void> {
    if (
      await this.estVerrouillee(
        factureGlobaleId,
        beneficiaireId,
        acteId,
        dateActe,
        ligneId,
      )
    )
      throw new ConflictException('La ligne figure déjà dans le T6.');
  }

  private async estVerrouillee(
    factureGlobaleId: number,
    beneficiaireId: number,
    acteId: number,
    dateActe: Date,
    ligneId?: number,
  ): Promise<boolean> {
    return (
      (await this.prisma.factureIndividuelle.findFirst({
        where: {
          factureGlobaleId,
          beneficiaireId,
          acteId,
          dateActe,
          ...(ligneId === undefined
            ? {}
            : { factureGlobaleId: factureGlobaleId }),
        },
        select: { id: true },
      })) !== null
    );
  }

  private convertirDate(dateIso: string): Date {
    const date = new Date(`${dateIso}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime()))
      throw new BadRequestException('La date de l’acte est invalide.');
    return date;
  }

  private verifierDatePasDansLeFutur(date: Date): void {
    const maintenant = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Indian/Antananarivo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
    if (date.toISOString().slice(0, 10) > maintenant)
      throw new BadRequestException(
        'La date de l’acte ne peut pas être dans le futur.',
      );
  }
}
