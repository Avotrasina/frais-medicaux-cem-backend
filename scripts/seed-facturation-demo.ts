import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { Client } from 'pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { Prisma } from '../src/generated/prisma/client.js';
import {
  AgentType,
  AgentConcerne,
  RoleUtilisateur,
  Sexe,
  StatutAttestation,
  StatutFacture,
  StatutPEC,
  TypeRegle,
  TypeMouvement,
} from '../src/generated/prisma/enums.js';
import { env } from '../src/common/settings/env.validator.js';
import { RefSocialService } from '../src/modules/facturation/shared/ref-social.service.js';
import { MouvementFactureService } from '../src/modules/facturation/shared/mouvement-facture.service.js';

const PREFIXE_DEMO = 'DEMO FACTURATION - ';
const IDP_DEMO = 'DEMO-FACTURATION-T6-001';
const MATRICULE_AGENT_DEMO = 99000001;
const NUM_FACTURE_DEMO = 'DEMO-FACTURATION-T6';
const REMARQUE_FACTURE_DEMO = `${PREFIXE_DEMO}TABLEAU T6`;

function lireIdEnv(cle: string): number {
  const valeur = process.env[cle];
  if (valeur === undefined || !/^[1-9]\d*$/.test(valeur)) {
    throw new Error(`${cle} doit contenir un entier positif.`);
  }
  const id = Number(valeur);
  if (!Number.isSafeInteger(id)) {
    throw new Error(`${cle} dépasse la limite des entiers sûrs.`);
  }
  return id;
}

function dateDuJourUtc(): Date {
  const maintenant = new Date();
  return new Date(
    Date.UTC(
      maintenant.getUTCFullYear(),
      maintenant.getUTCMonth(),
      maintenant.getUTCDate(),
    ),
  );
}

