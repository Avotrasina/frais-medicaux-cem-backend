import { ConflictException } from '@nestjs/common';
import {
  RoleUtilisateur,
  StatutFacture,
  TypeMouvement,
} from '../../../src/generated/prisma/enums.js';
import { Prisma } from '../../../src/generated/prisma/client.js';
import { PrismaService } from '../../../src/infrastructure/prisma/prisma.service.js';
import { RegleService } from '../../../src/modules/regles-prise-en-charge/regle.service.js';
import { FactureCalculService } from '../../../src/modules/facturation/shared/facture-calcul.service.js';
import { FacturePermissionsService } from '../../../src/modules/facturation/shared/facture-permissions.service.js';
import { MouvementFactureService } from '../../../src/modules/facturation/shared/mouvement-facture.service.js';
import { SuiviService } from '../../../src/modules/facturation/suivi/suivi.service.js';
import { FactureWorkflowService } from '../../../src/modules/facturation/factures/workflow/facture-workflow.service.js';
import { FactureIndividuelleService } from '../../../src/modules/facturation/factures/individuelle/facture-individuelle.service.js';

vi.mock('../../../src/infrastructure/prisma/prisma.service.js', () => ({
  PrismaService: class PrismaService {},
}));

function creerService(statut: StatutFacture) {
  const tx = {
    factureIndividuelle: {
      findFirst: vi.fn().mockResolvedValue({
        id: 8,
        numLigne: 2,
        factureGlobale: { statut },
      }),
      delete: vi.fn().mockResolvedValue({ id: 8 }),
    },
    factureGlobale: {
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
  };
  const prisma = {
    $transaction: vi.fn(
      async <T>(operation: (client: typeof tx) => Promise<T>) =>
        operation(tx),
    ),
  };
  const mouvements = { ecrire: vi.fn().mockResolvedValue(undefined) };
  const service = new FactureIndividuelleService(
    prisma as unknown as PrismaService,
    {} as RegleService,
    {} as FactureCalculService,
    { verifier: vi.fn() } as unknown as FacturePermissionsService,
    mouvements as unknown as MouvementFactureService,
    {} as SuiviService,
    new FactureWorkflowService(),
  );
  return { service, tx, mouvements };
}

function creerServiceControle(
  montantsFacture: {
    montantTotal: number;
    total100Cem: number;
    totalDepassement: number;
  },
  lignes: Array<{
    montantActe: number;
    montantCemIntegral: number;
    montantDepassementActe: number;
    montantDepassementPlafond: number;
  }>,
) {
  const tx = {
    factureGlobale: {
      findUnique: vi.fn().mockResolvedValue({
        montantTotal: new Prisma.Decimal(montantsFacture.montantTotal),
        total100Cem: new Prisma.Decimal(montantsFacture.total100Cem),
        totalDepassement: new Prisma.Decimal(montantsFacture.totalDepassement),
      }),
    },
    factureIndividuelle: {
      findMany: vi.fn().mockResolvedValue(
        lignes.map((ligne) => ({
          montantActe: new Prisma.Decimal(ligne.montantActe),
          montantCemIntegral: new Prisma.Decimal(ligne.montantCemIntegral),
          montantDepassementActe: new Prisma.Decimal(
            ligne.montantDepassementActe,
          ),
          montantDepassementPlafond: new Prisma.Decimal(
            ligne.montantDepassementPlafond,
          ),
        })),
      ),
    },
  };
  const service = new FactureIndividuelleService(
    {} as PrismaService,
    {} as RegleService,
    {} as FactureCalculService,
    {} as FacturePermissionsService,
    {} as MouvementFactureService,
    {} as SuiviService,
    new FactureWorkflowService(),
  );
  return { service, tx };
}

describe('FactureIndividuelleService - suppression T6', () => {
  it('repasse en ENREGISTREE et écrit MODIFICATION lors de la suppression en correction', async () => {
    const { service, tx, mouvements } = creerService(
      StatutFacture.A_CORRIGER,
    );

    await service.supprimer(21, 8, {
      id: 5,
      role: RoleUtilisateur.OPERATEUR,
    });

    expect(tx.factureGlobale.updateMany).toHaveBeenCalledWith({
      where: { id: 21, statut: StatutFacture.A_CORRIGER },
      data: {
        statut: StatutFacture.ENREGISTREE,
        dateValidation: null,
        valideParId: null,
      },
    });
    expect(mouvements.ecrire).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({ type: TypeMouvement.MODIFICATION }),
    );
    expect(tx.factureIndividuelle.delete).toHaveBeenCalledWith({
      where: { id: 8 },
    });
  });

  describe('FactureIndividuelleService - contrôle avant validation', () => {
    it('accepte les totaux concordants lorsqu’au moins une ligne existe', async () => {
      const { service, tx } = creerServiceControle(
        { montantTotal: 100000, total100Cem: 40000, totalDepassement: 10000 },
        [
          {
            montantActe: 100000,
            montantCemIntegral: 40000,
            montantDepassementActe: 10000,
            montantDepassementPlafond: 0,
          },
        ],
      );

      await expect(
        service.verifierAvantValidation(
          tx as unknown as Prisma.TransactionClient,
          21,
        ),
      ).resolves.toBeUndefined();
    });

    it('refuse un écart et retourne ses valeurs dans le conflit', async () => {
      const { service, tx } = creerServiceControle(
        { montantTotal: 100001, total100Cem: 40000, totalDepassement: 10000 },
        [
          {
            montantActe: 100000,
            montantCemIntegral: 40000,
            montantDepassementActe: 10000,
            montantDepassementPlafond: 0,
          },
        ],
      );

      await expect(
        service.verifierAvantValidation(
          tx as unknown as Prisma.TransactionClient,
          21,
        ),
      ).rejects.toThrow('montantActe=-1.00');
    });

    it('accepte une facture sans ligne lorsque les montants sont saisis manuellement', async () => {
      const { service, tx } = creerServiceControle(
        { montantTotal: 0, total100Cem: 0, totalDepassement: 0 },
        [],
      );

      await expect(
        service.verifierAvantValidation(
          tx as unknown as Prisma.TransactionClient,
          21,
        ),
      ).resolves.toBeUndefined();
    });
  });

  it('refuse la suppression T6 lorsque la facture est SUPPRIMEE', async () => {
    const { service, tx, mouvements } = creerService(
      StatutFacture.SUPPRIMEE,
    );

    await expect(
      service.supprimer(21, 8, {
        id: 5,
        role: RoleUtilisateur.OPERATEUR,
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(tx.factureGlobale.updateMany).not.toHaveBeenCalled();
    expect(tx.factureIndividuelle.delete).not.toHaveBeenCalled();
    expect(mouvements.ecrire).not.toHaveBeenCalled();
  });
});
