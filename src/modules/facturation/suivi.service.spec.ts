import { UnprocessableEntityException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import {
  PorteePlafond,
  RegimeActe,
  StatutFacture,
  UnitePlafond,
} from '../../generated/prisma/enums.js';
import { FacturePermissionsService } from './facture-permissions.service.js';
import { SuiviService } from './suivi.service.js';
import { SuiviCalculService } from './suivi-calcul.service.js';
import { PlafondResolutionService } from '../plafond/plafond-resolution.service.js';

vi.mock('../../infrastructure/prisma/prisma.service.js', () => ({
  PrismaService: class PrismaService {},
}));

const date = (jour: number): Date => new Date(Date.UTC(2026, 0, jour));
const dec = (valeur: string | number): Prisma.Decimal =>
  new Prisma.Decimal(valeur);

interface ConfigurationTest {
  annuel: {
    unite: UnitePlafond;
    valeur: string;
    dateEffet?: Date;
    dateFin?: Date | null;
  } | null;
  parActe?: { unite: UnitePlafond; valeur: string; dateEffet?: Date } | null;
  lignes?: Array<{ montant: string; jour: number }>;
  beneficiaire?: Record<string, unknown>;
  versionsAnnuelles?: number;
}

function creerService(configuration: ConfigurationTest) {
  const dateEffet = configuration.annuel?.dateEffet ?? date(1);
  const annuels = configuration.annuel
    ? Array.from(
        { length: configuration.versionsAnnuelles ?? 1 },
        (_, index) => ({
          id: index + 1,
          porteePlafond: PorteePlafond.PAR_AN,
          unite: configuration.annuel!.unite,
          montant:
            configuration.annuel!.unite === UnitePlafond.MONTANT
              ? dec(configuration.annuel!.valeur)
              : null,
          nbSeances:
            configuration.annuel!.unite === UnitePlafond.SEANCES
              ? Number(configuration.annuel!.valeur)
              : null,
          dateEffet:
            index === 0 ? dateEffet : new Date(Date.UTC(2026, index, 1)),
          dateFin:
            configuration.annuel!.dateFin ??
            (index + 1 < (configuration.versionsAnnuelles ?? 1)
              ? new Date(Date.UTC(2026, index + 1, 0))
              : null),
          acteID: 6,
          categorieActeID: null,
        }),
      )
    : [];
  const parActe = configuration.parActe
    ? {
        id: 20,
        porteePlafond: PorteePlafond.PAR_ACTE,
        unite: configuration.parActe.unite,
        montant: dec(configuration.parActe.valeur),
        nbSeances: null,
        dateEffet: configuration.parActe.dateEffet ?? date(1),
        dateFin: null,
        acteID: 6,
        categorieActeID: null,
      }
    : null;
  const personne =
    configuration.beneficiaire ??
    ({
      nom: 'BÉNÉFICIAIRE',
      prenom: 'Prénom',
      agent: null,
      familleAgent: null,
    } satisfies Record<string, unknown>);
  const beneficiaire = {
    id: 15,
    idp: 'IDP-15',
    observationIDP: 'Observation',
    personne,
  };
  const acte = {
    id: 6,
    code: 'ACT-06',
    nomActe: 'Acte de test',
    categorieActeId: 2,
    categorieActe: { nomCategorie: 'Catégorie de test' },
    regime: RegimeActe.NORMAL,
  };
  const lignes = (configuration.lignes ?? []).map((ligne, index) => ({
    id: index + 1,
    factureGlobaleId: index + 30,
    beneficiaireId: beneficiaire.id,
    acteId: acte.id,
    dateActe: date(ligne.jour),
    libelle: `Acte ${index + 1}`,
    montantActe: dec(ligne.montant),
    factureGlobale: {
      refSociale: `REF-${index + 1}`,
      prestataire: { nom: `Établissement ${index + 1}` },
      statut: StatutFacture.ENREGISTREE,
    },
    acte: {
      code: acte.code,
      nomActe: acte.nomActe,
      categorieActe: acte.categorieActe,
    },
  }));
  const plafondMatching = (query: {
    where: {
      acteID: number | null;
      categorieActeID: number | null;
      porteePlafond: PorteePlafond;
      dateEffet: { lte: Date };
    };
  }) => {
    if (
      query.where.acteID !== acte.id ||
      query.where.categorieActeID !== null
    ) {
      return null;
    }
    const plafonds =
      query.where.porteePlafond === PorteePlafond.PAR_AN
        ? annuels
        : parActe === null
          ? []
          : [parActe];
    return (
      plafonds
        .filter(
          (plafond) =>
            plafond.dateEffet.getTime() <= query.where.dateEffet.lte.getTime(),
        )
        .sort(
          (gauche, droite) =>
            droite.dateEffet.getTime() - gauche.dateEffet.getTime(),
        )[0] ?? null
    );
  };
  const prisma = {
    beneficiaire: {
      findUnique: vi.fn().mockResolvedValue(beneficiaire),
    },
    acte: { findUnique: vi.fn().mockResolvedValue(acte) },
    ligneSuivi: { findMany: vi.fn().mockResolvedValue(lignes) },
    plafond: {
      findFirst: vi.fn(async (query: Parameters<typeof plafondMatching>[0]) =>
        plafondMatching(query),
      ),
      findMany: vi.fn(async () => annuels.map(({ id }) => ({ id }))),
    },
    factureIndividuelle: {
      findFirst: vi.fn().mockResolvedValue(null),
    },
  };
  const service = new SuiviService(
    prisma as never,
    new SuiviCalculService(),
    new FacturePermissionsService(),
    {
      resoudre: vi.fn(
        async (cibles: Array<{ type: string; id: number }>) =>
          new Map(
            cibles.map((cible) => [
              `${cible.type}:${cible.id}`,
              {
                parActe: null,
                parAn: null,
                modeleSuivi: null,
                historique: [
                  {
                    id: 21,
                    unite: UnitePlafond.MONTANT,
                    valeur: '90000.00',
                    dateEffet: '2026-01-01',
                    dateFin: null,
                    source: 'CATEGORIE',
                    porteePlafond: PorteePlafond.PAR_AN,
                  },
                ],
              },
            ]),
          ),
      ),
      cleCible: (cible: { type: string; id: number }) =>
        `${cible.type}:${cible.id}`,
    } as unknown as PlafondResolutionService,
  );
  return { service, prisma, beneficiaire, acte };
}

describe('SuiviService - représentation des feuilles T5_x', () => {
  it('formate les cumuls, soldes et dépassements de T5_1', async () => {
    const { service } = creerService({
      annuel: { unite: UnitePlafond.MONTANT, valeur: '1000000' },
      lignes: ['300000', '400000', '500000', '400000', '300000'].map(
        (montant, index) => ({ montant, jour: index + 1 }),
      ),
    });

    const feuille = await service.lire('IDP-15', 6, 2026);

    expect(feuille.modele).toBe('PLAFOND_ANNUEL');
    expect(feuille.colonnes).toEqual([
      { cle: 'refSociale', libelle: 'Ref Social' },
      { cle: 'dateActe', libelle: "Date de l'Acte" },
      { cle: 'libelle', libelle: 'Libellé' },
      { cle: 'montantActe', libelle: "Montant de l'acte" },
      { cle: 'cumulActeConsomme', libelle: 'Montant cumulé' },
      { cle: 'soldePlafond', libelle: 'Solde du Plafond' },
      { cle: 'totalDepassement', libelle: 'Montant Dépassement' },
      { cle: 'nomEtablissement', libelle: "Nom de l'établissement" },
    ]);
    expect(feuille.lignes.map((ligne) => ligne.cumulActeConsomme)).toEqual([
      '300000.00',
      '700000.00',
      '1200000.00',
      '1600000.00',
      '1900000.00',
    ]);
    expect(feuille.lignes.map((ligne) => ligne.soldePlafond)).toEqual([
      '700000.00',
      '300000.00',
      '-200000.00',
      '-600000.00',
      '-900000.00',
    ]);
    expect(feuille.lignes.map((ligne) => ligne.totalDepassement)).toEqual([
      '0.00',
      '0.00',
      '200000.00',
      '400000.00',
      '300000.00',
    ]);
    expect(feuille.lignes[0]).toMatchObject({
      depassementActe: null,
      depassementPlafond: null,
      nomEtablissement: 'Établissement 1',
      plafondAnnuelApplique: '1000000.00',
    });
    expect(feuille.lignes[0]).not.toHaveProperty('etablissement');
    expect(feuille.totaux).toMatchObject({
      montantActe: '1900000.00',
      totalDepassement: '900000.00',
      cumulActeConsomme: '1900000.00',
      soldePlafond: '-900000.00',
    });
    expect(feuille.totaux).not.toHaveProperty('depassementFacture');
  });

  it('formate les numéros et libellés de séance T5_4', async () => {
    const { service } = creerService({
      annuel: { unite: UnitePlafond.SEANCES, valeur: '2' },
      lignes: ['300000', '400000', '500000', '400000', '300000'].map(
        (montant, index) => ({ montant, jour: index + 1 }),
      ),
    });

    const feuille = await service.lire('IDP-15', 6, 2026);

    expect(feuille.modele).toBe('SEANCES');
    expect(feuille.lignes.map((ligne) => ligne.libelleSeance)).toEqual([
      '1ère séance',
      '2ème séance',
      '3ème séance',
      '4ème séance',
      '5ème séance',
    ]);
    expect(feuille.lignes.map((ligne) => ligne.numeroSeance)).toEqual([
      1, 2, 3, 4, 5,
    ]);
    expect(feuille.lignes.map((ligne) => ligne.totalDepassement)).toEqual([
      '0.00',
      '0.00',
      '500000.00',
      '400000.00',
      '300000.00',
    ]);
    expect(feuille.totaux.seancesUtilisees).toBe(5);
    expect(feuille.lignes[0].cumulActeConsomme).toBeNull();
    expect(feuille.colonnes).toEqual([
      { cle: 'refSociale', libelle: 'Ref Social' },
      { cle: 'dateActe', libelle: "Date de l'Acte" },
      { cle: 'libelle', libelle: 'Libellé' },
      { cle: 'montantActe', libelle: "Montant de l'acte" },
      { cle: 'libelleSeance', libelle: 'N° Séance' },
      { cle: 'totalDepassement', libelle: 'Montant Dépassement' },
      { cle: 'nomEtablissement', libelle: "Nom de l'établissement" },
    ]);
  });

  it('expose séparément les dépassements des modèles T5_5 à T5_8', async () => {
    const { service } = creerService({
      annuel: { unite: UnitePlafond.MONTANT, valeur: '600000' },
      parActe: { unite: UnitePlafond.MONTANT, valeur: '60000' },
      lignes: Array.from({ length: 6 }, (_, index) => ({
        montant: '80000',
        jour: index + 1,
      })),
    });

    const feuille = await service.lire('IDP-15', 6, 2026);

    expect(feuille.modele).toBe('PLAFOND_ACTE_ET_ANNUEL');
    expect(feuille.colonnes.map(({ cle }) => cle)).toEqual([
      'refSociale',
      'dateActe',
      'libelle',
      'montantActe',
      'depassementActe',
      'cumulActeConsomme',
      'soldePlafond',
      'depassementPlafond',
      'totalDepassement',
      'nomEtablissement',
    ]);
    expect(feuille.lignes.map((ligne) => ligne.depassementActe)).toEqual(
      Array(6).fill('20000.00'),
    );
    expect(feuille.lignes.map((ligne) => ligne.cumulActeConsomme)).toEqual([
      '60000.00',
      '120000.00',
      '180000.00',
      '240000.00',
      '300000.00',
      '360000.00',
    ]);
    expect(feuille.lignes.map((ligne) => ligne.soldePlafond)).toEqual([
      '540000.00',
      '480000.00',
      '420000.00',
      '360000.00',
      '300000.00',
      '240000.00',
    ]);
    expect(feuille.totaux).toMatchObject({
      depassementActe: '120000.00',
      depassementPlafond: '0.00',
    });
  });

  it('masque les dates des plafonds tout en signalant les versions annuelles', async () => {
    const { service } = creerService({
      annuel: { unite: UnitePlafond.MONTANT, valeur: '1000000' },
      versionsAnnuelles: 2,
    });

    const feuille = await service.lire('IDP-15', 6, 2026);

    expect(feuille.plafonds.parAn).toMatchObject({
      valeur: '1000000.00',
      modifieEnCoursDAnnee: true,
    });
    expect(feuille.plafonds.parAn).not.toHaveProperty('dateEffet');
    expect(feuille.plafonds.parActe).toBeNull();
  });

  it('expose les dates et versions des plafonds lorsque historique est demandé', async () => {
    const { service } = creerService({
      annuel: { unite: UnitePlafond.MONTANT, valeur: '1000000' },
    });

    const feuille = await service.lire('IDP-15', 6, 2026, undefined, true);

    expect(feuille.plafonds.parAn).toHaveProperty('dateEffet');
    expect(feuille.plafonds.historique).toEqual([
      expect.objectContaining({
        dateEffet: '2026-01-01',
        dateFin: null,
        valeur: '90000.00',
      }),
    ]);
  });

  it.each([
    [
      'agent',
      {
        nom: 'BÉNÉFICIAIRE',
        prenom: 'Prénom',
        agent: {
          matricule: 1234,
          personne: { nom: 'AGENT', prenom: 'Exemple' },
          service: {
            nom: 'Service X',
            direction: { nom: 'Direction Y' },
          },
          structureOrganisationnelle: { direction: null, agence: null },
        },
        familleAgent: null,
      },
      'Agent',
    ],
    [
      'conjoint',
      {
        nom: 'CONJOINT',
        prenom: 'Prénom',
        agent: null,
        familleAgent: {
          conjoint: {},
          enfant: null,
          agent: {
            matricule: 2345,
            personne: { nom: 'AGENT', prenom: 'Exemple' },
            service: { nom: 'Service X', direction: { nom: 'Direction Y' } },
            structureOrganisationnelle: { direction: null, agence: null },
          },
        },
      },
      'Conjoint',
    ],
    [
      'enfant',
      {
        nom: 'ENFANT',
        prenom: 'Prénom',
        agent: null,
        familleAgent: {
          conjoint: null,
          enfant: {},
          agent: {
            matricule: 3456,
            personne: { nom: 'AGENT', prenom: 'Exemple' },
            service: { nom: 'Service X', direction: { nom: 'Direction Y' } },
            structureOrganisationnelle: { direction: null, agence: null },
          },
        },
      },
      'Enfant',
    ],
    [
      'sans agent',
      {
        nom: 'BÉNÉFICIAIRE',
        prenom: 'Orphelin',
        agent: null,
        familleAgent: null,
      },
      null,
    ],
  ] as const)(
    'construit l’entête pour %s depuis la relation en une lecture',
    async (_cas, personne, codeFam) => {
      const { service, prisma } = creerService({
        annuel: { unite: UnitePlafond.MONTANT, valeur: '1000000' },
        beneficiaire: personne as Record<string, unknown>,
      });

      const feuille = await service.lire('IDP-15', 6, 2026);

      expect(prisma.beneficiaire.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.beneficiaire.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            personne: expect.objectContaining({
              include: expect.objectContaining({
                agent: expect.any(Object),
                familleAgent: expect.any(Object),
              }),
            }),
          },
        }),
      );
      expect(feuille.entete.codeFam).toBe(codeFam);
      if (codeFam === null) {
        expect(feuille.entete).toMatchObject({
          nomPrenomAgent: null,
          im: null,
          direction: null,
          serviceAgence: null,
        });
      } else {
        expect(feuille.entete).toMatchObject({
          nomPrenomAgent: 'AGENT Exemple',
          im: expect.any(Number),
          direction: 'Direction Y',
          serviceAgence: 'Service X',
        });
      }
    },
  );

  it('refuse une cible sans plafond annuel avec un 422 explicite', async () => {
    const { service } = creerService({
      annuel: null,
      parActe: { unite: UnitePlafond.MONTANT, valeur: '60000' },
    });

    await expect(service.lire('IDP-15', 6, 2026)).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
    await expect(service.lire('IDP-15', 6, 2026)).rejects.toThrow(
      'Aucun suivi n’est disponible pour cette cible',
    );
  });
});
