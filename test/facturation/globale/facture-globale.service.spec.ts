import {
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  RoleUtilisateur,
  StatutFacture,
  TypeMouvement,
} from '../../../src/generated/prisma/enums.js';
import { Prisma } from '../../../src/generated/prisma/client.js';
import { PrismaService } from '../../../src/infrastructure/prisma/prisma.service.js';
import { RefSocialService } from '../../../src/modules/facturation/shared/ref-social.service.js';
import { RegleService } from '../../../src/modules/regles-prise-en-charge/regle.service.js';
import { FactureCalculService } from '../../../src/modules/facturation/shared/facture-calcul.service.js';
import { MouvementFactureService } from '../../../src/modules/facturation/shared/mouvement-facture.service.js';
import { FactureIndividuelleService } from '../../../src/modules/facturation/factures/individuelle/facture-individuelle.service.js';
import { FactureWorkflowService } from '../../../src/modules/facturation/factures/workflow/facture-workflow.service.js';
import {
  FactureGlobaleService,
  type ActeurFacture,
} from '../../../src/modules/facturation/factures/globale/facture-globale.service.js';

vi.mock('../../../src/infrastructure/prisma/prisma.service.js', () => ({
  PrismaService: class PrismaService {},
}));

function creerService(statut: StatutFacture = StatutFacture.A_CORRIGER) {
  const facture = {
    id: 21,
    statut,
    updatedAt: new Date('2026-11-06T08:00:00.000Z'),
    dateValidation: new Date('2026-11-05T08:00:00.000Z'),
    valideParId: 7,
    prestataireId: 3,
    numFacture: 'F-2026-1',
    dateFacture: new Date('2026-11-01T00:00:00.000Z'),
    dateReception: new Date('2026-11-02T00:00:00.000Z'),
    moisPrestation: new Date('2026-10-01T00:00:00.000Z'),
    refAgence: null,
    remarque: null,
    montantTotal: new Prisma.Decimal('1000000.00'),
    total100Cem: new Prisma.Decimal('700000.00'),
    totalDepassement: new Prisma.Decimal('0.00'),
    tauxCem: new Prisma.Decimal('80.00'),
    montant80Cem: new Prisma.Decimal('240000.00'),
    montant20Agent: new Prisma.Decimal('60000.00'),
    totalChargeAgent: new Prisma.Decimal('60000.00'),
  };
  const tx = {
    factureGlobale: {
      findUnique: vi.fn(async () => ({
        ...facture,
        prestataire: { id: facture.prestataireId, nom: 'Prestataire' },
      })),
      updateMany: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { id: number; statut: StatutFacture; updatedAt: Date };
          data: Record<string, unknown>;
        }) => {
          if (
            where.id !== facture.id ||
            where.statut !== facture.statut ||
            where.updatedAt.getTime() !== facture.updatedAt.getTime()
          ) {
            return { count: 0 };
          }
          Object.assign(facture, data);
          return { count: 1 };
        },
      ),
    },
  };
  const prisma = {
    $transaction: vi.fn(
      async <T>(operation: (client: typeof tx) => Promise<T>) => operation(tx),
    ),
  };
  const mouvements = { ecrire: vi.fn().mockResolvedValue(undefined) };
  const calculs = {
    calculerParts: vi.fn(
      (
        montantTotal: Prisma.Decimal,
        total100Cem: Prisma.Decimal,
        totalDepassement: Prisma.Decimal,
        tauxCem: Prisma.Decimal,
      ) =>
        new FactureCalculService().calculerParts(
          montantTotal,
          total100Cem,
          totalDepassement,
          tauxCem,
        ),
    ),
  };
  const service = new FactureGlobaleService(
    prisma as unknown as PrismaService,
    {} as RefSocialService,
    {} as RegleService,
    new FactureWorkflowService(),
    mouvements as unknown as MouvementFactureService,
    calculs as unknown as FactureCalculService,
    {} as FactureIndividuelleService,
  );

  return { service, facture, tx, mouvements, calculs };
}

const acteur: ActeurFacture = {
  id: 5,
  role: RoleUtilisateur.OPERATEUR,
};

