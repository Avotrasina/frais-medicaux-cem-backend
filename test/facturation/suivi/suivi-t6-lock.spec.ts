import { Prisma } from '../../../src/generated/prisma/client.js';
import {
  AgentType,
  PorteePlafond,
  RegimeActe,
  RoleUtilisateur,
  StatutFacture,
  TypeRegle,
  UnitePlafond,
} from '../../../src/generated/prisma/enums.js';
import { FactureCalculService } from '../../../src/modules/facturation/shared/facture-calcul.service.js';
import { FactureIndividuelleService } from '../../../src/modules/facturation/factures/individuelle/facture-individuelle.service.js';
import { FacturePermissionsService } from '../../../src/modules/facturation/shared/facture-permissions.service.js';
import { FactureWorkflowService } from '../../../src/modules/facturation/factures/workflow/facture-workflow.service.js';
import { MouvementFactureService } from '../../../src/modules/facturation/shared/mouvement-facture.service.js';
import { SuiviService } from '../../../src/modules/facturation/suivi/suivi.service.js';
import { SuiviCalculService } from '../../../src/modules/facturation/suivi/suivi-calcul.service.js';
import { PlafondResolutionService } from '../../../src/modules/plafond/plafond-resolution.service.js';
import type { LigneSuiviCalculInput } from '../../../src/modules/facturation/suivi/suivi-calcul.service.js';
import { RegleService } from '../../../src/regles-prise-en-charge/regle.service.js';

vi.mock('../../../src/infrastructure/prisma/prisma.service.js', () => ({
  PrismaService: class PrismaService {},
}));

