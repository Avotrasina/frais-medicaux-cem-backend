import { vi } from 'vitest';
vi.hoisted(() => {
  process.env.NODE_ENV = 'development';
});

import { ConflictException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import {
  RoleUtilisateur,
  ServiceSortie,
  StatutFacture,
  TypeMouvement,
} from '../../generated/prisma/enums.js';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { RefSocialService } from '../../facturation/ref-social/ref-social.service.js';
import { RegleService } from '../../regles-prise-en-charge/regle.service.js';
import { FactureGlobaleService } from './facture-globale.service.js';
import { FactureCalculService } from './facture-calcul.service.js';
import { FactureIndividuelleService } from './facture-individuelle.service.js';
import { MouvementFactureService } from './mouvement-facture.service.js';
import { FactureWorkflowService } from './facture-workflow.service.js';

const TESTS_POSTGRES_ACTIFS =
  process.env.FACTURATION_TESTS_POSTGRES === 'true' &&
  process.env.DB_NAME?.toLowerCase().includes('test') === true &&
  Number.isInteger(Number(process.env.FACTURATION_TEST_PRESTATAIRE_ID)) &&
  Number(process.env.FACTURATION_TEST_PRESTATAIRE_ID) > 0;

describe.skipIf(!TESTS_POSTGRES_ACTIFS)(
  'Workflow Facturation sur PostgreSQL',
  () => {
    type UtilisateurOperateur = {
      id: number;
      role: typeof RoleUtilisateur.OPERATEUR;
    };
    type UtilisateurAdjoint = {
      id: number;
      role: typeof RoleUtilisateur.ADJOINT;
    };
    type UtilisateurChef = { id: number; role: typeof RoleUtilisateur.CHEF };

    let prisma: PrismaService;
    let service: FactureGlobaleService;
    let prestataireId: number;
    let operateur: UtilisateurOperateur;
    let adjoint: UtilisateurAdjoint;
    let chef: UtilisateurChef;
    let facturesCreees: number[] = [];
    let identifiantsUtilisateurs: number[] = [];
    let compteurReference: number;

    beforeAll(async () => {
      prisma = new PrismaService();
      await prisma.$connect();
      prestataireId = Number(process.env.FACTURATION_TEST_PRESTATAIRE_ID);
      const prestataire = await prisma.prestataire.findFirst({
        where: { id: prestataireId },
        select: { id: true },
      });
      if (prestataire === null) {
        throw new Error('Le prestataire de la base de test est introuvable.');
      }

      const utilisateurs = await Promise.all([
        prisma.utilisateur.create({
          data: {
            nom: `Test workflow opérateur ${Date.now()}`,
            role: RoleUtilisateur.OPERATEUR,
          },
          select: { id: true, role: true },
        }),
        prisma.utilisateur.create({
          data: {
            nom: `Test workflow adjoint ${Date.now()}`,
            role: RoleUtilisateur.ADJOINT,
          },
          select: { id: true, role: true },
        }),
        prisma.utilisateur.create({
          data: {
            nom: `Test workflow chef ${Date.now()}`,
            role: RoleUtilisateur.CHEF,
          },
          select: { id: true, role: true },
        }),
      ]);
      operateur = utilisateurs[0] as UtilisateurOperateur;
      adjoint = utilisateurs[1] as UtilisateurAdjoint;
      chef = utilisateurs[2] as UtilisateurChef;
      identifiantsUtilisateurs = utilisateurs.map(({ id }) => id);
      facturesCreees = [];
      compteurReference = 0;
      service = new FactureGlobaleService(
        prisma,
        new RefSocialService(),
        new RegleService(prisma),
        new FactureWorkflowService(),
        new MouvementFactureService(),
        new FactureCalculService(),
        { verifierAvantValidation: vi.fn().mockResolvedValue(undefined) } as unknown as FactureIndividuelleService,
      );
    });

    afterAll(async () => {
      if (facturesCreees.length > 0) {
        await prisma.mouvementFacture.deleteMany({
          where: { factureGlobaleId: { in: facturesCreees } },
        });
        await prisma.factureGlobale.deleteMany({
          where: { id: { in: facturesCreees } },
        });
      }
      if (identifiantsUtilisateurs.length > 0) {
        await prisma.utilisateur.deleteMany({
          where: { id: { in: identifiantsUtilisateurs } },
        });
      }
      await prisma.$disconnect();
    });

    async function creerFacture(
      statut: StatutFacture = StatutFacture.ENREGISTREE,
    ): Promise<{ id: number; refSociale: string }> {
      compteurReference += 1;
      const date = new Date('2026-01-10T00:00:00.000Z');
      const facture = await prisma.factureGlobale.create({
        data: {
          refSociale: `IT-WF-${process.pid}-${Date.now()}-${compteurReference}`,
          annee: 2026,
          dateReception: date,
          numFacture: `IT-${compteurReference}`,
          dateFacture: date,
          moisPrestation: new Date('2026-01-01T00:00:00.000Z'),
          montantTotal: new Prisma.Decimal('1000000.00'),
          total100Cem: new Prisma.Decimal('0.00'),
          totalDepassement: new Prisma.Decimal('0.00'),
          tauxCem: new Prisma.Decimal('80.00'),
          statut,
          dateValidation:
            statut === StatutFacture.VALIDEE || statut === StatutFacture.SORTIE
              ? date
              : null,
          prestataireId,
          enregistreParId: operateur.id,
          valideParId:
            statut === StatutFacture.VALIDEE || statut === StatutFacture.SORTIE
              ? adjoint.id
              : null,
        },
        select: { id: true, refSociale: true },
      });
      facturesCreees.push(facture.id);
      await prisma.mouvementFacture.create({
        data: {
          factureGlobaleId: facture.id,
          type: TypeMouvement.ENREGISTREMENT,
          effectueParId: operateur.id,
        },
      });
      return facture;
    }

    it('effectue le parcours ENREGISTREE → EN_VALIDATION → VALIDEE → SORTIE et conserve l’ordre des mouvements', async () => {
      const facture = await creerFacture();
      await service.envoyerValidation(facture.id, operateur, {
        destinataireId: adjoint.id,
      });
      await service.valider(facture.id, adjoint, {});
      await service.sortir(facture.id, operateur, {
        service: ServiceSortie.CONTROLE,
      });

      const mouvements = await prisma.mouvementFacture.findMany({
        where: { factureGlobaleId: facture.id },
        orderBy: { id: 'asc' },
        select: { type: true },
      });
      expect(mouvements.map(({ type }) => type)).toEqual([
        TypeMouvement.ENREGISTREMENT,
        TypeMouvement.ENVOI_VALIDATION,
        TypeMouvement.VALIDATION,
        TypeMouvement.SORTIE,
      ]);
    });

    it('retourne au prestataire puis réceptionne la correction sans changer la référence sociale', async () => {
      const facture = await creerFacture();
      await service.retourPrestataire(facture.id, operateur, {
        remarque: 'Document illisible',
      });
      const resultat = await service.receptionApresModification(
        facture.id,
        operateur,
        { remarque: 'Document corrigé reçu' },
      );

      expect(resultat.refSociale).toBe(facture.refSociale);
      expect(resultat.statut).toBe(StatutFacture.ENREGISTREE);
    });

    it('retourne pour correction à l’utilisateur enregistreur', async () => {
      const facture = await creerFacture(StatutFacture.EN_VALIDATION);
      await service.retournerCorrection(facture.id, chef, {
        remarque: 'Montants à vérifier',
      });
      const mouvement = await prisma.mouvementFacture.findFirstOrThrow({
        where: {
          factureGlobaleId: facture.id,
          type: TypeMouvement.RETOUR_POUR_CORRECTION,
        },
      });

      expect(mouvement.adresseAId).toBe(operateur.id);
    });

    it.each([
      StatutFacture.ENREGISTREE,
      StatutFacture.EN_VALIDATION,
      StatutFacture.RETOURNEE,
      StatutFacture.VALIDEE,
      StatutFacture.SORTIE,
    ])('demande puis valide la suppression d’une facture au statut %s', async (statut) => {
      const facture = await creerFacture(statut);
      await service.demanderSuppression(facture.id, adjoint, { motif: 'Suppression de test' });
      const resultat = await service.validerSuppression(facture.id, adjoint, {});
      expect(resultat.statut).toBe(StatutFacture.SUPPRIMEE);
    });

    it('modifie une facture validée, invalide sa validation et écrit le motif et les changements', async () => {
      const facture = await creerFacture(StatutFacture.VALIDEE);
      await service.reouvrir(facture.id, adjoint, { motif: 'Correction nécessaire' });
      const resultat = await service.modifierMontants(facture.id, operateur, {
        montantTotal: 1_100_000,
        motif: 'Correction du montant facturé',
      });
      const mouvement = await prisma.mouvementFacture.findFirstOrThrow({
        where: {
          factureGlobaleId: facture.id,
          type: TypeMouvement.MODIFICATION,
        },
      });

      expect(resultat.statut).toBe(StatutFacture.A_REVALIDER);
      expect(resultat.dateValidation).toBeNull();
      expect(resultat.valideParId).toBeNull();
      expect(mouvement.remarque).toContain('Correction du montant facturé');
      expect(mouvement.remarque).toContain(
        'montantTotal : 1000000.00 vers 1100000.00',
      );
    });

    it('refuse une modification en EN_VALIDATION et en SUPPRIMEE, ainsi que les montants en RETOURNEE', async () => {
      const enValidation = await creerFacture(StatutFacture.EN_VALIDATION);
      const annulee = await creerFacture(StatutFacture.SUPPRIMEE);
      const retournee = await creerFacture(StatutFacture.RETOURNEE);

      await expect(
        service.modifierInformations(enValidation.id, adjoint, {
          numFacture: 'INTERDIT',
        }),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.modifierInformations(annulee.id, adjoint, {
          numFacture: 'INTERDIT',
        }),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.modifierMontants(retournee.id, operateur, { montantTotal: 2 }),
      ).rejects.toThrow(ConflictException);
    });

    it('refuse une modification sans changement et ne crée pas de mouvement pour une édition simple', async () => {
      const facture = await creerFacture();
      await expect(
        service.modifierInformations(facture.id, operateur, {
          numFacture: `IT-${compteurReference}`,
        }),
      ).rejects.toThrow('ne change aucune valeur');

      await service.modifierInformations(facture.id, operateur, {
        numFacture: 'IT-MODIFICATION-SIMPLE',
      });
      const mouvements = await prisma.mouvementFacture.count({
        where: { factureGlobaleId: facture.id },
      });
      expect(mouvements).toBe(1);
    });

    it('annule la transaction si l’écriture du mouvement échoue', async () => {
      const facture = await creerFacture();
      const serviceAvecErreurMouvement = new FactureGlobaleService(
        prisma,
        new RefSocialService(),
        new RegleService(prisma),
        new FactureWorkflowService(),
        {
          ecrire: async () => {
            throw new Error('Échec simulé du mouvement');
          },
        } as unknown as MouvementFactureService,
        new FactureCalculService(),
        { verifierAvantValidation: vi.fn().mockResolvedValue(undefined) } as unknown as FactureIndividuelleService,
      );

      await expect(
        serviceAvecErreurMouvement.retourPrestataire(facture.id, operateur, {
          remarque: 'Retour de test',
        }),
      ).rejects.toThrow('Échec simulé du mouvement');
      const factureEnBase = await prisma.factureGlobale.findUniqueOrThrow({
        where: { id: facture.id },
      });
      expect(factureEnBase.statut).toBe(StatutFacture.ENREGISTREE);
    });

    it('ne valide qu’une seule des deux actions concurrentes, répétée dix fois', async () => {
      for (let essai = 0; essai < 10; essai += 1) {
        const facture = await creerFacture(StatutFacture.EN_VALIDATION);
        const resultats = await Promise.allSettled([
          service.valider(facture.id, adjoint, {}),
          service.valider(facture.id, chef, {}),
        ]);
        expect(
          resultats.filter(({ status }) => status === 'fulfilled'),
        ).toHaveLength(1);
        expect(
          resultats.filter(({ status }) => status === 'rejected'),
        ).toHaveLength(1);
        const rejet = resultats.find(({ status }) => status === 'rejected');
        expect(rejet?.status).toBe('rejected');
        if (rejet?.status === 'rejected') {
          expect(rejet.reason).toBeInstanceOf(ConflictException);
          expect((rejet.reason as ConflictException).getStatus()).toBe(409);
        }
        const validations = await prisma.mouvementFacture.count({
          where: {
            factureGlobaleId: facture.id,
            type: TypeMouvement.VALIDATION,
          },
        });
        expect(validations).toBe(1);
      }
    }, 60_000);
  },
);