describe('FactureGlobaleService - modifications en correction', () => {
  it('enregistre un mouvement et repasse en ENREGISTREE en effaçant la validation', async () => {
    const { service, tx, mouvements } = creerService();

    const resultat = await service.modifierInformations(21, acteur, {
      numFacture: 'F-2026-2',
    });

    expect(resultat.statut).toBe(StatutFacture.ENREGISTREE);
    expect(tx.factureGlobale.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 21,
          statut: StatutFacture.A_CORRIGER,
        }),
        data: expect.objectContaining({
          statut: StatutFacture.ENREGISTREE,
          dateValidation: null,
          valideParId: null,
        }),
      }),
    );
    expect(mouvements.ecrire).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({ type: TypeMouvement.MODIFICATION }),
    );
  });

  it('ne laisse passer qu’une seule modification simultanée en correction', async () => {
    const { service, mouvements } = creerService();

    const resultats = await Promise.allSettled([
      service.modifierInformations(21, acteur, { numFacture: 'F-2026-2' }),
      service.modifierInformations(21, acteur, { numFacture: 'F-2026-3' }),
    ]);

    expect(
      resultats.filter((resultat) => resultat.status === 'fulfilled'),
    ).toHaveLength(1);
    expect(
      resultats.filter((resultat) => resultat.status === 'rejected'),
    ).toHaveLength(1);
    expect(mouvements.ecrire).toHaveBeenCalledTimes(1);
  });

  it('conserve le statut ENREGISTREE lors de la modification habituelle', async () => {
    const { service, facture, mouvements } = creerService(
      StatutFacture.ENREGISTREE,
    );

    const resultat = await service.modifierInformations(21, acteur, {
      numFacture: 'F-2026-2',
    });

    expect(resultat.statut).toBe(StatutFacture.ENREGISTREE);
    expect(facture.dateValidation).toBeNull();
    expect(facture.valideParId).toBeNull();
    expect(mouvements.ecrire).toHaveBeenCalledTimes(1);
  });

  it('modifie ensemble les informations et les montants via une seule action', async () => {
    const { service, facture, tx, mouvements, calculs } = creerService();

    const resultat = await service.modifierInformations(21, acteur, {
      numFacture: 'F-2026-CORRIGEE',
      total100Cem: 200_000,
      totalDepassement: 100_000,
      montant80Cem: 560_000,
      montant20Agent: 140_000,
      totalChargeAgent: 240_000,
      motif: 'Correction des totaux',
    });

    expect(facture.numFacture).toBe('F-2026-CORRIGEE');
    expect(facture.total100Cem?.toString()).toBe('200000');
    expect(facture.totalDepassement?.toString()).toBe('100000');
    expect(tx.factureGlobale.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          numFacture: 'F-2026-CORRIGEE',
          total100Cem: new Prisma.Decimal('200000'),
          totalDepassement: new Prisma.Decimal('100000'),
          montant80Cem: new Prisma.Decimal('560000'),
          montant20Agent: new Prisma.Decimal('140000'),
          totalChargeAgent: new Prisma.Decimal('240000'),
        }),
      }),
    );
    expect(resultat.partCem?.toString()).toBe('560000');
    expect(resultat.montant80Cem?.toString()).toBe('560000');
    expect(resultat.montant20Agent?.toString()).toBe('140000');
    expect(resultat.totalChargeAgent?.toString()).toBe('240000');
    expect(calculs.calculerParts).toHaveBeenCalledTimes(1);
    expect(mouvements.ecrire).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        type: TypeMouvement.MODIFICATION,
        remarque: expect.stringContaining('Correction des totaux'),
      }),
    );
  });

  it('refuse les parts reçues si elles diffèrent du calcul serveur', async () => {
    const { service, tx, mouvements } = creerService();

    await expect(
      service.modifierInformations(21, acteur, {
        total100Cem: 200_000,
        totalDepassement: 100_000,
        montant80Cem: 559_999,
        montant20Agent: 140_000,
        totalChargeAgent: 240_000,
        motif: 'Parts incorrectes',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(tx.factureGlobale.updateMany).not.toHaveBeenCalled();
    expect(mouvements.ecrire).not.toHaveBeenCalled();
  });

  it('exige les trois montants calculés dès que l’un est envoyé', async () => {
    const { service, tx } = creerService();

    await expect(
      service.modifierInformations(21, acteur, {
        montant80Cem: 560_000,
      }),
    ).rejects.toThrow(
      'Les trois montants calculés doivent être fournis ensemble.',
    );

    expect(tx.factureGlobale.updateMany).not.toHaveBeenCalled();
  });

  it('refuse un destinataire ENVOI_VALIDATION sans rôle valideur', async () => {
    const tx = {
      factureGlobale: {
        findUnique: vi.fn().mockResolvedValue({
          id: 21,
          statut: StatutFacture.ENREGISTREE,
          updatedAt: new Date('2026-11-06T08:00:00.000Z'),
        }),
        updateMany: vi.fn(),
      },
      factureIndividuelle: {},
      utilisateur: {
        findUnique: vi.fn().mockResolvedValue({
          id: 8,
          role: RoleUtilisateur.OPERATEUR,
        }),
      },
    };
    const prisma = {
      $transaction: vi.fn(
        async <T>(operation: (client: typeof tx) => Promise<T>) =>
          operation(tx),
      ),
    };
    const service = new FactureGlobaleService(
      prisma as unknown as PrismaService,
      {} as RefSocialService,
      {} as RegleService,
      new FactureWorkflowService(),
      { ecrire: vi.fn() } as unknown as MouvementFactureService,
      {} as FactureCalculService,
      {
        verifierAvantValidation: vi.fn().mockResolvedValue(undefined),
      } as unknown as FactureIndividuelleService,
    );

    await expect(
      service.envoyerValidation(
        21,
        { id: 5, role: RoleUtilisateur.OPERATEUR },
        { destinataireId: 8 },
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(tx.factureGlobale.updateMany).not.toHaveBeenCalled();
  });

  it('refuse une date antérieure et accepte une date future', async () => {
    const prisma = {
      factureGlobale: {
        findUnique: vi.fn().mockResolvedValue({ id: 21 }),
      },
      mouvementFacture: {
        findFirst: vi.fn().mockResolvedValue({
          date: new Date('2001-01-01T00:00:00.000Z'),
        }),
      },
    };
    const service = new FactureGlobaleService(
      prisma as unknown as PrismaService,
      {} as RefSocialService,
      {} as RegleService,
      new FactureWorkflowService(),
      {} as MouvementFactureService,
      {} as FactureCalculService,
      {} as FactureIndividuelleService,
    );

    await expect(
      service.validerDateAction(21, '2000-12-31'),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.validerDateAction(21, '2099-01-01')).resolves.toEqual(
      new Date('2099-01-01T00:00:00.000Z'),
    );
  });

  it('filtre les mouvements par type et les ordonne par identifiant', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const prisma = {
      factureGlobale: {
        findUnique: vi.fn().mockResolvedValue({ id: 21 }),
      },
      mouvementFacture: { findMany },
    };
    const service = new FactureGlobaleService(
      prisma as unknown as PrismaService,
      {} as RefSocialService,
      {} as RegleService,
      new FactureWorkflowService(),
      {} as MouvementFactureService,
      {} as FactureCalculService,
      {} as FactureIndividuelleService,
    );

    await service.historique(21, TypeMouvement.VALIDATION);

    expect(findMany).toHaveBeenCalledWith({
      where: { factureGlobaleId: 21, type: TypeMouvement.VALIDATION },
      include: { effectuePar: true, adresseA: true },
      orderBy: { id: 'asc' },
    });
  });

  it('inclut tous les mouvements triés du plus récent au plus ancien', async () => {
    const mouvements = [
      {
        id: 8,
        type: TypeMouvement.VALIDATION,
        date: new Date('2026-11-05T00:00:00.000Z'),
        createdAt: new Date('2026-11-05T08:00:00.000Z'),
        remarque: 'Validée',
        service: null,
        effectuePar: { id: 7, nom: 'Agent', role: RoleUtilisateur.CHEF },
        adresseA: null,
      },
      {
        id: 7,
        type: TypeMouvement.ENVOI_VALIDATION,
        date: new Date('2026-11-04T00:00:00.000Z'),
        createdAt: new Date('2026-11-04T08:00:00.000Z'),
        remarque: null,
        service: null,
        effectuePar: {
          id: 5,
          nom: 'Operateur',
          role: RoleUtilisateur.OPERATEUR,
        },
        adresseA: { id: 7, nom: 'Agent', role: RoleUtilisateur.CHEF },
      },
    ];
    const findMany = vi
      .fn()
      .mockResolvedValue([{ id: 21, dateCloture: null, mouvements }]);
    const prisma = { factureGlobale: { findMany } };
    const service = new FactureGlobaleService(
      prisma as unknown as PrismaService,
      {} as RefSocialService,
      {} as RegleService,
      new FactureWorkflowService(),
      {} as MouvementFactureService,
      {} as FactureCalculService,
      {} as FactureIndividuelleService,
    );

    const factures = await service.lister();

    expect(factures[0]?.mouvements).toEqual(mouvements);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          mouvements: expect.objectContaining({
            orderBy: { id: 'desc' },
          }),
        }),
      }),
    );
    expect(findMany.mock.calls[0]?.[0].include?.mouvements).not.toHaveProperty(
      'take',
    );
  });

  it('inclut les mouvements triés dans le détail sans modifier le chargement interne', async () => {
    const mouvements = [
      {
        id: 8,
        type: TypeMouvement.VALIDATION,
        date: new Date('2026-11-05T00:00:00.000Z'),
        createdAt: new Date('2026-11-05T08:00:00.000Z'),
        remarque: null,
        service: null,
        effectuePar: { id: 7, nom: 'Agent', role: RoleUtilisateur.CHEF },
        adresseA: null,
      },
    ];
    const findUnique = vi.fn().mockResolvedValue({
      id: 21,
      dateCloture: null,
      _count: { piecesJointes: 0 },
      prestataire: { id: 3, nom: 'Clinique' },
    });
    const findMany = vi.fn().mockResolvedValue(mouvements);
    const prisma = {
      factureGlobale: { findUnique },
      mouvementFacture: { findMany },
    };
    const service = new FactureGlobaleService(
      prisma as unknown as PrismaService,
      {} as RefSocialService,
      {} as RegleService,
      new FactureWorkflowService(),
      {} as MouvementFactureService,
      {} as FactureCalculService,
      {} as FactureIndividuelleService,
    );

    const facture = await service.obtenirAvecMouvements(21);

    expect(facture.mouvements).toEqual(mouvements);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { factureGlobaleId: 21 },
        orderBy: { id: 'desc' },
      }),
    );
  });
});
