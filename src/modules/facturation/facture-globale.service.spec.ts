import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import {
  RoleUtilisateur,
  StatutFacture,
  TypeMouvement,
} from '../../generated/prisma/enums.js';
import { RefSocialService } from '../../facturation/ref-social/ref-social.service.js';
import { RegleService } from '../../regles-prise-en-charge/regle.service.js';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { CreerFactureGlobaleDto } from './dtos/creer-facture-globale.dto.js';
import { FactureGlobaleService } from './facture-globale.service.js';
import { FactureCalculService } from './facture-calcul.service.js';
import { FactureIndividuelleService } from './facture-individuelle.service.js';
import { MouvementFactureService } from './mouvement-facture.service.js';
import { FactureWorkflowService } from './facture-workflow.service.js';

vi.mock('../../infrastructure/prisma/prisma.service.js', () => ({
  PrismaService: class PrismaService {},
}));

describe('FactureGlobaleService', () => {
  const prestataire = { id: 7, nom: 'Clinique Exemple' };
  const dateCreation = new Date('2026-12-31T22:30:00.000Z');
  const donnees: CreerFactureGlobaleDto = {
    prestataireId: 7,
    numFacture: 'FAC-001',
    dateFacture: '2026-12-20',
    dateReception: '2026-12-31',
    moisPrestation: '2026-12-28',
    refAgence: 'AG-01',
    montantTotal: 6_000_000,
    remarque: 'Vérifiée physiquement',
  };
  const factureCreee = {
    id: 42,
    refSociale: 'F27/001',
    annee: 2027,
    dateReception: new Date('2026-12-31T00:00:00.000Z'),
    numFacture: donnees.numFacture,
    dateFacture: new Date('2026-12-20T00:00:00.000Z'),
    moisPrestation: new Date('2026-12-01T00:00:00.000Z'),
    refAgence: donnees.refAgence,
    remarque: donnees.remarque,
    montantTotal: new Prisma.Decimal('6000000.00'),
    total100Cem: new Prisma.Decimal(0),
    totalDepassement: new Prisma.Decimal(0),
    tauxCem: new Prisma.Decimal(80),
    statut: StatutFacture.ENREGISTREE,
    dateValidation: null,
    prestataireId: 7,
    enregistreParId: 3,
    valideParId: null,
    createdAt: dateCreation,
    updatedAt: dateCreation,
    prestataire,
  };

  const trouverPrestataire = vi.fn();
  const creerFacture = vi.fn();
  const trouverDoublons = vi.fn();
  const creerMouvement = vi.fn();
  const executerTransaction = vi.fn();
  const genererReference = vi.fn();
  const obtenirTaux = vi.fn();
  const verifierTotaux = vi.fn();
  const ecrireMouvement = vi.fn();
  let factureWorkflow: Omit<typeof factureCreee, 'statut'> & {
    statut: StatutFacture;
  } = factureCreee;
  const tx = {
    factureGlobale: {
      create: creerFacture,
      findMany: trouverDoublons,
      findUnique: vi.fn(async () => factureWorkflow),
      updateMany: vi.fn(async ({ data }: { data: Partial<typeof factureCreee> }) => {
        factureWorkflow = { ...factureWorkflow, ...data };
        return { count: 1 };
      }),
    },
    mouvementFacture: { create: creerMouvement },
  } as unknown as Prisma.TransactionClient;

  let service: FactureGlobaleService;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(dateCreation);
    trouverPrestataire.mockReset().mockResolvedValue(prestataire);
    creerFacture.mockReset().mockResolvedValue(factureCreee);
    trouverDoublons.mockReset().mockResolvedValue([]);
    creerMouvement.mockReset().mockResolvedValue({ id: 4 });
    factureWorkflow = factureCreee;
    verifierTotaux.mockReset().mockResolvedValue(undefined);
    ecrireMouvement.mockReset().mockImplementation(
      async (_transaction: Prisma.TransactionClient, donnees: unknown) =>
        creerMouvement({ data: donnees }),
    );
    executerTransaction
      .mockReset()
      .mockImplementation(
        async (
          action: (transaction: Prisma.TransactionClient) => Promise<unknown>,
        ) => action(tx),
      );
    genererReference.mockReset().mockResolvedValue('F27/001');
    obtenirTaux.mockReset().mockResolvedValue(new Prisma.Decimal(80));

    const prisma = {
      prestataire: { findFirst: trouverPrestataire },
      $transaction: executerTransaction,
    } as unknown as PrismaService;
    const refSocialService = {
      genererProchaine: genererReference,
    } as unknown as RefSocialService;
    const regleService = {
      obtenirTauxCemRepartition: obtenirTaux,
    } as unknown as RegleService;

    service = new FactureGlobaleService(
      prisma,
      refSocialService,
      regleService,
      new FactureWorkflowService(),
      { ecrire: ecrireMouvement } as unknown as MouvementFactureService,
      new FactureCalculService(),
      { verifierAvantValidation: verifierTotaux } as unknown as FactureIndividuelleService,
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('enregistre les informations et le premier mouvement dans la même transaction', async () => {
    const resultat = await service.creer(donnees, 3);

    expect(obtenirTaux).toHaveBeenCalledWith(
      new Date('2027-01-01T00:00:00.000Z'),
    );
    expect(obtenirTaux.mock.invocationCallOrder[0]).toBeLessThan(
      executerTransaction.mock.invocationCallOrder[0],
    );
    expect(genererReference).toHaveBeenCalledWith(tx, 2027);
    expect(creerFacture).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          refSociale: 'F27/001',
          annee: 2027,
          tauxCem: new Prisma.Decimal(80),
          statut: StatutFacture.ENREGISTREE,
          total100Cem: 0,
          totalDepassement: 0,
          enregistreParId: 3,
          moisPrestation: new Date('2026-12-01T00:00:00.000Z'),
        }),
      }),
    );
    expect(creerMouvement).toHaveBeenCalledWith({
      data: {
        factureGlobaleId: factureCreee.id,
        type: TypeMouvement.ENREGISTREMENT,
        effectueParId: 3,
        remarque: donnees.remarque,
      },
    });
    expect(resultat.avertissements).toEqual([]);
    expect(resultat.prestataire).toEqual(prestataire);
  });

  it('retourne un avertissement si une facture similaire non annulée existe', async () => {
    trouverDoublons.mockResolvedValue([{ refSociale: 'F26/019' }]);

    const resultat = await service.creer(donnees, 3);

    expect(resultat.avertissements).toEqual([
      'Une facture portant le même numéro existe déjà sous la référence F26/019.',
    ]);
  });

  it('rejette un prestataire inconnu avant de demander un taux ou une référence', async () => {
    trouverPrestataire.mockResolvedValue(null);

    await expect(service.creer(donnees, 3)).rejects.toThrow(NotFoundException);
    expect(obtenirTaux).not.toHaveBeenCalled();
    expect(executerTransaction).not.toHaveBeenCalled();
  });

  it('répond 422 si aucune règle ne couvre la date sans ouvrir de transaction', async () => {
    obtenirTaux.mockRejectedValue(new NotFoundException('Règle absente'));

    await expect(service.creer(donnees, 3)).rejects.toThrow(
      UnprocessableEntityException,
    );
    expect(executerTransaction).not.toHaveBeenCalled();
    expect(genererReference).not.toHaveBeenCalled();
  });

  it('inclut la confirmation de désaccord dans le mouvement ENVOI_VALIDATION', async () => {
    verifierTotaux.mockResolvedValue(
      'Écart justifié\nÉcart de totaux confirmé : montantActe=-1.00.',
    );

    await service.envoyerValidation(
      factureCreee.id,
      { id: 3, role: RoleUtilisateur.OPERATEUR },
      { confirmerEcartTotaux: true, remarque: 'Écart justifié' },
    );

    expect(verifierTotaux).toHaveBeenCalledWith(
      tx,
      factureCreee.id,
      true,
      'Écart justifié',
    );
    expect(ecrireMouvement).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        type: TypeMouvement.ENVOI_VALIDATION,
        remarque: expect.stringContaining('Écart de totaux confirmé'),
      }),
    );
  });

  it('inclut la confirmation de désaccord dans le mouvement VALIDATION', async () => {
    factureWorkflow = { ...factureCreee, statut: StatutFacture.EN_VALIDATION };
    verifierTotaux.mockResolvedValue(
      'Écart justifié\nÉcart de totaux confirmé : montantActe=-1.00.',
    );

    await service.valider(
      factureCreee.id,
      { id: 4, role: RoleUtilisateur.ADJOINT },
      { confirmerEcartTotaux: true, remarque: 'Écart justifié' },
    );

    expect(ecrireMouvement).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        type: TypeMouvement.VALIDATION,
        remarque: expect.stringContaining('Écart de totaux confirmé'),
      }),
    );
  });
});
