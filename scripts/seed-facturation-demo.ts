import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { Client } from 'pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import {
  AgentConcerne,
  RoleUtilisateur,
  TypeRegle,
} from '../src/generated/prisma/enums.js';
import { env } from '../src/common/settings/env.validator.js';

const PREFIXE_DEMO = 'DEMO FACTURATION - ';

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

    console.log('Seed de démonstration facturation terminé.');
    console.log(`Opérateur : ${idsUtilisateurs[0]}`);
    console.log(`Adjoint   : ${idsUtilisateurs[1]}`);
    console.log(`Chef      : ${idsUtilisateurs[2]}`);
    console.log('Règles ACTIF / NON_ACTIF et catalogue SQL importés.');
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
