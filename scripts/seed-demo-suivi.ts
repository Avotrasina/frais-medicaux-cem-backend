import 'dotenv/config';
import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { PrismaModule } from '../src/infrastructure/prisma/prisma.module.js';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service.js';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from '../src/common/settings/env.validator.js';
import { FactureGlobaleService } from '../src/modules/facturation/factures/globale/facture-globale.service.js';
import {
  SuiviService,
  type FeuilleSuivi,
} from '../src/modules/facturation/suivi/suivi.service.js';
import { ActeRepository } from '../src/modules/acte/repositories/acte.repository.js';
import { CategorieActeRepository } from '../src/modules/categorie-acte/repositories/categorie-acte.repository.js';
import { PlafondRepository } from '../src/modules/plafond/repositories/plafond.repository.js';
import { RefSocialService } from '../src/facturation/ref-social/ref-social.service.js';
import { RegleService } from '../src/regles-prise-en-charge/regle.service.js';
import { FacturePermissionsService } from '../src/modules/facturation/shared/facture-permissions.service.js';
import { FactureWorkflowService } from '../src/modules/facturation/factures/workflow/facture-workflow.service.js';
import { MouvementFactureService } from '../src/modules/facturation/shared/mouvement-facture.service.js';
import { FactureCalculService } from '../src/modules/facturation/shared/facture-calcul.service.js';
import { SuiviCalculService } from '../src/modules/facturation/suivi/suivi-calcul.service.js';
import {
  PorteePlafond,
  RoleUtilisateur,
  UnitePlafond,
  Sexe,
  RegimeActe,
  StatutPrestataire,
} from '../src/generated/prisma/enums.js';
import type {
  FixtureLigne,
  FixtureScenario,
} from './seed-demo-suivi.fixtures.js';
import {
  SCENARIOS_PLAFOND,
  SCENARIOS_REELS,
} from './seed-demo-suivi.fixtures.js';

const PREFIX = 'DEMO-';
const ANNEE = 2026;

@Module({
  imports: [PrismaModule],
  providers: [
    RefSocialService,
    RegleService,
    FacturePermissionsService,
    {
      provide: FactureWorkflowService,
      useFactory: () => new FactureWorkflowService(),
    },
    MouvementFactureService,
    FactureCalculService,
    FactureGlobaleService,
    SuiviCalculService,
    SuiviService,
    CategorieActeRepository,
    ActeRepository,
    {
      provide: PlafondRepository,
      useFactory: (prisma: PrismaService) => new PlafondRepository(prisma),
      inject: [PrismaService],
    },
  ],
})
class DemoModule {}

function refDate(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}
function asNumber(value: string | undefined): number | undefined {
  return value === undefined ? undefined : Number(value);
}
function equal(
  actual: string | number | null | undefined,
  expected: number | undefined,
): boolean {
  return expected === undefined
    ? actual === undefined || actual === null
    : Number(actual) === expected;
}

async function clean(prisma: PrismaClient): Promise<void> {
  const beneficiaires = await prisma.beneficiaire.findMany({
    where: { idp: { startsWith: PREFIX } },
    select: { id: true },
  });
  const factures = await prisma.factureGlobale.findMany({
    where: { remarque: { startsWith: PREFIX } },
    select: { id: true },
  });
  const factureIds = factures.map(({ id }) => id);
  await prisma.ligneSuivi.deleteMany({
    where: {
      OR: [
        { beneficiaireId: { in: beneficiaires.map(({ id }) => id) } },
        { factureGlobaleId: { in: factureIds } },
      ],
    },
  });
  await prisma.mouvementFacture.deleteMany({
    where: { factureGlobaleId: { in: factureIds } },
  });
  await prisma.factureGlobale.deleteMany({ where: { id: { in: factureIds } } });
  await prisma.beneficiaire.deleteMany({
    where: { idp: { startsWith: PREFIX } },
  });
  await prisma.personne.deleteMany({ where: { nom: PREFIX } });
  const categorie = await prisma.categorieActe.findUnique({
    where: { nomCategorie: 'DEMO-SUIVI-PLAFONDS' },
    select: { id: true },
  });
  if (categorie !== null) {
    await prisma.plafond.deleteMany({
      where: { categorieActeID: categorie.id },
    });
    await prisma.acte.deleteMany({ where: { categorieActeId: categorie.id } });
    await prisma.categorieActe.delete({ where: { id: categorie.id } });
  }
}

