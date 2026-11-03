import { vi } from 'vitest';
vi.hoisted(() => {
  process.env.NODE_ENV = 'development';
});

import { ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { Prisma } from '../../generated/prisma/client.js';
import {
  RoleUtilisateur,
  StatutFacture,
  TypeMouvement,
} from '../../generated/prisma/enums.js';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { FacturationModule } from './facturation.module.js';

const TESTS_HTTP_ACTIFS =
  process.env.FACTURATION_TESTS_POSTGRES === 'true' &&
  process.env.DB_NAME?.toLowerCase().includes('test') === true &&
  Number.isInteger(Number(process.env.FACTURATION_TEST_PRESTATAIRE_ID)) &&
  Number(process.env.FACTURATION_TEST_PRESTATAIRE_ID) > 0;

describe.skipIf(!TESTS_HTTP_ACTIFS)(
  'Routes HTTP du workflow Facturation',
  () => {
    let prisma: PrismaService;
    let application: INestApplication;
    let prestataireId: number;
    let identifiantActeur: number | undefined;
    let operateurId: number;
    let adjointId: number;
    let chefId: number;
    let identifiantsUtilisateurs: number[] = [];
    let identifiantsFactures: number[] = [];
    let compteur: number;

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
            nom: `E2E opérateur ${Date.now()}`,
            role: RoleUtilisateur.OPERATEUR,
          },
          select: { id: true },
        }),
        prisma.utilisateur.create({
          data: {
            nom: `E2E adjoint ${Date.now()}`,
            role: RoleUtilisateur.ADJOINT,
          },
          select: { id: true },
        }),
        prisma.utilisateur.create({
          data: { nom: `E2E chef ${Date.now()}`, role: RoleUtilisateur.CHEF },
          select: { id: true },
        }),
      ]);
      operateurId = utilisateurs[0].id;
      adjointId = utilisateurs[1].id;
      chefId = utilisateurs[2].id;
      identifiantsUtilisateurs = utilisateurs.map(({ id }) => id);
      identifiantsFactures = [];
      compteur = 0;

      const moduleApplication = await Test.createTestingModule({
        imports: [FacturationModule],
      })
        .overrideProvider(PrismaService)
        .useValue(prisma)
        .compile();
      application = moduleApplication.createNestApplication();
      application.use(
        (requete: Request, _reponse: Response, suivant: NextFunction) => {
          if (identifiantActeur !== undefined) {
            Object.assign(requete, { user: { id: identifiantActeur } });
          }
          suivant();
        },
      );
      application.useGlobalPipes(
        new ValidationPipe({ transform: true, whitelist: true }),
      );
      await application.init();
    });

    afterAll(async () => {
      if (identifiantsFactures.length > 0) {
        await prisma.mouvementFacture.deleteMany({
          where: { factureGlobaleId: { in: identifiantsFactures } },
        });
        await prisma.factureGlobale.deleteMany({
          where: { id: { in: identifiantsFactures } },
        });
      }
      if (identifiantsUtilisateurs.length > 0) {
        await prisma.utilisateur.deleteMany({
          where: { id: { in: identifiantsUtilisateurs } },
        });
      }
      if (application !== undefined) await application.close();
      await prisma.$disconnect();
    });

    async function creerFacture(
      statut: StatutFacture = StatutFacture.ENREGISTREE,
    ): Promise<number> {
      compteur += 1;
      const date = new Date('2026-01-10T00:00:00.000Z');
      const facture = await prisma.factureGlobale.create({
        data: {
          refSociale: `E2E-WF-${process.pid}-${Date.now()}-${compteur}`,
          annee: 2026,
          dateReception: date,
          numFacture: `E2E-${compteur}`,
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
          enregistreParId: operateurId,
          valideParId:
            statut === StatutFacture.VALIDEE || statut === StatutFacture.SORTIE
              ? adjointId
              : null,
        },
        select: { id: true },
      });
      identifiantsFactures.push(facture.id);
      await prisma.mouvementFacture.create({
        data: {
          factureGlobaleId: facture.id,
          type: TypeMouvement.ENREGISTREMENT,
          effectueParId: operateurId,
        },
      });
      return facture.id;
    }

    it('retourne une facture au prestataire', async () => {
      identifiantActeur = operateurId;
      const id = await creerFacture();
      await request(application.getHttpServer())
        .post(`/factures/${id}/retour-prestataire`)
        .send({ remarque: 'Pièce illisible' })
        .expect(200)
        .expect(({ body }) => {
          expect(body.statut).toBe(StatutFacture.RETOURNEE);
        });
    });

    it('réceptionne une facture corrigée', async () => {
      identifiantActeur = operateurId;
      const id = await creerFacture(StatutFacture.RETOURNEE);
      await request(application.getHttpServer())
        .post(`/factures/${id}/reception-apres-modification`)
        .send({ remarque: 'Correction reçue' })
        .expect(200)
        .expect(({ body }) => {
          expect(body.statut).toBe(StatutFacture.ENREGISTREE);
        });
    });

    it('envoie une facture en validation', async () => {
      identifiantActeur = operateurId;
      const id = await creerFacture();
      await request(application.getHttpServer())
        .post(`/factures/${id}/envoi-validation`)
        .send({ destinataireId: adjointId })
        .expect(200)
        .expect(({ body }) => {
          expect(body.statut).toBe(StatutFacture.EN_VALIDATION);
        });
    });

    it('valide une facture', async () => {
      identifiantActeur = adjointId;
      const id = await creerFacture(StatutFacture.EN_VALIDATION);
      await request(application.getHttpServer())
        .post(`/factures/${id}/validation`)
        .send({ remarque: 'Contrôle effectué' })
        .expect(200)
        .expect(({ body }) => {
          expect(body.statut).toBe(StatutFacture.VALIDEE);
          expect(body.dateValidation).not.toBeNull();
        });
    });

    it('retourne une facture pour correction', async () => {
      identifiantActeur = chefId;
      const id = await creerFacture(StatutFacture.EN_VALIDATION);
      await request(application.getHttpServer())
        .post(`/factures/${id}/retour-correction`)
        .send({ remarque: 'Montant à vérifier' })
        .expect(200)
        .expect(({ body }) => {
          expect(body.statut).toBe(StatutFacture.ENREGISTREE);
        });
    });

    it('marque une facture comme sortie', async () => {
      identifiantActeur = operateurId;
      const id = await creerFacture(StatutFacture.VALIDEE);
      await request(application.getHttpServer())
        .post(`/factures/${id}/sortie`)
        .send({ service: 'CONTROLE' })
        .expect(200)
        .expect(({ body }) => {
          expect(body.statut).toBe(StatutFacture.SORTIE);
        });
    });

    it('annule une facture', async () => {
      identifiantActeur = adjointId;
      const id = await creerFacture();
      await request(application.getHttpServer())
        .post(`/factures/${id}/demande-suppression`)
        .send({ motif: 'Erreur de saisie' })
        .expect(200)
        .expect(({ body }) => {
          expect(body.statut).toBe(StatutFacture.SUPPRESSION_DEMANDEE);
        });
      await request(application.getHttpServer())
        .post(`/factures/${id}/validation-suppression`)
        .send({})
        .expect(200)
        .expect(({ body }) => expect(body.statut).toBe(StatutFacture.SUPPRIMEE));
    });

    it('modifie les informations globales', async () => {
      identifiantActeur = operateurId;
      const id = await creerFacture();
      await request(application.getHttpServer())
        .patch(`/factures/${id}`)
        .send({ numFacture: 'E2E-MODIFIEE' })
        .expect(200)
        .expect(({ body }) => {
          expect(body.numFacture).toBe('E2E-MODIFIEE');
        });
    });

    it('modifie les montants et retourne les parts calculées sérialisées', async () => {
      identifiantActeur = operateurId;
      const id = await creerFacture();
      await request(application.getHttpServer())
        .patch(`/factures/${id}/montants`)
        .send({ total100Cem: 200_000, totalDepassement: 100_000 })
        .expect(200)
        .expect(({ body }) => {
          expect(body.partCem).toBe('560000.00');
          expect(body.partAgent).toBe('140000.00');
          expect(body.totalChargeAgent).toBe('240000.00');
        });
    });

    it('répond 401 sans utilisateur', async () => {
      identifiantActeur = undefined;
      const nodeEnvPrecedent = process.env.NODE_ENV;
      const identifiantTestPrecedent =
        process.env.FACTURATION_UTILISATEUR_TEST_ID;
      process.env.NODE_ENV = 'test';
      delete process.env.FACTURATION_UTILISATEUR_TEST_ID;
      try {
        await request(application.getHttpServer())
          .post('/factures/999999/validation')
          .send({})
          .expect(401);
      } finally {
        if (nodeEnvPrecedent === undefined) delete process.env.NODE_ENV;
        else process.env.NODE_ENV = nodeEnvPrecedent;
        if (identifiantTestPrecedent === undefined) {
          delete process.env.FACTURATION_UTILISATEUR_TEST_ID;
        } else {
          process.env.FACTURATION_UTILISATEUR_TEST_ID =
            identifiantTestPrecedent;
        }
      }
    });

    it('répond 403 pour un rôle insuffisant', async () => {
      process.env.PERMISSIONS_ROLES_ACTIVES = 'true';
      identifiantActeur = operateurId;
      const id = await creerFacture(StatutFacture.EN_VALIDATION);
      await request(application.getHttpServer())
        .post(`/factures/${id}/validation`)
        .send({})
        .expect(403);
    });

    it.each([
      RoleUtilisateur.ADJOINT,
      RoleUtilisateur.CHEF,
      RoleUtilisateur.OPERATEUR,
    ])(
      'refuse le rôle insuffisant %s sur une action réservée',
      async (role) => {
        process.env.PERMISSIONS_ROLES_ACTIVES = 'true';
        const routesParRole: Record<RoleUtilisateur, string> = {
          [RoleUtilisateur.ADJOINT]: '/factures/2147483000/sortie',
          [RoleUtilisateur.CHEF]: '/factures/2147483000/retour-prestataire',
          [RoleUtilisateur.OPERATEUR]: '/factures/2147483000/demande-suppression',
        };
        identifiantActeur =
          role === RoleUtilisateur.OPERATEUR
            ? operateurId
            : role === RoleUtilisateur.ADJOINT
              ? adjointId
              : chefId;
        await request(application.getHttpServer())
          .post(routesParRole[role])
          .send({ remarque: 'Test de rôle', service: 'CONTROLE' })
          .expect(403);
      },
    );

    it('répond 404 pour une facture absente', async () => {
      identifiantActeur = operateurId;
      await request(application.getHttpServer())
        .post('/factures/2147483000/retour-prestataire')
        .send({ remarque: 'Test' })
        .expect(404);
    });

    it('répond 404 pour un destinataire inexistant', async () => {
      identifiantActeur = operateurId;
      const id = await creerFacture();
      await request(application.getHttpServer())
        .post(`/factures/${id}/envoi-validation`)
        .send({ destinataireId: 2147483000 })
        .expect(404);
    });

    it('répond 409 pour une transition interdite', async () => {
      identifiantActeur = operateurId;
      const id = await creerFacture(StatutFacture.VALIDEE);
      await request(application.getHttpServer())
        .post(`/factures/${id}/retour-prestataire`)
        .send({ remarque: 'Test' })
        .expect(409);
    });

    it('répond 400 pour un payload invalide', async () => {
      identifiantActeur = operateurId;
      const id = await creerFacture();
      await request(application.getHttpServer())
        .post(`/factures/${id}/retour-prestataire`)
        .send({})
        .expect(400);
    });

    it('répond 400 si les montants pris en charge dépassent le montant total', async () => {
      identifiantActeur = operateurId;
      const id = await creerFacture();
      await request(application.getHttpServer())
        .patch(`/factures/${id}/montants`)
        .send({ total100Cem: 800_000, totalDepassement: 300_000 })
        .expect(400);
    });
  },
);
