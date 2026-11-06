import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '../../../../generated/prisma/client.js';
import {
  AgentType,
  AgentConcerne,
  RegimeActe,
  StatutFacture,
  TypeRegle,
  TypeMouvement,
} from '../../../../generated/prisma/enums.js';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service.js';
import { RegleService } from '../../../../regles-prise-en-charge/regle.service.js';
import {
  FactureCalculService,
  type CalculLigneFacture,
} from '../../shared/facture-calcul.service.js';
import { FacturePermissionsService } from '../../shared/facture-permissions.service.js';
import { MouvementFactureService } from '../../shared/mouvement-facture.service.js';
import { SuiviService } from '../../suivi/suivi.service.js';
import { ActionFacture } from '../../shared/action-facture.js';
import { FactureWorkflowService } from '../workflow/facture-workflow.service.js';
import type { ActeurFacture } from '../globale/facture-globale.service.js';
import type { DbClient } from '../../../../infrastructure/prisma/db-client.type.js';
import type {
  AffecterRetenueDto,
  CreerFactureIndividuelleDto,
  ModifierFactureIndividuelleDto,
  PropositionDepassementDto,
} from '../../dtos/facture-individuelle.dto.js';

export interface LigneFactureCalculee {
  id: number;
  numLigne: number;
  libelle: string;
  dateActe: string;
  idp: string;
  acte: { id: number; code: string; nom: string };
  montantActe: string;
  montantDepassementActe: string;
  montantDepassementPlafond: string;
  observationDepassement: string | null;
  tauxCem: string;
  montantCemIntegral: string;
  montantCem: string;
  montantAgent: string;
  montantDepassement: string;
  totalChargeAgent: string;
  numPec: number | null;
  refPaie: string | null;
  moisAffectation: string | null;
  avertissements: string[];
}

export interface ControleTotaux {
  nombreLignes: number;
  concordant: boolean;
  sommes: {
    montantActe: string;
    montantCemIntegral: string;
    depassement: string;
  };
  facture: {
    montantTotal: string;
    total100Cem: string;
    totalDepassement: string;
  };
  ecarts: {
    montantActe: string;
    montantCemIntegral: string;
    depassement: string;
  };
}

export interface TotauxLignesFacture {
  montantActe: string;
  montantCemIntegral: string;
  montantCem: string;
  montantAgent: string;
  montantDepassement: string;
  totalChargeAgent: string;
}