async function createBeneficiaire(
  prisma: PrismaService,
  index: number,
): Promise<string> {
  const idp = `${PREFIX}${String(index).padStart(2, '0')}`;
  const personne = await prisma.personne.create({
    data: {
      nom: PREFIX,
      prenom: `Scénario ${index}`,
      dateNaissance: refDate('1980-01-01'),
      sexe: Sexe.MASCULIN,
    },
  });
  await prisma.beneficiaire.create({ data: { id: personne.id, idp } });
  return idp;
}

async function lireActes(
  prisma: PrismaService,
  codes: string[],
): Promise<
  Map<string, { id: number; categorieActeId: number; nomActe: string }>
> {
  const actes = await prisma.acte.findMany({
    where: { code: { in: codes } },
    select: { id: true, code: true, categorieActeId: true, nomActe: true },
  });
  return new Map(actes.map((acte) => [acte.code, acte]));
}

async function verifierPlafonds(
  prisma: PrismaService,
  acteId: number,
  attendu: FixtureScenario,
): Promise<string | undefined> {
  const acte = await prisma.acte.findUniqueOrThrow({
    where: { id: acteId },
    select: { categorieActeId: true },
  });
  const enVigueur = {
    dateEffet: { lte: refDate('2026-01-01') },
    OR: [{ dateFin: null }, { dateFin: { gte: refDate('2026-01-01') } }],
  };
  const plafond =
    (await prisma.plafond.findFirst({
      where: {
        categorieActeID: acte.categorieActeId,
        porteePlafond: PorteePlafond.PAR_AN,
        ...enVigueur,
      },
      orderBy: { dateEffet: 'desc' },
    })) ??
    (await prisma.plafond.findFirst({
      where: {
        acteID: acteId,
        porteePlafond: PorteePlafond.PAR_AN,
        ...enVigueur,
      },
      orderBy: { dateEffet: 'desc' },
    }));
  const valeur =
    plafond?.unite === UnitePlafond.SEANCES
      ? plafond.nbSeances
      : asNumber(plafond?.montant?.toString());
  if (
    plafond?.unite !==
      (attendu.unite === 'SEANCES'
        ? UnitePlafond.SEANCES
        : UnitePlafond.MONTANT) ||
    valeur !== attendu.annuel
  )
    return `plafond réel différent (attendu ${attendu.annuel}, trouvé ${valeur ?? 'absent'}), scénario ignoré`;
  if (attendu.parActe !== undefined) {
    const parActe =
      (await prisma.plafond.findFirst({
        where: {
          acteID: acteId,
          porteePlafond: PorteePlafond.PAR_ACTE,
          ...enVigueur,
        },
        orderBy: { dateEffet: 'desc' },
      })) ??
      (await prisma.plafond.findFirst({
        where: {
          categorieActeID: acte.categorieActeId,
          porteePlafond: PorteePlafond.PAR_ACTE,
          ...enVigueur,
        },
        orderBy: { dateEffet: 'desc' },
      }));
    const valeurActe = asNumber(parActe?.montant?.toString());
    if (valeurActe !== attendu.parActe)
      return `plafond réel différent (attendu ${attendu.parActe}, trouvé ${valeurActe ?? 'absent'}), scénario ignoré`;
  }
  return undefined;
}

