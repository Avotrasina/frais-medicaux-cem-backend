/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client.js';
import { env } from '../../common/settings/env.validator.js';
import {
  createSoftDeleteExtension,
  type SoftDeleteConfig,
} from './extension/soft-delete.extension.js';

export const SOFT_DELETE_CONFIG: SoftDeleteConfig = {
  models: [
    'Personne',
    'Agent',
    'CategorieAgent',
    'Direction',
    'Service',
    'FamilleAgent',
    'Conjoint',
    'Enfant',
    'StructureOrganisationnelle',
    'Agence',
    'Attestation',
    'Beneficiaire',
    'Prestataire',
    'Lieu',
    'CategoriePrestataire',
  ],
  operations: ['find', 'create', 'update', 'delete'],
};

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  /** Creates the Prisma client with the PostgreSQL adapter and soft-delete hooks. */
  constructor() {
    const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
    super({ adapter });

    const extended = createSoftDeleteExtension(this, SOFT_DELETE_CONFIG);
    return Object.assign(this, extended) as this;
  }

  /** Opens the database connection when Nest initializes the module. */
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  /** Closes the database connection during Nest module shutdown. */
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