describe('Verrou T5_x piloté par les lignes T6', () => {
  it('verrouille T5_x après création T6 de 100000 avec dépassement saisi 500, puis le libère à la suppression', async () => {
    const dateActe = new Date('2026-01-15T00:00:00.000Z');
    const facture = {
      id: 20,
      statut: StatutFacture.ENREGISTREE,
      moisPrestation: new Date('2026-01-01T00:00:00.000Z'),
      dateReception: new Date('2026-01-31T00:00:00.000Z'),
      refSociale: 'F26/001',
      prestataire: { nom: 'Clinique Exemple' },
    };
    const beneficiaire = {
      id: 9,
      idp: 'IDP-09',
      observationIDP: null,
      personne: {
        nom: 'Test',
        prenom: 'Bénéficiaire',
        agent: { agentType: AgentType.AGENT_ACTIF },
        familleAgent: null,
      },
    };
    const acte = {
      id: 3,
      code: 'ACT-03',
      nomActe: 'Consultation',
      categorieActeId: 2,
      regime: RegimeActe.NORMAL,
      categorieActe: { nomCategorie: 'Consultations' },
    };
    const ligneSuivi = {
      id: 11,
      factureGlobaleId: facture.id,
      beneficiaireId: beneficiaire.id,
      acteId: acte.id,
      dateActe,
      libelle: 'Consultation',
      montantActe: new Prisma.Decimal('100000.00'),
      factureGlobale: {
        refSociale: facture.refSociale,
        prestataire: facture.prestataire,
        statut: facture.statut,
      },
      acte: {
        code: acte.code,
        nomActe: acte.nomActe,
        categorieActeId: acte.categorieActeId,
        categorieActe: acte.categorieActe,
      },
    };
    const regle = {
      type: TypeRegle.REPARTITION_AGENT_CEM,
      tauxCem: new Prisma.Decimal(80),
    };
    let ligneT6: Record<string, unknown> | null = null;

    const ligneFacture = () => ({
      id: 31,
      factureGlobaleId: facture.id,
      numLigne: 1,
      libelle: 'Consultation',
      dateActe,
      acteId: acte.id,
      beneficiaireId: beneficiaire.id,
      montantActe: new Prisma.Decimal('100000.00'),
      montantCemIntegral: new Prisma.Decimal('0.00'),
      montantDepassementActe: new Prisma.Decimal('0.00'),
      montantDepassementPlafond: new Prisma.Decimal('0.00'),
      observationDepassement: null,
      tauxCem: new Prisma.Decimal(80),
      priseEnChargeId: null,
      refPaie: null,
      moisAffectation: null,
      beneficiaire,
      factureGlobale: facture,
    });

    const findFactureLine = vi.fn(
      async (args: { orderBy?: unknown; where?: { id?: number } }) => {
        if (args.orderBy !== undefined) return null;
        if (args.where?.id !== undefined)
          return ligneT6 === null ? null : ligneFacture();
        return ligneT6 === null ? null : { id: 31 };
      },
    );
    const tx = {
      factureGlobale: { findUnique: vi.fn().mockResolvedValue(facture) },
      beneficiaire: { findUnique: vi.fn().mockResolvedValue(beneficiaire) },
      acte: { findUnique: vi.fn().mockResolvedValue(acte) },
      factureIndividuelle: {
        findFirst: findFactureLine,
        create: vi.fn(async () => {
          ligneT6 = ligneFacture();
          return ligneFacture();
        }),
        findUniqueOrThrow: vi.fn(async () => ligneFacture()),
        delete: vi.fn(async () => {
          ligneT6 = null;
          return ligneFacture();
        }),
      },
      attestation: { findUnique: vi.fn().mockResolvedValue(null) },
      ligneSuivi: {
        findFirst: vi.fn().mockResolvedValue({ id: ligneSuivi.id }),
      },
    };
    const prisma = {
      $transaction: vi.fn(
        async (callback: (client: typeof tx) => Promise<unknown>) =>
          callback(tx),
      ),
      factureGlobale: { findUnique: vi.fn().mockResolvedValue(facture) },
      beneficiaire: { findUnique: vi.fn().mockResolvedValue(beneficiaire) },
      acte: { findUnique: vi.fn().mockResolvedValue(acte) },
      ligneSuivi: { findMany: vi.fn().mockResolvedValue([ligneSuivi]) },
      plafond: {
        findFirst: vi.fn(
          async (args: {
            where: {
              acteID: number | null;
              categorieActeID: number | null;
              porteePlafond: PorteePlafond;
            };
          }) =>
            args.where.acteID === acte.id &&
            args.where.categorieActeID === null &&
            args.where.porteePlafond === PorteePlafond.PAR_AN
              ? {
                  id: 1,
                  unite: UnitePlafond.MONTANT,
                  montant: new Prisma.Decimal('1000000.00'),
                  nbSeances: null,
                  dateEffet: new Date('2026-01-01T00:00:00.000Z'),
                  dateFin: null,
                  acteID: 3,
                  categorieActeID: null,
                }
              : null,
        ),
        findMany: vi.fn().mockResolvedValue([{ id: 1 }]),
      },
      factureIndividuelle: { findFirst: findFactureLine },
    };
    const suiviT6 = {
      lire: vi.fn().mockResolvedValue({
        lignes: [
          {
            id: ligneSuivi.id,
            depassementActe: '500.00',
            depassementPlafond: '0.00',
          },
        ],
      }),
    };
    const serviceT6 = new FactureIndividuelleService(
      prisma as never,
      {
        obtenirEnVigueur: vi.fn().mockResolvedValue(regle),
      } as unknown as RegleService,
      new FactureCalculService(),
      new FacturePermissionsService(),
      { ecrire: vi.fn() } as unknown as MouvementFactureService,
      suiviT6 as unknown as SuiviService,
      new FactureWorkflowService(),
    );
    const suiviT5 = new SuiviService(
      prisma as never,
      {
        calculer: vi.fn((lignes: readonly LigneSuiviCalculInput[]) =>
          lignes.map((ligne) => ({
            ...ligne,
            depassementActe: new Prisma.Decimal(0),
            cumulActeConsomme: ligne.montantActe,
            soldePlafond: new Prisma.Decimal('900000.00'),
            capaciteRestante: new Prisma.Decimal('900000.00'),
            depassementPlafond: new Prisma.Decimal(0),
            totalDepassement: new Prisma.Decimal(0),
          })),
        ),
      } as unknown as SuiviCalculService,
      new FacturePermissionsService(),
      new PlafondResolutionService(prisma as never),
    );

    const lireVerrou = async () =>
      (await suiviT5.lire(beneficiaire.idp, acte.id, 2026, facture.id))
        .lignes[0].verrouillee;

    expect(await lireVerrou()).toBe(false);
    const creee = await serviceT6.creer(
      facture.id,
      { id: 5, role: RoleUtilisateur.OPERATEUR },
      {
        libelle: 'Consultation',
        dateActe: '2026-01-15',
        idp: beneficiaire.idp,
        acteId: acte.id,
        montantActe: 100_000,
      },
    );
    expect(creee.numLigne).toBe(1);
    expect(creee.avertissements).toContain(
      'Les dépassements saisis diffèrent de ceux de la LigneSuivi correspondante.',
    );
    expect(await lireVerrou()).toBe(true);

    await serviceT6.supprimer(facture.id, creee.id, {
      id: 5,
      role: RoleUtilisateur.OPERATEUR,
    });
    expect(await lireVerrou()).toBe(false);
  });
});
