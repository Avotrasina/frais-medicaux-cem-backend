import { ConflictException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { FactureCalculService } from './facture-calcul.service.js';
import { FactureIndividuelleService } from './facture-individuelle.service.js';
import { FacturePermissionsService } from './facture-permissions.service.js';
import { FactureWorkflowService } from './facture-workflow.service.js';
import { MouvementFactureService } from './mouvement-facture.service.js';
import { RegleService } from '../../regles-prise-en-charge/regle.service.js';
import { SuiviService } from './suivi.service.js';
import {
  AgentType,
  RegimeActe,
  RoleUtilisateur,
  StatutFacture,
  TypeMouvement,
  TypeRegle,
} from '../../generated/prisma/enums.js';

vi.mock('../../infrastructure/prisma/prisma.service.js', () => ({
  PrismaService: class PrismaService {},
}));

describe('FactureIndividuelleService - contrôle des totaux', () => {
  const facture = {
    montantTotal: new Prisma.Decimal('100000.00'),
    total100Cem: new Prisma.Decimal('0.00'),
    totalDepassement: new Prisma.Decimal('30000.00'),
  };
  const lignes = [
    {
      montantActe: new Prisma.Decimal('100000.00'),
      montantCemIntegral: new Prisma.Decimal('0.00'),
      montantDepassementActe: new Prisma.Decimal('30000.00'),
      montantDepassementPlafond: new Prisma.Decimal('0.00'),
    },
  ];

  function creerService(
    factureGlobale = facture,
    lignesFacture: typeof lignes | [] = lignes,
  ): FactureIndividuelleService {
    const prisma = {
      factureGlobale: {
        findUnique: vi.fn().mockResolvedValue(factureGlobale),
      },
      factureIndividuelle: {
        findMany: vi.fn().mockResolvedValue(lignesFacture),
      },
    };

    return new FactureIndividuelleService(
      prisma as never,
      {} as RegleService,
      new FactureCalculService(),
      new FacturePermissionsService(),
      {} as MouvementFactureService,
      {} as SuiviService,
      new FactureWorkflowService(),
    );
  }

  function creerTransaction(
    factureGlobale = facture,
    lignesFacture: typeof lignes | [] = lignes,
  ): Prisma.TransactionClient {
    return {
      factureGlobale: {
        findUnique: vi.fn().mockResolvedValue(factureGlobale),
      },
      factureIndividuelle: {
        findMany: vi.fn().mockResolvedValue(lignesFacture),
      },
    } as unknown as Prisma.TransactionClient;
  }

  it('confirme des totaux concordants', async () => {
    const resultat = await creerService().controleTotaux(7);

    expect(resultat.concordant).toBe(true);
    expect(resultat.sommes).toEqual({
      montantActe: '100000.00',
      montantCemIntegral: '0.00',
      depassement: '30000.00',
    });
    expect(resultat.ecarts).toEqual({
      montantActe: '0.00',
      montantCemIntegral: '0.00',
      depassement: '0.00',
    });
  });

  it('refuse un écart sans confirmation et enregistre le détail après confirmation', async () => {
    const service = creerService({
      ...facture,
      montantTotal: new Prisma.Decimal('110000.00'),
    });
    const tx = creerTransaction({
      ...facture,
      montantTotal: new Prisma.Decimal('110000.00'),
    });

    await expect(
      service.verifierAvantValidation(tx, 7, false, 'Écart constaté'),
    ).rejects.toThrow(ConflictException);

    await expect(
      service.verifierAvantValidation(tx, 7, true, 'Écart justifié'),
    ).resolves.toContain('Écart de totaux confirmé : montantActe=-10000.00');
  });

  it('refuse une facture sans ligne sauf confirmation explicite avec remarque', async () => {
    const service = creerService(facture, []);
    const tx = creerTransaction(facture, []);

    await expect(
      service.verifierAvantValidation(tx, 7, false, undefined),
    ).rejects.toThrow(ConflictException);

    await expect(
      service.verifierAvantValidation(
        tx,
        7,
        true,
        'Aucune ligne conformément à la décision.',
      ),
    ).resolves.toContain('Écart de totaux confirmé');
  });
});

describe('FactureIndividuelleService - calcul des lignes', () => {
  it('ne stocke le montant Cem intégral que pour une règle de charge totale', () => {
    const calcul = new FactureCalculService();
    const actif = calcul.calculerLigne(100_000, 30_000, 0, {
      type: TypeRegle.REPARTITION_AGENT_CEM,
      tauxCem: new Prisma.Decimal(80),
    });
    const nonActif = calcul.calculerLigne(100_000, 20_000, 0, {
      type: TypeRegle.CHARGE_TOTALE_CEM,
      tauxCem: new Prisma.Decimal(100),
    });

    expect(actif.montantCemIntegral.toFixed(2)).toBe('0.00');
    expect(nonActif.montantCemIntegral.toFixed(2)).toBe('80000.00');
  });
});

describe('FactureIndividuelleService - numérotation et mouvements', () => {
  const dateActe = '2026-01-15';

  function creerServiceCreation(
    statut: StatutFacture = StatutFacture.ENREGISTREE,
    synchroniserPremiersMax = false,
  ) {
    const facture = {
      id: 7,
      statut,
      moisPrestation: new Date('2026-01-01T00:00:00.000Z'),
      dateReception: new Date('2026-01-31T00:00:00.000Z'),
    };
    const beneficiaire = {
      id: 9,
      idp: 'IDP-09',
      personne: {
        agent: { agentType: AgentType.AGENT_ACTIF },
        familleAgent: null,
      },
    };
    const acte = {
      id: 3,
      code: 'ACT-03',
      nomActe: 'Consultation',
      regime: RegimeActe.NORMAL,
    };
    const lignes: Array<
      Record<string, unknown> & { id: number; numLigne: number }
    > = [];
    let prochainId = 1;
    let maxLectures = 0;
    let libererLectures!: () => void;
    const lecturesSynchronisees = new Promise<void>((resolve) => {
      libererLectures = resolve;
    });
    const erreurUnique = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed',
      {
        code: 'P2002',
        clientVersion: 'test',
        meta: { target: ['facture_globale_id', 'num_ligne'] },
      },
    );
    const rechercherAttestation = vi.fn(
      async ({
        where,
      }: {
        where: { id: number };
      }): Promise<{ id: number } | null> => ({ id: where.id }),
    );
    const trouverLigne = vi.fn(
      async (args: {
        orderBy?: { numLigne: string };
        where?: { id?: number | { not: number }; priseEnChargeId?: number };
      }) => {
        if (args.orderBy !== undefined) {
          if (synchroniserPremiersMax && maxLectures < 2) {
            maxLectures += 1;
            if (maxLectures === 2) libererLectures();
            await lecturesSynchronisees;
            return null;
          }
          const max = Math.max(0, ...lignes.map(({ numLigne }) => numLigne));
          return max === 0 ? null : { numLigne: max };
        }
        if (args.where?.priseEnChargeId !== undefined) {
          const ligne = lignes.find(
            ({ id, priseEnChargeId }) =>
              priseEnChargeId === args.where?.priseEnChargeId &&
              typeof args.where?.id === 'object' &&
              id !== args.where.id.not,
          );
          return ligne === undefined ? null : { id: ligne.id };
        }
        const id =
          typeof args.where?.id === 'number' ? args.where.id : undefined;
        const ligne = lignes.find((element) => element.id === id);
        return ligne === undefined
          ? null
          : { ...ligne, factureGlobale: facture, beneficiaire };
      },
    );
    const creerLigne = vi.fn(
      async (args: { data: Record<string, unknown> }) => {
        const numLigne = Number(args.data.numLigne);
        if (lignes.some((ligne) => ligne.numLigne === numLigne)) {
          throw erreurUnique;
        }
        const ligne = {
          ...args.data,
          id: prochainId,
          numLigne,
          dateActe: new Date(`${dateActe}T00:00:00.000Z`),
          refPaie: null,
          moisAffectation: null,
          priseEnChargeId: args.data.priseEnChargeId ?? null,
        } as Record<string, unknown> & { id: number; numLigne: number };
        prochainId += 1;
        lignes.push(ligne);
        return ligne;
      },
    );
    const tx = {
      factureGlobale: { findUnique: vi.fn().mockResolvedValue(facture) },
      beneficiaire: { findUnique: vi.fn().mockResolvedValue(beneficiaire) },
      acte: { findUnique: vi.fn().mockResolvedValue(acte) },
      attestation: { findUnique: rechercherAttestation },
      factureIndividuelle: {
        findFirst: trouverLigne,
        create: creerLigne,
        update: vi.fn(
          async ({
            where,
            data,
          }: {
            where: { id: number };
            data: Record<string, unknown>;
          }) => {
            const ligne = lignes.find(({ id }) => id === where.id);
            if (ligne === undefined) throw new Error('Ligne absente');
            Object.assign(ligne, data);
            return ligne;
          },
        ),
        findUniqueOrThrow: vi.fn(
          async ({ where }: { where: { id: number } }) => {
            const ligne = lignes.find(({ id }) => id === where.id);
            if (ligne === undefined) throw new Error('Ligne absente');
            return { ...ligne, beneficiaire };
          },
        ),
        delete: vi.fn(async ({ where }: { where: { id: number } }) => {
          const index = lignes.findIndex(({ id }) => id === where.id);
          const [ligne] = lignes.splice(index, 1);
          return ligne;
        }),
      },
      ligneSuivi: { findFirst: vi.fn().mockResolvedValue(null) },
    };
    const mouvement = { ecrire: vi.fn().mockResolvedValue({ id: 1 }) };
    const service = new FactureIndividuelleService(
      {
        $transaction: vi.fn(
          async (operation: (client: typeof tx) => Promise<unknown>) =>
            operation(tx),
        ),
      } as never,
      {
        obtenirEnVigueur: vi.fn().mockResolvedValue({
          type: TypeRegle.REPARTITION_AGENT_CEM,
          tauxCem: new Prisma.Decimal(80),
        }),
      } as unknown as RegleService,
      new FactureCalculService(),
      new FacturePermissionsService(),
      mouvement as unknown as MouvementFactureService,
      { lire: vi.fn() } as unknown as SuiviService,
      new FactureWorkflowService(),
    );

    return { service, lignes, creerLigne, mouvement, rechercherAttestation };
  }

  const donnees = {
    libelle: 'Consultation',
    dateActe,
    idp: 'IDP-09',
    acteId: 3,
    montantActe: 100_000,
  };

  it('attribue des numéros séquentiels', async () => {
    const { service, creerLigne } = creerServiceCreation();

    await service.creer(7, { id: 5, role: RoleUtilisateur.OPERATEUR }, donnees);
    await service.creer(7, { id: 5, role: RoleUtilisateur.OPERATEUR }, donnees);

    expect(creerLigne.mock.calls.map(([appel]) => appel.data.numLigne)).toEqual(
      [1, 2],
    );
  });

  it('réessaie une création simultanée après le conflit P2002 de numLigne', async () => {
    const { service, lignes, creerLigne } = creerServiceCreation(
      StatutFacture.ENREGISTREE,
      true,
    );

    const resultats = await Promise.all([
      service.creer(7, { id: 5, role: RoleUtilisateur.OPERATEUR }, donnees),
      service.creer(7, { id: 5, role: RoleUtilisateur.OPERATEUR }, donnees),
    ]);

    expect(
      resultats.map(({ numLigne }) => numLigne).sort((a, b) => a - b),
    ).toEqual([1, 2]);
    expect(
      lignes.map(({ numLigne }) => numLigne).sort((a, b) => a - b),
    ).toEqual([1, 2]);
    expect(creerLigne).toHaveBeenCalledTimes(3);
  });

  it('écrit un mouvement MODIFICATION lors de la création en A_REVALIDER', async () => {
    const { service, mouvement } = creerServiceCreation(
      StatutFacture.A_REVALIDER,
    );

    await service.creer(7, { id: 5, role: RoleUtilisateur.OPERATEUR }, donnees);

    expect(mouvement.ecrire).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        factureGlobaleId: 7,
        type: TypeMouvement.MODIFICATION,
        effectueParId: 5,
        remarque: expect.stringContaining('Création de la ligne 1'),
      }),
    );
  });

  it('signale un numPec inexistant sans bloquer la création', async () => {
    const { service, rechercherAttestation } = creerServiceCreation();
    rechercherAttestation.mockResolvedValue(null);

    const resultat = await service.creer(
      7,
      { id: 5, role: RoleUtilisateur.OPERATEUR },
      { ...donnees, numPec: 73 },
    );

    expect(resultat.avertissements).toContain(
      'L’attestation de prise en charge 73 est introuvable.',
    );
    expect(resultat.numPec).toBe(73);
  });

  it('signale une attestation déjà affectée à une autre ligne sans bloquer', async () => {
    const { service } = creerServiceCreation();
    const acteur = { id: 5, role: RoleUtilisateur.OPERATEUR };

    await service.creer(7, acteur, { ...donnees, numPec: 73 });
    const resultat = await service.creer(7, acteur, { ...donnees, numPec: 73 });

    expect(resultat.avertissements).toContain(
      'L’attestation de prise en charge 73 est déjà utilisée par une autre ligne.',
    );
  });

  it('trace la modification et supprime physiquement une ligne en A_REVALIDER', async () => {
    const { service, mouvement, lignes } = creerServiceCreation(
      StatutFacture.A_REVALIDER,
    );
    const acteur = { id: 5, role: RoleUtilisateur.OPERATEUR };
    const creee = await service.creer(7, acteur, donnees);
    mouvement.ecrire.mockClear();

    await service.modifier(7, creee.id, acteur, {
      montantDepassementActe: 10_000,
    });

    expect(mouvement.ecrire).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        type: TypeMouvement.MODIFICATION,
        remarque: expect.stringContaining(
          `Modification de la ligne ${creee.numLigne}`,
        ),
      }),
    );

    mouvement.ecrire.mockClear();
    await service.supprimer(7, creee.id, acteur);

    expect(lignes).toHaveLength(0);
    expect(mouvement.ecrire).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        type: TypeMouvement.MODIFICATION,
        remarque: expect.stringContaining(
          `Suppression de la ligne ${creee.numLigne}`,
        ),
      }),
    );
  });

  it('refuse la création hors des statuts autorisés avant de chercher une règle', async () => {
    const { service } = creerServiceCreation(StatutFacture.VALIDEE);

    await expect(
      service.creer(7, { id: 5, role: RoleUtilisateur.OPERATEUR }, donnees),
    ).rejects.toThrow(ConflictException);
  });
});