async function creerFactureT6Demo(
  prisma: PrismaClient,
  utilisateurId: number,
): Promise<{ id: number; refSociale: string; lignes: number[] }> {
  const prestataire = await prisma.prestataire.findFirst({
    orderBy: { id: 'asc' },
    select: { id: true },
  });
  if (prestataire === null) {
    throw new Error(
      'Aucun prestataire n’est disponible. Créez ou importez un prestataire avant le seed.',
    );
  }

  const codesActes = ['CON-01', 'LAB-01', 'IMG-01'];
  const actes = await prisma.acte.findMany({
    where: { code: { in: codesActes } },
    select: { id: true, code: true, nomActe: true },
  });
  const actesParCode = new Map(actes.map((acte) => [acte.code, acte]));
  const codeManquant = codesActes.find((code) => !actesParCode.has(code));
  if (codeManquant !== undefined) {
    throw new Error(
      `L’acte ${codeManquant} est absent. Vérifiez l’import de private-data/actes-et-plafonds.sql.`,
    );
  }

  const regle = await prisma.regle.findFirst({
    where: {
      agentConcerne: AgentConcerne.ACTIF,
      dateEffet: { lte: dateDuJourUtc() },
      OR: [{ dateFin: null }, { dateFin: { gte: dateDuJourUtc() } }],
    },
    orderBy: [{ dateEffet: 'desc' }, { id: 'desc' }],
  });
  if (regle === null) {
    throw new Error('Aucune règle ACTIF en vigueur pour créer les lignes T6.');
  }

  return prisma.$transaction(async (tx) => {
    let beneficiaire = await tx.beneficiaire.findUnique({
      where: { idp: IDP_DEMO },
      include: { personne: { include: { agent: true } } },
    });
    if (beneficiaire === null) {
      const agentMatriculeExistant = await tx.agent.findUnique({
        where: { matricule: MATRICULE_AGENT_DEMO },
        select: { id: true },
      });
      if (agentMatriculeExistant !== null) {
        throw new Error(
          `Le matricule ${MATRICULE_AGENT_DEMO} est déjà utilisé hors du bénéficiaire de démonstration.`,
        );
      }
      const personne = await tx.personne.create({
        data: {
          nom: 'DEMO FACTURATION',
          prenom: 'Agent T6',
          dateNaissance: new Date('1980-01-01T00:00:00.000Z'),
          sexe: Sexe.MASCULIN,
        },
      });
      await tx.agent.create({
        data: {
          id: personne.id,
          matricule: MATRICULE_AGENT_DEMO,
          carteProfessionnellePath: 'demo-t6',
          dateEntree: new Date('2010-01-01T00:00:00.000Z'),
          statutPEC: StatutPEC.AGENT,
          agentType: AgentType.AGENT_ACTIF,
        },
      });
      beneficiaire = await tx.beneficiaire.create({
        data: { id: personne.id, idp: IDP_DEMO },
        include: { personne: { include: { agent: true } } },
      });
    } else if (
      beneficiaire.personne.nom !== 'DEMO FACTURATION' ||
      beneficiaire.personne.agent?.matricule !== MATRICULE_AGENT_DEMO
    ) {
      throw new Error(
        `L’IDP ${IDP_DEMO} existe et n’appartient pas aux données de démonstration.`,
      );
    }

    const definitionsLignes = [
      { code: 'CON-01', montant: '30000.00', depActe: '0.00', depPlafond: '0.00' },
      { code: 'LAB-01', montant: '80000.00', depActe: '0.00', depPlafond: '0.00' },
      { code: 'IMG-01', montant: '215000.00', depActe: '0.00', depPlafond: '15000.00' },
    ] as const;
    const attestations = [];
    for (const [index, ligne] of definitionsLignes.entries()) {
      const naturePrestation = `${PREFIXE_DEMO}T6-LIGNE-${index + 1}`;
      const existante = await tx.attestation.findFirst({
        where: {
          prestataireID: prestataire.id,
          idpBeneficiaire: IDP_DEMO,
          naturePrestation,
        },
      });
      attestations.push(
        existante ??
          (await tx.attestation.create({
            data: {
              prestataireID: prestataire.id,
              idpBeneficiaire: IDP_DEMO,
              naturePrestation,
              statut: StatutAttestation.VALIDEE,
              datePEC: dateDuJourUtc(),
              dateValidation: dateDuJourUtc(),
            },
          })),
      );
    }

    const anciennesFactures = await tx.factureGlobale.findMany({
      where: { remarque: REMARQUE_FACTURE_DEMO },
      select: { id: true },
    });
    const anciensIds = anciennesFactures.map(({ id }) => id);
    if (anciensIds.length > 0) {
      await tx.pieceJointeFacture.deleteMany({
        where: { factureGlobaleId: { in: anciensIds } },
      });
      await tx.ligneSuivi.deleteMany({
        where: { factureGlobaleId: { in: anciensIds } },
      });
      await tx.factureIndividuelle.deleteMany({
        where: { factureGlobaleId: { in: anciensIds } },
      });
      await tx.mouvementFacture.deleteMany({
        where: { factureGlobaleId: { in: anciensIds } },
      });
      await tx.factureGlobale.deleteMany({
        where: { id: { in: anciensIds } },
      });
    }

    const date = dateDuJourUtc();
    const moisPrestation = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1),
    );
    const montantLignes = definitionsLignes.map((ligne) => {
      const montant = new Prisma.Decimal(ligne.montant);
      const depassement = new Prisma.Decimal(ligne.depActe).plus(
        ligne.depPlafond,
      );
      const montantCem = montant
        .minus(depassement)
        .mul(regle.tauxCem)
        .div(100)
        .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
      return { montant, depassement, montantCem };
    });
    const montantTotal = montantLignes.reduce(
      (somme, ligne) => somme.plus(ligne.montant),
      new Prisma.Decimal(0),
    );
    const totalDepassement = montantLignes.reduce(
      (somme, ligne) => somme.plus(ligne.depassement),
      new Prisma.Decimal(0),
    );

    const refSociale = await new RefSocialService().genererProchaine(
      tx,
      date.getUTCFullYear(),
    );
    const facture = await tx.factureGlobale.create({
      data: {
        refSociale,
        annee: date.getUTCFullYear(),
        dateReception: date,
        numFacture: NUM_FACTURE_DEMO,
        dateFacture: moisPrestation,
        moisPrestation,
        remarque: REMARQUE_FACTURE_DEMO,
        montantTotal,
        total100Cem: 0,
        totalDepassement,
        tauxCem: regle.tauxCem,
        statut: StatutFacture.ENREGISTREE,
        prestataireId: prestataire.id,
        enregistreParId: utilisateurId,
      },
    });
    await new MouvementFactureService().ecrire(tx, {
      factureGlobaleId: facture.id,
      type: TypeMouvement.ENREGISTREMENT,
      effectueParId: utilisateurId,
    });

    const lignesCreees = [];
    for (const [index, definition] of definitionsLignes.entries()) {
      const acte = actesParCode.get(definition.code)!;
      const montants = montantLignes[index]!;
      lignesCreees.push(
        await tx.factureIndividuelle.create({
          data: {
            factureGlobaleId: facture.id,
            numLigne: index + 1,
            libelle: acte.nomActe,
            dateActe: date,
            acteId: acte.id,
            beneficiaireId: beneficiaire.id,
            priseEnChargeId: attestations[index]!.id,
            montantActe: montants.montant,
            montantCemIntegral: 0,
            montantDepassementActe: definition.depActe,
            montantDepassementPlafond: definition.depPlafond,
            tauxCem: regle.tauxCem,
            refPaie: index === 0 ? 'DEMO-PAIE-2026-11' : null,
            moisAffectation: index === 0 ? moisPrestation : null,
          },
          select: { id: true },
        }),
      );
    }

    return {
      id: facture.id,
      refSociale: facture.refSociale,
      lignes: lignesCreees.map(({ id }) => id),
    };
  });
}

