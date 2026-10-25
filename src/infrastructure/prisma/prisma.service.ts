/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client.js";
import { env } from "../../common/settings/env.validator.js";
import {
  createSoftDeleteExtension,
  type SoftDeleteConfig,
} from "./extension/soft-delete.extension.js";

export const SOFT_DELETE_CONFIG: SoftDeleteConfig = {
  models: [
    "Personne",
    "Agent",
    "CategorieAgent",
    "Direction",
    "Service",
    "FamilleAgent",
    "Conjoint",
    "Enfant",
    "StructureOrganisationnelle",
    "Agence",
    "Attestation",
    "Beneficiaire",
    "Prestataire",
    "Lieu",
    "CategoriePrestataire",
  ],
  operations: ["find", "create", "update", "delete"],
};

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
    super({ adapter });

    const extended = createSoftDeleteExtension(this, SOFT_DELETE_CONFIG);
    return Object.assign(this, extended) as this;
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}