@Injectable()
export class FactureIndividuelleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly regles: RegleService,
    private readonly calcul: FactureCalculService,
    private readonly permissions: FacturePermissionsService,
    private readonly mouvements: MouvementFactureService,
    private readonly suivi: SuiviService,
    private readonly workflow: FactureWorkflowService,
  ) {}

  async creer(
    idFacture: number,
    acteur: ActeurFacture,
    donnees: CreerFactureIndividuelleDto,
  ): Promise<LigneFactureCalculee> {
    this.permissions.verifier(ActionFacture.SUIVI_CREER, acteur.role);
    return this.avecRetryNumLigne(() =>
      this.prisma.$transaction((tx) =>
        this.creerDansTransaction(tx, idFacture, acteur, donnees),
      ),
    );
  }

  async modifier(
    idFacture: number,
    ligneId: number,
    acteur: ActeurFacture,
    donnees: ModifierFactureIndividuelleDto,
  ): Promise<LigneFactureCalculee> {
    this.permissions.verifier(ActionFacture.SUIVI_MODIFIER, acteur.role);
    return this.prisma.$transaction(async (tx) => {
      const ligne = await tx.factureIndividuelle.findFirst({
        where: { id: ligneId, factureGlobaleId: idFacture },
        include: { factureGlobale: true },
      });
      if (ligne === null)
        throw new NotFoundException(
          `La ligne ${ligneId} est introuvable dans la facture ${idFacture}.`,
        );
      this.workflow.verifierEditionLigne(ligne.factureGlobale.statut);
      if (Object.keys(donnees).length === 0)
        throw new BadRequestException(
          'Au moins un champ doit être fourni pour modifier la ligne.',
        );
      const beneficiaire =
        donnees.idp === undefined
          ? await tx.beneficiaire.findUnique({
              where: { id: ligne.beneficiaireId },
              select: { idp: true },
            })
          : null;
      if (donnees.idp === undefined && beneficiaire === null) {
        throw new NotFoundException(
          `Le bénéficiaire ${ligne.beneficiaireId} est introuvable.`,
        );
      }
      const idp = donnees.idp ?? beneficiaire?.idp;
      if (idp === undefined) {
        throw new NotFoundException(
          `Le bénéficiaire ${ligne.beneficiaireId} est introuvable.`,
        );
      }
      const acteId = donnees.acteId ?? ligne.acteId;
      const dateActe =
        donnees.dateActe ?? ligne.dateActe.toISOString().slice(0, 10);
      const contexte = await this.resoudreContexte(
        tx,
        idFacture,
        idp,
        acteId,
        dateActe,
      );
      const montantActe = donnees.montantActe ?? ligne.montantActe;
      const depActe =
        donnees.montantDepassementActe ?? ligne.montantDepassementActe;
      const depPlafond =
        donnees.montantDepassementPlafond ?? ligne.montantDepassementPlafond;
      const calcule = this.calcul.calculerLigne(
        montantActe,
        depActe,
        depPlafond,
        contexte.regle,
        donnees.montantCemIntegral ?? ligne.montantCemIntegral,
      );
      if (ligne.factureGlobale.statut === StatutFacture.A_CORRIGER)
        await this.enregistrerModificationFactureEnCorrection(
          tx,
          idFacture,
          acteur,
          `Modification de la ligne ${ligne.numLigne}.`,
        );
      const updated = await tx.factureIndividuelle.update({
        where: { id: ligneId },
        data: {
          libelle: donnees.libelle,
          dateActe: convertirDate(dateActe),
          acteId,
          beneficiaireId: contexte.beneficiaireId,
          montantActe: calcule.montantActe,
          montantDepassementActe: calcule.montantDepassementActe,
          montantDepassementPlafond: calcule.montantDepassementPlafond,
          observationDepassement: donnees.observationDepassement,
          tauxCem: calcule.tauxCem,
          montantCemIntegral: calcule.montantCemIntegral,
          priseEnChargeId: donnees.numPec,
        },
      });
      return this.formaterLigne(tx, updated.id, calcule, contexte);
    });
  }

  async supprimer(
    idFacture: number,
    ligneId: number,
    acteur: ActeurFacture,
  ): Promise<void> {
    this.permissions.verifier(ActionFacture.SUIVI_SUPPRIMER, acteur.role);
    await this.prisma.$transaction(async (tx) => {
      const ligne = await tx.factureIndividuelle.findFirst({
        where: { id: ligneId, factureGlobaleId: idFacture },
        include: { factureGlobale: true },
      });
      if (ligne === null)
        throw new NotFoundException(
          `La ligne ${ligneId} est introuvable dans la facture ${idFacture}.`,
        );
      this.workflow.verifierEditionLigne(ligne.factureGlobale.statut);
      if (ligne.factureGlobale.statut === StatutFacture.A_CORRIGER) {
        await this.enregistrerModificationFactureEnCorrection(
          tx,
          idFacture,
          acteur,
          `Suppression de la ligne ${ligne.numLigne}.`,
        );
      }
      await tx.factureIndividuelle.delete({ where: { id: ligneId } });
    });
  }

  async lister(
    idFacture: number,
  ): Promise<{ lignes: LigneFactureCalculee[]; totaux: TotauxLignesFacture }> {
    await this.obtenirFacture(idFacture);
    const lignes = await this.prisma.factureIndividuelle.findMany({
      where: { factureGlobaleId: idFacture },
      include: { beneficiaire: true, acte: true },
      orderBy: { numLigne: 'asc' },
    });
    const resultat = await Promise.all(
      lignes.map(async (ligne) => {
        const contexte = await this.resoudreContexteLecture(
          idFacture,
          ligne.beneficiaireId,
          ligne.acteId,
          ligne.dateActe,
        );
        const calcule: CalculLigneFacture = {
          montantActe: ligne.montantActe,
          montantDepassementActe: ligne.montantDepassementActe,
          montantDepassementPlafond: ligne.montantDepassementPlafond,
          tauxCem: ligne.tauxCem,
          montantCemIntegral: ligne.montantCemIntegral,
        };
        return this.formaterLigne(this.prisma, ligne.id, calcule, contexte);
      }),
    );
    const totaux = resultat.reduce<TotauxLignesFacture>(
      (somme, ligne) => ({
        montantActe: new Prisma.Decimal(somme.montantActe)
          .plus(ligne.montantActe)
          .toFixed(2),
        montantCemIntegral: new Prisma.Decimal(somme.montantCemIntegral)
          .plus(ligne.montantCemIntegral)
          .toFixed(2),
        montantCem: new Prisma.Decimal(somme.montantCem)
          .plus(ligne.montantCem)
          .toFixed(2),
        montantAgent: new Prisma.Decimal(somme.montantAgent)
          .plus(ligne.montantAgent)
          .toFixed(2),
        montantDepassement: new Prisma.Decimal(somme.montantDepassement)
          .plus(ligne.montantDepassement)
          .toFixed(2),
        totalChargeAgent: new Prisma.Decimal(somme.totalChargeAgent)
          .plus(ligne.totalChargeAgent)
          .toFixed(2),
      }),
      {
        montantActe: '0.00',
        montantCemIntegral: '0.00',
        montantCem: '0.00',
        montantAgent: '0.00',
        montantDepassement: '0.00',
        totalChargeAgent: '0.00',
      },
    );
    return { lignes: resultat, totaux };
  }

  async proposer(
    idFacture: number,
    donnees: PropositionDepassementDto,
  ): Promise<{
    montantDepassementActe: string;
    montantDepassementPlafond: string;
  } | null> {
    await this.obtenirFacture(idFacture);
    const ligne = await this.prisma.ligneSuivi.findFirst({
      where: {
        factureGlobaleId: idFacture,
        acteId: donnees.acteId,
        dateActe: convertirDate(donnees.dateActe),
        beneficiaire: { idp: donnees.idp },
      },
      select: { id: true },
    });
    if (ligne === null) return null;
    const feuille = await this.suivi.lire(
      donnees.idp,
      donnees.acteId,
      Number(donnees.dateActe.slice(0, 4)),
      idFacture,
    );
    const resultat = feuille.lignes.find((element) => element.id === ligne.id);
    return resultat === undefined
      ? null
      : {
          montantDepassementActe: resultat.depassementActe ?? '0.00',
          montantDepassementPlafond: resultat.depassementPlafond ?? '0.00',
        };
  }

  async affecterRetenue(
    idFacture: number,
    acteur: ActeurFacture,
    donnees: AffecterRetenueDto,
  ): Promise<{
    ligneIds: number[];
    refPaie: string;
    moisAffectation?: string;
  }> {
    this.permissions.verifier(ActionFacture.SUIVI_MODIFIER, acteur.role);
    if (donnees.ligneIds.length === 0)
      throw new BadRequestException(
        'Au moins une ligne doit être sélectionnée.',
      );
    if (new Set(donnees.ligneIds).size !== donnees.ligneIds.length)
      throw new BadRequestException(
        'La liste des lignes ne peut pas contenir de doublons.',
      );
    const mois =
      donnees.moisAffectation === undefined
        ? undefined
        : convertirMois(donnees.moisAffectation);
    await this.prisma.$transaction(async (tx) => {
      const facture = await tx.factureGlobale.findUnique({
        where: { id: idFacture },
        select: { statut: true },
      });
      if (facture === null)
        throw new NotFoundException(`La facture ${idFacture} est introuvable.`);
      this.workflow.verifierModificationRetenue(facture.statut);
      const lignes = await tx.factureIndividuelle.count({
        where: { id: { in: donnees.ligneIds }, factureGlobaleId: idFacture },
      });
      if (lignes !== donnees.ligneIds.length)
        throw new NotFoundException(
          'Une ou plusieurs lignes ne sont pas rattachées à cette facture.',
        );
      await tx.factureIndividuelle.updateMany({
        where: { id: { in: donnees.ligneIds }, factureGlobaleId: idFacture },
        data: {
          refPaie: donnees.refPaie,
          ...(mois === undefined ? {} : { moisAffectation: mois }),
        },
      });
    });
    return {
      ligneIds: donnees.ligneIds,
      refPaie: donnees.refPaie,
      ...(mois === undefined
        ? {}
        : { moisAffectation: mois.toISOString().slice(0, 10) }),
    };
  }

  async controleTotaux(
    idFacture: number,
    tx?: DbClient,
  ): Promise<ControleTotaux> {
    const client = tx ?? this.prisma;
    const facture = await client.factureGlobale.findUnique({
      where: { id: idFacture },
      select: { montantTotal: true, total100Cem: true, totalDepassement: true },
    });
    if (facture === null)
      throw new NotFoundException(`La facture ${idFacture} est introuvable.`);
    const lignes = await client.factureIndividuelle.findMany({
      where: { factureGlobaleId: idFacture },
      select: {
        montantActe: true,
        montantCemIntegral: true,
        montantDepassementActe: true,
        montantDepassementPlafond: true,
      },
    });
    const sommes = {
      montantActe: lignes.reduce(
        (s, l) => s.plus(l.montantActe),
        new Prisma.Decimal(0),
      ),
      montantCemIntegral: lignes.reduce(
        (s, l) => s.plus(l.montantCemIntegral),
        new Prisma.Decimal(0),
      ),
      depassement: lignes.reduce(
        (s, l) =>
          s.plus(l.montantDepassementActe).plus(l.montantDepassementPlafond),
        new Prisma.Decimal(0),
      ),
    };
    const ecarts = {
      montantActe: sommes.montantActe.minus(facture.montantTotal),
      montantCemIntegral: sommes.montantCemIntegral.minus(facture.total100Cem),
      depassement: sommes.depassement.minus(facture.totalDepassement),
    };
    return {
      nombreLignes: lignes.length,
      concordant:
        lignes.length > 0 && Object.values(ecarts).every((e) => e.isZero()),
      sommes: {
        montantActe: sommes.montantActe.toFixed(2),
        montantCemIntegral: sommes.montantCemIntegral.toFixed(2),
        depassement: sommes.depassement.toFixed(2),
      },
      facture: {
        montantTotal: facture.montantTotal.toFixed(2),
        total100Cem: facture.total100Cem.toFixed(2),
        totalDepassement: facture.totalDepassement.toFixed(2),
      },
      ecarts: {
        montantActe: ecarts.montantActe.toFixed(2),
        montantCemIntegral: ecarts.montantCemIntegral.toFixed(2),
        depassement: ecarts.depassement.toFixed(2),
      },
    };
  }

  async verifierAvantValidation(
    tx: Prisma.TransactionClient,
    idFacture: number,
  ): Promise<void> {
    const controle = await this.controleTotaux(idFacture, tx);
    if (!controle.concordant) {
      throw new ConflictException(
        `La validation est refusée car les totaux de la facture ne concordent pas${controle.nombreLignes === 0 ? ' et la facture ne contient aucune ligne' : ''}. Écarts : montantActe=${controle.ecarts.montantActe}, montantCemIntegral=${controle.ecarts.montantCemIntegral}, dépassement=${controle.ecarts.depassement}.`,
      );
    }
  }

  private async creerDansTransaction(
    tx: Prisma.TransactionClient,
    idFacture: number,
    acteur: ActeurFacture,
    donnees: CreerFactureIndividuelleDto,
  ): Promise<LigneFactureCalculee> {
    const contexte = await this.resoudreContexte(
      tx,
      idFacture,
      donnees.idp,
      donnees.acteId,
      donnees.dateActe,
    );
    const max = await tx.factureIndividuelle.findFirst({
      where: { factureGlobaleId: idFacture },
      orderBy: { numLigne: 'desc' },
      select: { numLigne: true },
    });
    const numLigne = (max?.numLigne ?? 0) + 1;
    const calcule = this.calcul.calculerLigne(
      donnees.montantActe,
      donnees.montantDepassementActe ?? 0,
      donnees.montantDepassementPlafond ?? 0,
      contexte.regle,
      donnees.montantCemIntegral,
    );
    const createdAt = new Date();
    const moisAffectation = new Date(
      Date.UTC(createdAt.getUTCFullYear(), createdAt.getUTCMonth(), 1),
    );
    const ligne = await tx.factureIndividuelle.create({
      data: {
        factureGlobaleId: idFacture,
        numLigne,
        libelle: donnees.libelle,
        dateActe: convertirDate(donnees.dateActe),
        acteId: donnees.acteId,
        beneficiaireId: contexte.beneficiaireId,
        montantActe: calcule.montantActe,
        montantDepassementActe: calcule.montantDepassementActe,
        montantDepassementPlafond: calcule.montantDepassementPlafond,
        observationDepassement: donnees.observationDepassement,
        tauxCem: calcule.tauxCem,
        montantCemIntegral: calcule.montantCemIntegral,
        createdAt,
        moisAffectation,
        priseEnChargeId: donnees.numPec ?? null,
      },
    });
    if (contexte.statut === StatutFacture.A_CORRIGER)
      await this.enregistrerModificationFactureEnCorrection(
        tx,
        idFacture,
        acteur,
        `Création de la ligne ${numLigne}.`,
      );
    return this.formaterLigne(tx, ligne.id, calcule, contexte);
  }

  private async avecRetryNumLigne<T>(operation: () => Promise<T>): Promise<T> {
    for (let tentative = 0; tentative < 3; tentative += 1) {
      try {
        return await operation();
      } catch (error: unknown) {
        if (!estConflitNumLigne(error) || tentative === 2) throw error;
      }
    }
    throw new ConflictException(
      'La numérotation des lignes n’a pas pu être attribuée.',
    );
  }

  private async resoudreContexte(
    tx: DbClient,
    idFacture: number,
    idp: string,
    acteId: number,
    dateIso: string,
  ): Promise<{
    factureId: number;
    statut: StatutFacture;
    beneficiaireId: number;
    acte: { id: number; code: string; nomActe: string; regime: RegimeActe };
    regle: { type: TypeRegle; tauxCem: Prisma.Decimal };
    avertissements: string[];
  }> {
    const facture = await tx.factureGlobale.findUnique({
      where: { id: idFacture },
      select: {
        id: true,
        statut: true,
        moisPrestation: true,
        dateReception: true,
      },
    });
    if (facture === null)
      throw new NotFoundException(`La facture ${idFacture} est introuvable.`);
    this.workflow.verifierEditionLigne(facture.statut);
    const dateActe = convertirDate(dateIso);
    const beneficiaire = await tx.beneficiaire.findUnique({
      where: { idp },
      include: {
        personne: {
          include: { agent: true, familleAgent: { include: { agent: true } } },
        },
      },
    });
    if (beneficiaire === null)
      throw new NotFoundException(`Le bénéficiaire ${idp} est introuvable.`);
    const acte = await tx.acte.findUnique({ where: { id: acteId } });
    if (acte === null)
      throw new NotFoundException(`L’acte ${acteId} est introuvable.`);
    const agent =
      beneficiaire.personne.agent ?? beneficiaire.personne.familleAgent?.agent;
    if (agent === undefined)
      throw new UnprocessableEntityException(
        `Le bénéficiaire ${idp} n’est rattaché à aucun agent.`,
      );
    let regle: Awaited<ReturnType<RegleService['obtenirEnVigueur']>>;
    try {
      regle = await this.regles.obtenirEnVigueur(
        agent.agentType === AgentType.AGENT_ACTIF
          ? AgentConcerne.ACTIF
          : AgentConcerne.NON_ACTIF,
        dateActe,
      );
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw new UnprocessableEntityException(
          `Aucune règle de prise en charge n'est applicable à la date du ${dateIso}.`,
        );
      }
      throw error;
    }
    const avertissements: string[] = [];
    if (acte.regime !== RegimeActe.NORMAL)
      avertissements.push(`L’acte ${acte.code} est au régime ${acte.regime}.`);
    if (
      new Date(
        Date.UTC(
          facture.moisPrestation.getUTCFullYear(),
          facture.moisPrestation.getUTCMonth(),
          1,
        ),
      ).getTime() !==
      new Date(
        Date.UTC(dateActe.getUTCFullYear(), dateActe.getUTCMonth(), 1),
      ).getTime()
    )
      avertissements.push(
        'La date de l’acte est hors du mois de prestation de la facture.',
      );
    if (dateActe > facture.dateReception)
      avertissements.push(
        'La date de l’acte est postérieure à la date de réception de la facture.',
      );
    return {
      factureId: facture.id,
      statut: facture.statut,
      beneficiaireId: beneficiaire.id,
      acte: {
        id: acte.id,
        code: acte.code,
        nomActe: acte.nomActe,
        regime: acte.regime,
      },
      regle: { type: regle.type, tauxCem: regle.tauxCem },
      avertissements,
    };
  }

  private async enregistrerModificationFactureEnCorrection(
    tx: Prisma.TransactionClient,
    idFacture: number,
    acteur: ActeurFacture,
    remarque: string,
  ): Promise<void> {
    const miseAJour = await tx.factureGlobale.updateMany({
      where: { id: idFacture, statut: StatutFacture.A_CORRIGER },
      data: {
        statut: StatutFacture.ENREGISTREE,
        dateValidation: null,
        valideParId: null,
      },
    });
    if (miseAJour.count === 0) {
      throw new ConflictException(
        `La facture n'est plus au statut ${StatutFacture.A_CORRIGER}; elle a été modifiée par une autre action.`,
      );
    }
    await this.mouvements.ecrire(tx, {
      factureGlobaleId: idFacture,
      type: TypeMouvement.MODIFICATION,
      effectueParId: acteur.id,
      remarque,
    });
  }

  private async resoudreContexteLecture(
    idFacture: number,
    beneficiaireId: number,
    acteId: number,
    dateActe: Date,
  ): Promise<{
    acte: { id: number; code: string; nomActe: string; regime: RegimeActe };
    beneficiaireId: number;
    avertissements: string[];
  }> {
    const [facture, beneficiaire, acte] = await Promise.all([
      this.prisma.factureGlobale.findUnique({
        where: { id: idFacture },
        select: { moisPrestation: true, dateReception: true },
      }),
      this.prisma.beneficiaire.findUnique({
        where: { id: beneficiaireId },
        select: { idp: true },
      }),
      this.prisma.acte.findUnique({ where: { id: acteId } }),
    ]);
    if (facture === null)
      throw new NotFoundException(`La facture ${idFacture} est introuvable.`);
    if (beneficiaire === null)
      throw new NotFoundException(
        `Le bénéficiaire ${beneficiaireId} est introuvable.`,
      );
    if (acte === null)
      throw new NotFoundException(`L’acte ${acteId} est introuvable.`);

    const avertissements: string[] = [];
    if (acte.regime !== RegimeActe.NORMAL)
      avertissements.push(`L’acte ${acte.code} est au régime ${acte.regime}.`);
    if (
      facture.moisPrestation.getUTCFullYear() !== dateActe.getUTCFullYear() ||
      facture.moisPrestation.getUTCMonth() !== dateActe.getUTCMonth()
    )
      avertissements.push(
        'La date de l’acte est hors du mois de prestation de la facture.',
      );
    if (dateActe > facture.dateReception)
      avertissements.push(
        'La date de l’acte est postérieure à la date de réception de la facture.',
      );
    return {
      acte: {
        id: acte.id,
        code: acte.code,
        nomActe: acte.nomActe,
        regime: acte.regime,
      },
      beneficiaireId,
      avertissements,
    };
  }

  private async formaterLigne(
    client: DbClient,
    id: number,
    calcule: CalculLigneFacture,
    contexte: {
      acte: { id: number; code: string; nomActe: string };
      beneficiaireId: number;
      avertissements: string[];
    },
  ): Promise<LigneFactureCalculee> {
    const ligne = await client.factureIndividuelle.findUniqueOrThrow({
      where: { id },
      include: { beneficiaire: true },
    });
    const parts = this.calcul.calculerPartsLigne(calcule);
    const avertissements = [...contexte.avertissements];
    if (ligne.priseEnChargeId !== null) {
      const attestation = await client.attestation.findUnique({
        where: { id: ligne.priseEnChargeId },
        select: { id: true },
      });
      if (attestation === null) {
        avertissements.push(
          `L’attestation de prise en charge ${ligne.priseEnChargeId} est introuvable.`,
        );
      } else {
        const autreLigne = await client.factureIndividuelle.findFirst({
          where: {
            priseEnChargeId: ligne.priseEnChargeId,
            id: { not: ligne.id },
          },
          select: { id: true },
        });
        if (autreLigne !== null) {
          avertissements.push(
            `L’attestation de prise en charge ${ligne.priseEnChargeId} est déjà utilisée par une autre ligne.`,
          );
        }
      }
    }
    const suivi = await client.ligneSuivi.findFirst({
      where: {
        factureGlobaleId: ligne.factureGlobaleId,
        beneficiaireId: ligne.beneficiaireId,
        acteId: ligne.acteId,
        dateActe: ligne.dateActe,
      },
      select: { id: true },
    });
    if (suivi !== null) {
      try {
        const feuille = await this.suivi.lire(
          ligne.beneficiaire.idp,
          ligne.acteId,
          ligne.dateActe.getUTCFullYear(),
          ligne.factureGlobaleId,
        );
        const ligneSuivi = feuille.lignes.find(
          ({ id: suiviId }) => suiviId === suivi.id,
        );
        if (
          ligneSuivi !== undefined &&
          (!new Prisma.Decimal(ligneSuivi.depassementActe ?? '0.00').equals(
            ligne.montantDepassementActe,
          ) ||
            !new Prisma.Decimal(ligneSuivi.depassementPlafond ?? '0.00').equals(
              ligne.montantDepassementPlafond,
            ))
        ) {
          avertissements.push(
            'Les dépassements saisis diffèrent de ceux de la LigneSuivi correspondante.',
          );
        }
      } catch (error: unknown) {
        if (
          error instanceof NotFoundException ||
          error instanceof UnprocessableEntityException
        ) {
          avertissements.push(
            'La comparaison des dépassements avec la LigneSuivi correspondante est indisponible.',
          );
        } else {
          throw error;
        }
      }
    }
    return {
      id: ligne.id,
      numLigne: ligne.numLigne,
      libelle: ligne.libelle,
      dateActe: ligne.dateActe.toISOString().slice(0, 10),
      idp: ligne.beneficiaire.idp,
      acte: {
        id: contexte.acte.id,
        code: contexte.acte.code,
        nom: contexte.acte.nomActe,
      },
      montantActe: calcule.montantActe.toFixed(2),
      montantDepassementActe: calcule.montantDepassementActe.toFixed(2),
      montantDepassementPlafond: calcule.montantDepassementPlafond.toFixed(2),
      observationDepassement: ligne.observationDepassement,
      tauxCem: calcule.tauxCem.toFixed(2),
      montantCemIntegral: calcule.montantCemIntegral.toFixed(2),
      montantCem: parts.montantCem.toFixed(2),
      montantAgent: parts.montantAgent.toFixed(2),
      montantDepassement: parts.montantDepassement.toFixed(2),
      totalChargeAgent: parts.totalChargeAgent.toFixed(2),
      numPec: ligne.priseEnChargeId,
      refPaie: ligne.refPaie,
      moisAffectation:
        ligne.moisAffectation?.toISOString().slice(0, 10) ?? null,
      avertissements,
    };
  }

  private async obtenirFacture(idFacture: number): Promise<{ id: number }> {
    const facture = await this.prisma.factureGlobale.findUnique({
      where: { id: idFacture },
      select: { id: true },
    });
    if (facture === null)
      throw new NotFoundException(`La facture ${idFacture} est introuvable.`);
    return facture;
  }
}

function convertirDate(date: string): Date {
  const result = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(result.getTime()))
    throw new BadRequestException('La date de l’acte est invalide.');
  return result;
}
function convertirMois(mois: string): Date {
  return convertirDate(`${mois}-01`);
}
function estConflitNumLigne(error: unknown): boolean {
  if (
    !(error instanceof Prisma.PrismaClientKnownRequestError) ||
    error.code !== 'P2002'
  )
    return false;
  const cible = error.meta?.target;
  if (cible === undefined) return true;
  const cibleTexte = Array.isArray(cible)
    ? cible.join('_')
    : typeof cible === 'string'
      ? cible
      : '';
  return cibleTexte.includes('factureGlobaleId') ||
    cibleTexte.includes('facture_globale_id')
    ? cibleTexte.includes('numLigne') || cibleTexte.includes('num_ligne')
    : false;
}