function afficherEtVerifier(
  feuille: FeuilleSuivi,
  attendu: FixtureLigne[],
): boolean {
  console.table(
    feuille.lignes.map((ligne, index) => ({
      numero: index + 1,
      date: ligne.dateActe,
      montant: ligne.montantActe,
      depActe: ligne.depassementActe ?? ligne.totalDepassement,
      cumul: ligne.cumulActeConsomme ?? ligne.numeroSeance,
      solde: ligne.soldePlafond ?? ligne.seancesRestantes,
      capacite: ligne.capaciteRestante ?? '',
      depPlafond: ligne.depassementPlafond ?? '',
      total: ligne.totalDepassement,
    })),
  );
  return (
    feuille.lignes.length === attendu.length &&
    feuille.lignes.every((ligne, index) => {
      const cible = attendu[index];
      return (
        equal(ligne.montantActe, cible.montant) &&
        equal(ligne.depassementActe, cible.depassementActe) &&
        equal(ligne.cumulActeConsomme, cible.cumul) &&
        equal(ligne.soldePlafond, cible.solde) &&
        equal(ligne.capaciteRestante, cible.capacite) &&
        equal(ligne.depassementPlafond, cible.depassementPlafond) &&
        equal(ligne.totalDepassement, cible.total) &&
        (cible.seance === undefined
          ? ligne.numeroSeance === null
          : ligne.numeroSeance === cible.seance) &&
        equal(ligne.seancesRestantes, cible.seancesRestantes)
      );
    })
  );
}