async function main(): Promise<void> {
  if (
    process.env.NODE_ENV === 'production' ||
    process.env.ALLOW_DEMO_SEED !== 'true'
  ) {
    throw new Error(
      'Seed refusé : définissez ALLOW_DEMO_SEED=true dans un environnement hors production.',
    );
  }

  const idsUtilisateurs = [
    lireIdEnv('FACTURATION_UTILISATEUR_TEST_ID'),
    lireIdEnv('FACTURATION_UTILISATEUR_ADJOINT_TEST_ID'),
    lireIdEnv('FACTURATION_UTILISATEUR_CHEF_TEST_ID'),
  ];
  const idsRegles = [
    lireIdEnv('FACTURATION_REGLE_ACTIF_TEST_ID'),
    lireIdEnv('FACTURATION_REGLE_NON_ACTIF_TEST_ID'),
  ];
  if (new Set([...idsUtilisateurs, ...idsRegles]).size !== 5) {
    throw new Error('Les IDs de démonstration doivent être tous différents.');
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
  });
  const catalogue = new Client({ connectionString: env.DATABASE_URL });

  try {
    await prisma.$connect();
    await prisma.$transaction(async (tx) => {
      const utilisateurs = [
        { id: idsUtilisateurs[0]!, nom: `${PREFIXE_DEMO}Opérateur`, role: RoleUtilisateur.OPERATEUR },
        { id: idsUtilisateurs[1]!, nom: `${PREFIXE_DEMO}Adjoint`, role: RoleUtilisateur.ADJOINT },
        { id: idsUtilisateurs[2]!, nom: `${PREFIXE_DEMO}Chef`, role: RoleUtilisateur.CHEF },
      ];

      for (const utilisateur of utilisateurs) {
        const existant = await tx.utilisateur.findUnique({
          where: { id: utilisateur.id },
          select: { nom: true },
        });
        if (existant !== null && !existant.nom.startsWith(PREFIXE_DEMO)) {
          throw new Error(
            `L'ID utilisateur ${utilisateur.id} existe et n'appartient pas aux données de démonstration.`,
          );
        }
        await tx.utilisateur.upsert({
          where: { id: utilisateur.id },
          create: utilisateur,
          update: { nom: utilisateur.nom, role: utilisateur.role },
        });
      }

      const dateEffet = new Date('2026-01-01T00:00:00.000Z');
      const regles = [
        {
          id: idsRegles[0]!,
          type: TypeRegle.REPARTITION_AGENT_CEM,
          agentConcerne: AgentConcerne.ACTIF,
          tauxCem: '80.00',
          dateEffet,
          dateFin: null,
        },
        {
          id: idsRegles[1]!,
          type: TypeRegle.CHARGE_TOTALE_CEM,
          agentConcerne: AgentConcerne.NON_ACTIF,
          tauxCem: '100.00',
          dateEffet,
          dateFin: null,
        },
      ];

      for (const regle of regles) {
        const existante = await tx.regle.findUnique({
          where: { id: regle.id },
          select: { id: true },
        });
        if (existante !== null) {
          const actuelle = await tx.regle.findUniqueOrThrow({
            where: { id: regle.id },
          });
          if (
            actuelle.agentConcerne !== regle.agentConcerne ||
            actuelle.type !== regle.type
          ) {
            throw new Error(
              `L'ID règle ${regle.id} existe déjà avec une règle différente.`,
            );
          }
        }
        await tx.regle.upsert({
          where: { id: regle.id },
          create: regle,
          update: {
            type: regle.type,
            agentConcerne: regle.agentConcerne,
            tauxCem: regle.tauxCem,
            dateEffet: regle.dateEffet,
            dateFin: regle.dateFin,
          },
        });
      }

      await tx.$queryRaw`
        SELECT setval(
          pg_get_serial_sequence('"utilisateur"."utilisateur"', 'id'),
          (SELECT MAX(id) FROM "utilisateur"."utilisateur"),
          true
        )
      `;
      await tx.$queryRaw`
        SELECT setval(
          pg_get_serial_sequence('"pec"."regle"', 'id'),
          (SELECT MAX(id) FROM "pec"."regle"),
          true
        )
      `;
    });

    const cheminSql = resolve(
      process.cwd(),
      'private-data',
      'actes-et-plafonds.sql',
    );
    const sqlCatalogue = await readFile(cheminSql, 'utf8');
    await catalogue.connect();
    await catalogue.query(sqlCatalogue);

    const factureDemo = await creerFactureT6Demo(
      prisma,
      idsUtilisateurs[0]!,
    );

    console.log('Seed de démonstration facturation terminé.');
    console.log(`Opérateur : ${idsUtilisateurs[0]}`);
    console.log(`Adjoint   : ${idsUtilisateurs[1]}`);
    console.log(`Chef      : ${idsUtilisateurs[2]}`);
    console.log('Règles ACTIF / NON_ACTIF et catalogue SQL importés.');
    console.log(
      `Facture T6 : ${factureDemo.refSociale} (ID ${factureDemo.id}), ${factureDemo.lignes.length} lignes — IDP ${IDP_DEMO}.`,
    );
  } finally {
    await catalogue.end().catch(() => undefined);
    await prisma.$disconnect();
  }
}

main().catch((erreur: unknown) => {
  console.error(
    erreur instanceof Error ? erreur.message : 'Erreur inconnue pendant le seed.',
  );
  process.exitCode = 1;
});
