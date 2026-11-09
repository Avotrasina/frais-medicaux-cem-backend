import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '../../../../generated/prisma/client.js';
import type {
  FactureGlobale,
  MouvementFacture,
} from '../../../../generated/prisma/client.js';
import {
  RoleUtilisateur,
  StatutFacture,
  TypeMouvement,
} from '../../../../generated/prisma/enums.js';
import { RefSocialService } from '../../shared/ref-social.service.js';
import { RegleService } from '../../../regles-prise-en-charge/regle.service.js';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service.js';
import { CreerFactureGlobaleDto } from '../../dtos/creer-facture-globale.dto.js';
import type {
  EnvoiValidationDto,
  ModifierFactureGlobaleDto,
  ModifierMontantsFactureDto,
  RemarqueObligatoireDto,
  MotifObligatoireDto,
  RemarqueOptionnelleDto,
  SortieFactureDto,
  ValidationFactureDto,
} from '../../dtos/facture-workflow.dto.js';
import { FactureCalculService } from '../../shared/facture-calcul.service.js';
import { FactureIndividuelleService } from '../individuelle/facture-individuelle.service.js';
import { FactureClotureService } from '../../shared/facture-cloture.service.js';
import type { StatutRapprochementFacture } from '../individuelle/facture-individuelle.service.js';
import { MouvementFactureService } from '../../shared/mouvement-facture.service.js';
import type { NouveauMouvementFacture } from '../../shared/mouvement-facture.service.js';
import {
  ActionFacture,
  FactureWorkflowService,
} from '../workflow/facture-workflow.service.js';

const FUSEAU_HORAIRE_ENREGISTREMENT = 'Indian/Antananarivo';

const FORMAT_DATE_ENREGISTREMENT = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'short',
  timeZone: FUSEAU_HORAIRE_ENREGISTREMENT,
});