async function main(): Promise<void> {
  if (
    process.env.NODE_ENV === 'production' ||
    process.env.ALLOW_DEMO_SEED !== 'true'
  )
    throw new Error(
      'Le seed de démonstration exige ALLOW_DEMO_SEED=true et NODE_ENV différent de production.',
    );
  const nettoyageClient = new PrismaClient({
    adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
  });
  await nettoyageClient.$connect();
  try {
    await clean(nettoyageClient);
  } catch (erreur: unknown) {
    const message = erreur instanceof Error ? erreur.message : String(erreur);
    if (
      message.includes('ligneSuivi') ||
      message.includes('ligne_suivi') ||
      message.includes('(not available)')
    ) {
      throw new Error(
        "La table facturation.ligne_suivi est absente de la base configurée. L'historique Prisma est pourtant marqué à jour : vérifiez la dérive de la base et appliquez la migration T5_x sur cette base avant de relancer le seed.",
      );
    }
    throw erreur;
  } finally {
    await nettoyageClient.$disconnect();
  }
  const app = await NestFactory.createApplicationContext(DemoModule, {
    logger: false,
    abortOnError: false,
  });
  const prisma = app.get(PrismaService);
  try {
    const nettoyage = process.argv.includes('--clean');
    if (nettoyage) {
      console.log('Données de démonstration supprimées.');
      return;
    }
    const factureService = app.get(FactureGlobaleService);
    const suivi = app.get(SuiviService, { strict: false });
    const plafondRepository = app.get(PlafondRepository, { strict: false });
    const categorieRepository = app.get(CategorieActeRepository, {
      strict: false,
    });
    const acteRepository = app.get(ActeRepository, { strict: false });
    const utilisateur = await prisma.utilisateur.findFirst({
      where: { role: RoleUtilisateur.OPERATEUR },
    });
    const prestataire = await prisma.prestataire.findFirst({
      where: { statut: StatutPrestataire.PRIVE },
    });
    if (utilisateur === null || prestataire === null)
      throw new Error(
        'Un utilisateur OPERATEUR et un prestataire réel sont nécessaires.',
      );
    const acteur = { id: utilisateur.id, role: utilisateur.role };
    const idps: string[] = [];
    let numero = 1;
    const executer = async (
      scenario: FixtureScenario,
      acteMap: Map<
        string,
        { id: number; categorieActeId: number; nomActe: string }
      >,
      dates: string[] = scenario.montants.map(
        (_, i) => `2026-0${(i % 9) + 1}-15`,
      ),
    ): Promise<void> => {
      const acte = acteMap.get(scenario.codes[0]);
      if (acte === undefined) {
        console.log(`${scenario.nom}: IGNORÉ (acte réel absent)`);
        return;
      }
      const raison = await verifierPlafonds(prisma, acte.id, scenario);
      if (raison !== undefined) {
        console.log(`${scenario.nom}: IGNORÉ (${raison})`);
        return;
      }
      const idp = await createBeneficiaire(prisma, numero++);
      idps.push(idp);
      const facture = await factureService.creer(
        {
          prestataireId: prestataire.id,
          numFacture: `${PREFIX}${scenario.cle}`,
          dateFacture: '2026-09-01',
          dateReception: '2026-09-02',
          moisPrestation: '2026-09',
          montantTotal: scenario.montants.reduce((a, b) => a + b, 0),
          remarque: `${PREFIX}${scenario.nom}`,
        },
        utilisateur.id,
      );
      for (const [index, montant] of scenario.montants.entries())
        await suivi.creer(facture.id, acteur, {
          idp,
          acteId:
            acteMap.get(scenario.codes[index % scenario.codes.length])?.id ??
            acte.id,
          dateActe: dates[index],
          montantActe: montant,
        });
      const feuille = await suivi.lire(idp, acte.id, ANNEE);
      console.log(
        `${scenario.nom}: ${afficherEtVerifier(feuille, scenario.attendu) ? 'OK' : 'ÉCART'} — GET /suivis?idp=${idp}&acteId=${acte.id}&annee=2026`,
      );
    };
    const reels = await Promise.all(
      SCENARIOS_REELS.map(
        async (scenario) =>
          [scenario, await lireActes(prisma, scenario.codes)] as const,
      ),
    );
    for (const [scenario, actes] of reels) await executer(scenario, actes);
    const categorie = await categorieRepository.create({
      nomCategorie: 'DEMO-SUIVI-PLAFONDS',
    });
    const actesDemo = new Map<
      string,
      { id: number; categorieActeId: number; nomActe: string }
    >();
    for (const scenario of SCENARIOS_PLAFOND) {
      const acte = await acteRepository.create({
        code: scenario.codes[0],
        nomActe: scenario.nom,
        listeLibelle: 'DEMO',
        regime: RegimeActe.NORMAL,
        categorieActeId: categorie.id,
      });
      actesDemo.set(acte.code, acte);
    }
    const plafondCategorie = await plafondRepository.create({
      dateEffet: '2026-01-01',
      porteePlafond: PorteePlafond.PAR_AN,
      unite: UnitePlafond.MONTANT,
      montant: 800,
      nbSeances: null,
      acteID: null,
      categorieActeID: categorie.id,
    });
    await plafondRepository.update(plafondCategorie.id, {
      dateFin: '2026-05-31',
    });
    for (const scenario of SCENARIOS_PLAFOND) {
      const valeur = scenario.cle.startsWith('hausse') ? 900 : 800;
      await plafondRepository.create({
        dateEffet: '2026-06-01',
        porteePlafond: PorteePlafond.PAR_AN,
        unite: UnitePlafond.MONTANT,
        montant: valeur,
        nbSeances: null,
        acteID: actesDemo.get(scenario.codes[0])?.id ?? null,
        categorieActeID: null,
      });
    }
    console.log(
      'Scénarios de changement de plafond: IGNORÉ (le modèle Prisma actuel impose une cible de suivi stable et ne permet pas deux versions sur le même périmètre ; voir les points laissés ouverts).',
    );
    console.log(`IDP de démonstration: ${idps.join(', ')}`);
  } finally {
    await app.close();
  }
}

main().catch((erreur: unknown) => {
  console.error(erreur instanceof Error ? erreur.message : erreur);
  process.exitCode = 1;
});