function obtenirDateEtAnneeEnregistrement(instant: Date): {
  date: Date;
  annee: number;
} {
  const parties = new Intl.DateTimeFormat('en-CA', {
    timeZone: FUSEAU_HORAIRE_ENREGISTREMENT,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant);
  const annee = Number(parties.find((partie) => partie.type === 'year')?.value);
  const mois = Number(parties.find((partie) => partie.type === 'month')?.value);
  const jour = Number(parties.find((partie) => partie.type === 'day')?.value);

  return { date: new Date(Date.UTC(annee, mois - 1, jour)), annee };
}

function convertirDateIso(dateIso: string): Date {
  return new Date(`${dateIso}T00:00:00.000Z`);
}

function dateMetierDuJour(): Date {
  const date = new Intl.DateTimeFormat('en-CA', {
    timeZone: FUSEAU_HORAIRE_ENREGISTREMENT,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  return convertirDateIso(date);
}

function dateJourMetier(date: Date): Date {
  const dateFormatee = new Intl.DateTimeFormat('en-CA', {
    timeZone: FUSEAU_HORAIRE_ENREGISTREMENT,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
  return convertirDateIso(dateFormatee);
}

function premierJourDuMois(dateIso: string): Date {
  return convertirDateIso(`${dateIso.slice(0, 7)}-01`);
}

type FactureCreee = Prisma.FactureGlobaleGetPayload<{
  include: { prestataire: { select: { id: true; nom: true } } };
}>;

export type FactureGlobaleCreee = FactureCreee & {
  avertissements: string[];
};

export type FactureWorkflowLue = Prisma.FactureGlobaleGetPayload<{
  include: { prestataire: { select: { id: true; nom: true } } };
}>;

export type FactureListee = Prisma.FactureGlobaleGetPayload<{
  include: {
    prestataire: { select: { id: true; nom: true } };
    piecesJointes: {
      select: {
        id: true;
        nomFichier: true;
        typeFichier: true;
        tailleOctets: true;
        createdAt: true;
      };
    };
  };
}>;
export type FactureListeeAvecCloture = FactureListee & { cloturee: boolean };

export interface ActeurFacture {
  id: number;
  role: RoleUtilisateur;
}

export interface OptionsActionFacture {
  date?: Date;
  capturerMouvement?: (mouvement: MouvementFacture) => void;
}

interface ChampModifie {
  nom: string;
  ancienneValeur: unknown;
  nouvelleValeur: unknown;
}

@Injectable()
export class FactureGlobaleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly refSocialService: RefSocialService,
    private readonly regleService: RegleService,
    private readonly factureWorkflowService: FactureWorkflowService,
    private readonly mouvementFactureService: MouvementFactureService,
    private readonly factureCalculService: FactureCalculService,
    private readonly factureIndividuelleService: FactureIndividuelleService,
    private readonly cloture: FactureClotureService = new FactureClotureService(),
  ) {}

  async lister(
    statut?: StatutFacture,
    cloturee?: boolean,
    rapprochement?: StatutRapprochementFacture,
  ): Promise<FactureListeeAvecCloture[]> {
    const factures = await this.prisma.factureGlobale.findMany({
      where: {
        ...(statut === undefined
          ? { statut: { not: StatutFacture.SUPPRIMEE } }
          : { statut }),
        ...(cloturee === undefined
          ? {}
          : cloturee
            ? { dateCloture: { not: null } }
            : { dateCloture: null }),
      },
      include: {
        prestataire: { select: { id: true, nom: true } },
        piecesJointes: {
          select: {
            id: true,
            nomFichier: true,
            typeFichier: true,
            tailleOctets: true,
            createdAt: true,
          },
          orderBy: { id: 'asc' },
        },
      },
      orderBy: { id: 'desc' },
    });
    const avecCloture = factures.map((facture) => ({
      ...facture,
      cloturee: facture.dateCloture !== null,
    }));
    if (rapprochement === undefined) return avecCloture;

    const rapprochements = await Promise.all(
      avecCloture.map(async (facture) => ({
        facture,
        statut: (
          await this.factureIndividuelleService.rapprochement(facture.id)
        ).statut,
      })),
    );
    return rapprochements
      .filter((element) => element.statut === rapprochement)
      .map((element) => element.facture);
  }

  async obtenir(
    id: number,
  ): Promise<
    FactureWorkflowLue & { nombrePiecesJointes: number; cloturee: boolean }
  > {
    const facture = await this.prisma.factureGlobale.findUnique({
      where: { id },
      include: {
        prestataire: { select: { id: true, nom: true } },
        _count: { select: { piecesJointes: true } },
      },
    });
    if (facture === null)
      throw new NotFoundException(`La facture ${id} est introuvable.`);
    const { _count, ...donneesFacture } = facture;
    return {
      ...donneesFacture,
      nombrePiecesJointes: _count.piecesJointes,
      cloturee: donneesFacture.dateCloture !== null,
    };
  }

  async historique(
    id: number,
    type?: TypeMouvement,
  ): Promise<
    Prisma.MouvementFactureGetPayload<{
      include: { effectuePar: true; adresseA: true };
    }>[]
  > {
    const facture = await this.prisma.factureGlobale.findUnique({
      where: { id },
      select: { id: true },
    });
    if (facture === null) {
      throw new NotFoundException(`La facture ${id} est introuvable.`);
    }
    return this.prisma.mouvementFacture.findMany({
      where: { factureGlobaleId: id, ...(type === undefined ? {} : { type }) },
      include: { effectuePar: true, adresseA: true },
      orderBy: { id: 'asc' },
    });
  }

  async transitions(id: number) {
    const facture = await this.obtenir(id);
    if (facture.cloturee) return [];
    return this.factureWorkflowService.listerTransitions(
      facture.statut,
      facture.statutAvantSuppression ?? undefined,
    );
  }

  async validerDateAction(id: number, dateSaisie?: string): Promise<Date> {
    const date =
      dateSaisie === undefined
        ? dateMetierDuJour()
        : new Date(`${dateSaisie}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('La date du mouvement est invalide.');
    }
    const facture = await this.prisma.factureGlobale.findUnique({
      where: { id },
      select: { id: true, dateCloture: true },
    });
    if (facture === null) {
      throw new NotFoundException(`La facture ${id} est introuvable.`);
    }
    this.cloture.verifierNonCloturee(facture.dateCloture);
    const enregistrement = await this.prisma.mouvementFacture.findFirst({
      where: {
        factureGlobaleId: id,
        type: TypeMouvement.ENREGISTREMENT,
      },
      orderBy: { id: 'asc' },
      select: { date: true },
    });
    if (enregistrement === null) {
      throw new ConflictException(
        "La date d'enregistrement de la facture est introuvable.",
      );
    }
    if (date.getTime() < dateJourMetier(enregistrement.date).getTime()) {
      throw new BadRequestException(
        "La date du mouvement ne peut pas être antérieure à la date d'enregistrement de la facture.",
      );
    }
    return date;
  }

  async creer(
    donnees: CreerFactureGlobaleDto,
    utilisateurId: number,
  ): Promise<FactureGlobaleCreee> {
    const prestataire = await this.prisma.prestataire.findFirst({
      where: { id: donnees.prestataireId },
      select: { id: true, nom: true },
    });

    if (prestataire === null) {
      throw new NotFoundException(
        `Le prestataire ${donnees.prestataireId} est introuvable.`,
      );
    }

    const { date: dateEnregistrement, annee } =
      obtenirDateEtAnneeEnregistrement(new Date());
    let tauxCem: Prisma.Decimal;

    try {
      tauxCem =
        await this.regleService.obtenirTauxCemRepartition(dateEnregistrement);
    } catch (erreur: unknown) {
      if (erreur instanceof NotFoundException) {
        const dateFormatee =
          FORMAT_DATE_ENREGISTREMENT.format(dateEnregistrement);
        throw new UnprocessableEntityException(
          `Aucune règle de prise en charge n'est configurée pour la date du ${dateFormatee}.`,
        );
      }

      throw erreur;
    }

    return this.prisma.$transaction(async (tx) => {
      const refSociale = await this.refSocialService.genererProchaine(
        tx,
        annee,
      );
      const facture = await tx.factureGlobale.create({
        data: {
          prestataireId: prestataire.id,
          numFacture: donnees.numFacture,
          dateFacture: convertirDateIso(donnees.dateFacture),
          dateReception: convertirDateIso(donnees.dateReception),
          moisPrestation:
            donnees.moisPrestation === undefined
              ? null
              : premierJourDuMois(donnees.moisPrestation),
          ...(donnees.refAgence === undefined
            ? {}
            : { refAgence: donnees.refAgence }),
          montantTotal: null,
          total100Cem: 0,
          totalDepassement: 0,
          tauxCem,
          statut: StatutFacture.ENREGISTREE,
          refSociale,
          annee,
          enregistreParId: utilisateurId,
        },
        include: { prestataire: { select: { id: true, nom: true } } },
      });

      await this.mouvementFactureService.ecrire(tx, {
        factureGlobaleId: facture.id,
        type: TypeMouvement.ENREGISTREMENT,
        effectueParId: utilisateurId,
      });

      const doublons = await tx.factureGlobale.findMany({
        where: {
          id: { not: facture.id },
          prestataireId: prestataire.id,
          numFacture: donnees.numFacture,
          statut: { not: StatutFacture.SUPPRIMEE },
        },
        select: { refSociale: true },
      });

      const avertissements = doublons.map(
        ({ refSociale: refExistante }) =>
          `Une facture portant le même numéro existe déjà sous la référence ${refExistante}.`,
      );

      return { ...facture, avertissements };
    });
  }

  async retourPrestataire(
    id: number,
    acteur: ActeurFacture,
    donnees: RemarqueObligatoireDto,
    options: OptionsActionFacture = {},
  ): Promise<FactureWorkflowLue> {
    return this.effectuerTransition(
      id,
      acteur,
      ActionFacture.RETOUR_PRESTATAIRE,
      { type: TypeMouvement.RETOUR_PRESTATAIRE, remarque: donnees.remarque },
      {},
      options,
    );
  }

  async envoyerValidation(
    id: number,
    acteur: ActeurFacture,
    donnees: EnvoiValidationDto,
    options: OptionsActionFacture = {},
  ): Promise<FactureWorkflowLue> {
    return this.prisma.$transaction(async (tx) => {
      const factureAvantControle = await this.obtenirDansTransaction(tx, id);
      this.cloture.verifierNonCloturee(factureAvantControle.dateCloture);
      this.factureWorkflowService.determinerTransition(
        factureAvantControle.statut,
        ActionFacture.ENVOI_VALIDATION,
        acteur.role,
      );
      await this.factureIndividuelleService.verifierAvantValidation(tx, id);
      const destinataire =
        donnees.destinataireId === undefined
          ? null
          : await tx.utilisateur.findUnique({
              where: { id: donnees.destinataireId },
              select: { id: true, role: true },
            });
      if (donnees.destinataireId !== undefined && destinataire === null) {
        throw new NotFoundException(
          `Le destinataire ${donnees.destinataireId} est introuvable.`,
        );
      }
      if (
        destinataire === null ||
        ![RoleUtilisateur.ADJOINT, RoleUtilisateur.CHEF].some(
          (role) => role === destinataire.role,
        )
      ) {
        throw new UnprocessableEntityException(
          'Le destinataire doit avoir le rôle ADJOINT ou CHEF.',
        );
      }
      return this.effectuerTransitionDansTransaction(
        tx,
        id,
        acteur,
        ActionFacture.ENVOI_VALIDATION,
        {
          type: TypeMouvement.ENVOI_VALIDATION,
          adresseAId: destinataire?.id,
          ...(donnees.remarque === undefined
            ? {}
            : { remarque: donnees.remarque }),
        },
        {},
        undefined,
        options,
      );
    });
  }

  async valider(
    id: number,
    acteur: ActeurFacture,
    donnees: ValidationFactureDto,
    options: OptionsActionFacture = {},
  ): Promise<FactureWorkflowLue> {
    return this.prisma.$transaction(async (tx) => {
      const factureAvantControle = await this.obtenirDansTransaction(tx, id);
      this.factureWorkflowService.determinerTransition(
        factureAvantControle.statut,
        ActionFacture.VALIDATION,
        acteur.role,
      );
      await this.factureIndividuelleService.verifierAvantValidation(tx, id);
      return this.effectuerTransitionDansTransaction(
        tx,
        id,
        acteur,
        ActionFacture.VALIDATION,
        {
          type: TypeMouvement.VALIDATION,
          ...(donnees.remarque === undefined
            ? {}
            : { remarque: donnees.remarque }),
        },
        { dateValidation: new Date(), valideParId: acteur.id },
        undefined,
        options,
      );
    });
  }

  async retournerCorrection(
    id: number,
    acteur: ActeurFacture,
    donnees: RemarqueObligatoireDto,
    options: OptionsActionFacture = {},
  ): Promise<FactureWorkflowLue> {
    return this.prisma.$transaction(async (tx) => {
      const facture = await this.obtenirDansTransaction(tx, id);
      this.cloture.verifierNonCloturee(facture.dateCloture);
      return this.effectuerTransitionDansTransaction(
        tx,
        id,
        acteur,
        ActionFacture.RETOUR_CORRECTION,
        {
          type: TypeMouvement.RETOUR_POUR_CORRECTION,
          remarque: donnees.remarque,
          adresseAId: facture.enregistreParId,
        },
        {},
        undefined,
        options,
      );
    });
  }

  async sortir(
    id: number,
    acteur: ActeurFacture,
    donnees: SortieFactureDto,
    options: OptionsActionFacture = {},
  ): Promise<FactureWorkflowLue> {
    return this.effectuerTransition(
      id,
      acteur,
      ActionFacture.SORTIE,
      {
        type: TypeMouvement.SORTIE,
        service: donnees.service,
      },
      {},
      options,
    );
  }

  async demanderSuppression(
    id: number,
    acteur: ActeurFacture,
    donnees: MotifObligatoireDto,
    options: OptionsActionFacture = {},
  ): Promise<FactureWorkflowLue> {
    return this.prisma.$transaction(async (tx) => {
      const facture = await this.obtenirDansTransaction(tx, id);
      this.cloture.verifierNonCloturee(facture.dateCloture);
      if (
        facture.statut === StatutFacture.SUPPRESSION_DEMANDEE ||
        facture.statut === StatutFacture.SUPPRIMEE
      ) {
        throw new ConflictException(
          'La demande de suppression est interdite pour le statut actuel de la facture.',
        );
      }
      const lignes = await tx.factureIndividuelle.count({
        where: { factureGlobaleId: id },
      });
      if (lignes > 0)
        throw new ConflictException(
          'La suppression est refusée car la facture possède déjà des lignes individuelles.',
        );
      return this.effectuerTransitionDansTransaction(
        tx,
        id,
        acteur,
        ActionFacture.DEMANDE_SUPPRESSION,
        {
          type: TypeMouvement.DEMANDE_SUPPRESSION,
          remarque: donnees.motif,
        },
        { statutAvantSuppression: facture.statut },
        undefined,
        options,
      );
    });
  }

  async validerSuppression(
    id: number,
    acteur: ActeurFacture,
    donnees: RemarqueOptionnelleDto,
    options: OptionsActionFacture = {},
  ): Promise<FactureWorkflowLue> {
    return this.effectuerTransition(
      id,
      acteur,
      ActionFacture.VALIDATION_SUPPRESSION,
      {
        type: TypeMouvement.SUPPRESSION,
        ...(donnees.remarque === undefined
          ? {}
          : { remarque: donnees.remarque }),
      },
      { statutAvantSuppression: null },
      options,
    );
  }

  async refuserSuppression(
    id: number,
    acteur: ActeurFacture,
    donnees: RemarqueOptionnelleDto,
    options: OptionsActionFacture = {},
  ): Promise<FactureWorkflowLue> {
    return this.prisma.$transaction(async (tx) => {
      const facture = await this.obtenirDansTransaction(tx, id);
      this.cloture.verifierNonCloturee(facture.dateCloture);
      if (facture.statutAvantSuppression === null)
        throw new ConflictException(
          'Le statut avant suppression est introuvable.',
        );
      return this.effectuerTransitionDansTransaction(
        tx,
        id,
        acteur,
        ActionFacture.REFUS_SUPPRESSION,
        {
          type: TypeMouvement.REFUS_SUPPRESSION,
          ...(donnees.remarque === undefined
            ? {}
            : { remarque: donnees.remarque }),
        },
        { statutAvantSuppression: null },
        facture.statutAvantSuppression,
        options,
      );
    });
  }

  async modifierInformations(
    id: number,
    acteur: ActeurFacture,
    donnees: ModifierFactureGlobaleDto,
  ): Promise<FactureWorkflowLue> {
    return this.prisma.$transaction(async (tx) => {
      const facture = await this.obtenirDansTransaction(tx, id);
      this.cloture.verifierNonCloturee(facture.dateCloture);
      const statutSuivant = this.factureWorkflowService.determinerTransition(
        facture.statut,
        ActionFacture.MODIFIER_INFORMATIONS,
        acteur.role,
      );
      const data: Prisma.FactureGlobaleUncheckedUpdateManyInput = {};
      const changements: ChampModifie[] = [];

      if (donnees.prestataireId !== undefined) {
        const prestataire = await tx.prestataire.findFirst({
          where: { id: donnees.prestataireId },
          select: { id: true },
        });
        if (prestataire === null) {
          throw new NotFoundException(
            `Le prestataire ${donnees.prestataireId} est introuvable.`,
          );
        }
        this.ajouterChangement(
          changements,
          'prestataireId',
          facture.prestataireId,
          donnees.prestataireId,
        );
        data.prestataireId = donnees.prestataireId;
      }
      if (donnees.numFacture !== undefined) {
        this.ajouterChangement(
          changements,
          'numFacture',
          facture.numFacture,
          donnees.numFacture,
        );
        data.numFacture = donnees.numFacture;
      }
      if (donnees.dateFacture !== undefined) {
        const valeur = convertirDateIso(donnees.dateFacture);
        this.ajouterChangement(
          changements,
          'dateFacture',
          facture.dateFacture,
          valeur,
        );
        data.dateFacture = valeur;
      }
      if (donnees.dateReception !== undefined) {
        const valeur = convertirDateIso(donnees.dateReception);
        this.ajouterChangement(
          changements,
          'dateReception',
          facture.dateReception,
          valeur,
        );
        data.dateReception = valeur;
      }
      if (donnees.moisPrestation !== undefined) {
        const valeur = premierJourDuMois(donnees.moisPrestation);
        this.ajouterChangement(
          changements,
          'moisPrestation',
          facture.moisPrestation,
          valeur,
        );
        data.moisPrestation = valeur;
      }
      if (donnees.refAgence !== undefined) {
        this.ajouterChangement(
          changements,
          'refAgence',
          facture.refAgence,
          donnees.refAgence,
        );
        data.refAgence = donnees.refAgence;
      }
      if (donnees.remarque !== undefined) {
        this.ajouterChangement(
          changements,
          'remarque',
          facture.remarque,
          donnees.remarque,
        );
        data.remarque = donnees.remarque;
      }

      return this.enregistrerModificationDansTransaction(
        tx,
        facture,
        acteur,
        statutSuivant,
        data,
        changements,
        donnees.motif,
      );
    });
  }

  async modifierMontants(
    id: number,
    acteur: ActeurFacture,
    donnees: ModifierMontantsFactureDto,
  ): Promise<
    FactureWorkflowLue & {
      reste: Prisma.Decimal;
      partCem: Prisma.Decimal;
      partAgent: Prisma.Decimal;
      totalChargeAgent: Prisma.Decimal;
    }
  > {
    return this.prisma.$transaction(async (tx) => {
      const facture = await this.obtenirDansTransaction(tx, id);
      this.cloture.verifierNonCloturee(facture.dateCloture);
      const statutSuivant = this.factureWorkflowService.determinerTransition(
        facture.statut,
        ActionFacture.MODIFIER_MONTANTS,
        acteur.role,
      );
      if (
        donnees.montantTotal === undefined &&
        donnees.total100Cem === undefined &&
        donnees.totalDepassement === undefined
      ) {
        throw new BadRequestException(
          'Au moins un montant doit être fourni pour modifier la facture.',
        );
      }

      const montantTotal =
        donnees.montantTotal === undefined
          ? facture.montantTotal
          : new Prisma.Decimal(String(donnees.montantTotal));
      const total100Cem =
        donnees.total100Cem === undefined
          ? facture.total100Cem
          : new Prisma.Decimal(String(donnees.total100Cem));
      const totalDepassement =
        donnees.totalDepassement === undefined
          ? facture.totalDepassement
          : new Prisma.Decimal(String(donnees.totalDepassement));
      if (montantTotal === null) {
        throw new BadRequestException(
          'Le montant total doit être saisi avant les autres montants.',
        );
      }
      this.validerMontants(montantTotal, total100Cem, totalDepassement);

      const data: Prisma.FactureGlobaleUncheckedUpdateManyInput = {};
      const changements: ChampModifie[] = [];
      if (donnees.montantTotal !== undefined) {
        this.ajouterChangement(
          changements,
          'montantTotal',
          facture.montantTotal,
          montantTotal,
        );
        data.montantTotal = montantTotal;
      }
      if (donnees.total100Cem !== undefined) {
        this.ajouterChangement(
          changements,
          'total100Cem',
          facture.total100Cem,
          total100Cem,
        );
        data.total100Cem = total100Cem;
      }
      if (donnees.totalDepassement !== undefined) {
        this.ajouterChangement(
          changements,
          'totalDepassement',
          facture.totalDepassement,
          totalDepassement,
        );
        data.totalDepassement = totalDepassement;
      }

      const factureModifiee = await this.enregistrerModificationDansTransaction(
        tx,
        facture,
        acteur,
        statutSuivant,
        data,
        changements,
        donnees.motif,
      );
      const parts = this.factureCalculService.calculerParts(
        montantTotal,
        factureModifiee.total100Cem,
        factureModifiee.totalDepassement,
        factureModifiee.tauxCem,
      );
      return { ...factureModifiee, ...parts };
    });
  }

  private async effectuerTransition(
    id: number,
    acteur: ActeurFacture,
    action: ActionFacture,
    mouvement: Omit<
      NouveauMouvementFacture,
      'factureGlobaleId' | 'effectueParId'
    >,
    modificationsFacture: Prisma.FactureGlobaleUncheckedUpdateManyInput = {},
    options: OptionsActionFacture = {},
  ): Promise<FactureWorkflowLue> {
    return this.prisma.$transaction((tx) =>
      this.effectuerTransitionDansTransaction(
        tx,
        id,
        acteur,
        action,
        mouvement,
        modificationsFacture,
        undefined,
        options,
      ),
    );
  }

  private async effectuerTransitionDansTransaction(
    tx: Prisma.TransactionClient,
    id: number,
    acteur: ActeurFacture,
    action: ActionFacture,
    mouvement: Omit<
      NouveauMouvementFacture,
      'factureGlobaleId' | 'effectueParId'
    >,
    modificationsFacture: Prisma.FactureGlobaleUncheckedUpdateManyInput = {},
    statutSuivantDynamique?: StatutFacture,
    options: OptionsActionFacture = {},
  ): Promise<FactureWorkflowLue> {
    const facture = await this.obtenirDansTransaction(tx, id);
    this.cloture.verifierNonCloturee(facture.dateCloture);
    const statutCalcule = this.factureWorkflowService.determinerTransition(
      facture.statut,
      action,
      acteur.role,
      statutSuivantDynamique,
    );
    const miseAJour = await tx.factureGlobale.updateMany({
      where: { id, statut: facture.statut, updatedAt: facture.updatedAt },
      data: {
        ...modificationsFacture,
        updatedAt: this.prochaineDateMiseAJour(facture.updatedAt),
        statut: statutCalcule,
      },
    });
    this.verifierEcritureConditionnelle(miseAJour.count, facture.statut);

    const mouvementCree = await this.mouvementFactureService.ecrire(tx, {
      ...mouvement,
      ...(options.date === undefined ? {} : { date: options.date }),
      factureGlobaleId: id,
      effectueParId: acteur.id,
    });
    options.capturerMouvement?.(mouvementCree);
    return this.obtenirApresMiseAJour(tx, id);
  }

  private async enregistrerModificationDansTransaction(
    tx: Prisma.TransactionClient,
    facture: FactureGlobale,
    acteur: ActeurFacture,
    statutSuivant: StatutFacture,
    data: Prisma.FactureGlobaleUncheckedUpdateManyInput,
    changements: ChampModifie[],
    motif?: string,
  ): Promise<FactureWorkflowLue> {
    if (changements.length === 0) {
      throw new BadRequestException(
        'La modification demandée ne change aucune valeur de la facture.',
      );
    }
    this.cloture.verifierNonCloturee(facture.dateCloture);

    data.updatedAt = this.prochaineDateMiseAJour(facture.updatedAt);
    const miseAJour = await tx.factureGlobale.updateMany({
      where: {
        id: facture.id,
        statut: facture.statut,
        updatedAt: facture.updatedAt,
      },
      data: {
        ...data,
        statut: statutSuivant,
        dateValidation: null,
        valideParId: null,
      },
    });
    this.verifierEcritureConditionnelle(miseAJour.count, facture.statut);

    const remarque = [motif?.trim(), ...changements.map(formaterChangement)]
      .filter((element): element is string => element !== undefined)
      .join('\n');
    await this.mouvementFactureService.ecrire(tx, {
      factureGlobaleId: facture.id,
      type: TypeMouvement.MODIFICATION,
      effectueParId: acteur.id,
      remarque,
    });

    return this.obtenirApresMiseAJour(tx, facture.id);
  }

  private async obtenirDansTransaction(
    tx: Prisma.TransactionClient,
    id: number,
  ): Promise<FactureGlobale> {
    const facture = await tx.factureGlobale.findUnique({ where: { id } });
    if (facture === null) {
      throw new NotFoundException(`La facture ${id} est introuvable.`);
    }
    return facture;
  }

  private async obtenirApresMiseAJour(
    tx: Prisma.TransactionClient,
    id: number,
  ): Promise<FactureWorkflowLue> {
    const facture = await tx.factureGlobale.findUnique({
      where: { id },
      include: { prestataire: { select: { id: true, nom: true } } },
    });
    if (facture === null) {
      throw new NotFoundException(`La facture ${id} est introuvable.`);
    }
    return facture;
  }

  private verifierEcritureConditionnelle(
    nombreDeLignes: number,
    statutAttendu: StatutFacture,
  ): void {
    if (nombreDeLignes === 0) {
      throw new ConflictException(
        `La facture n'est plus au statut ${statutAttendu}; elle a été modifiée par une autre action.`,
      );
    }
  }

  private prochaineDateMiseAJour(dateActuelle: Date): Date {
    return new Date(Math.max(Date.now(), dateActuelle.getTime() + 1));
  }

  private validerMontants(
    montantTotal: Prisma.Decimal,
    total100Cem: Prisma.Decimal,
    totalDepassement: Prisma.Decimal,
  ): void {
    if (montantTotal.lte(0) || total100Cem.lt(0) || totalDepassement.lt(0)) {
      throw new BadRequestException(
        'Le montant total doit être supérieur à zéro et les autres montants doivent être positifs ou nuls.',
      );
    }
    if (total100Cem.plus(totalDepassement).gt(montantTotal)) {
      throw new BadRequestException(
        'La somme du montant pris en charge à 100 % CEM et du dépassement ne peut pas dépasser le montant total.',
      );
    }
  }

  private ajouterChangement(
    changements: ChampModifie[],
    nom: string,
    ancienneValeur: unknown,
    nouvelleValeur: unknown,
  ): void {
    if (this.valeursEgales(ancienneValeur, nouvelleValeur)) return;
    changements.push({ nom, ancienneValeur, nouvelleValeur });
  }

  private valeursEgales(gauche: unknown, droite: unknown): boolean {
    if (Prisma.Decimal.isDecimal(gauche) && Prisma.Decimal.isDecimal(droite)) {
      return gauche.equals(droite);
    }
    if (gauche instanceof Date && droite instanceof Date) {
      return gauche.getTime() === droite.getTime();
    }
    return gauche === droite;
  }
}

function formaterChangement(changement: ChampModifie): string {
  return `${changement.nom} : ${formaterValeur(changement.ancienneValeur)} vers ${formaterValeur(changement.nouvelleValeur)}`;
}

function formaterValeur(valeur: unknown): string {
  if (Prisma.Decimal.isDecimal(valeur)) return valeur.toFixed(2);
  if (valeur instanceof Date) return valeur.toISOString().slice(0, 10);
  if (valeur === null) return 'vide';
  if (typeof valeur === 'string' || typeof valeur === 'number') {
    return String(valeur);
  }
  return 'valeur inconnue';
}
