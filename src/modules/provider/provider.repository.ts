import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/prisma/prisma.service.js";
import type { Prestataire } from "../../generated/prisma/client.js";
import type { DbClient } from "../../infrastructure/prisma/db-client.type.js";
import {
  ProviderStatus,
  type CreateProvider,
  type FilterProvider,
  type ReadProvider,
  type UpdatePartialProvider,
} from "./types/provider.types.js";
import { HandlePrismaErrors } from "../../common/decorators/handle-prisma-errors.decorator.js";
import { omitNullish } from "../../common/utils/omit-nullish.js";
import { SuppresionStatut } from "../../generated/prisma/enums.js";

@Injectable()
@HandlePrismaErrors({ exclude: ["toReadProvider"] })
export class ProviderRepository {
  constructor(private readonly prisma: PrismaService) {}

  private client(tx?: DbClient): DbClient {
    return tx ?? this.prisma;
  }

  private toReadProvider(provider: Prestataire): ReadProvider {
    return {
      id: provider.id,
      nom: provider.nom,
      adresse: provider.adresse,
      statut: ProviderStatus[provider.statut],
      nif: provider.nif,
      stat: provider.stat,
      dateDebutConvention: provider.dateDebutConvention,
      dateFinConvention: provider.dateFinConvention,
      listePrestation: provider.listePrestation,
      lieuID: provider.lieuID,
      categorieID: provider.categorieID,
    };
  }

  async findAll(tx?: DbClient): Promise<ReadProvider[]> {
    const providers = await this.client(tx).prestataire.findMany({
      orderBy: { nom: "asc" },
    });
    return providers.map((p) => this.toReadProvider(p));
  }

  async findDeletionRequests(tx?: DbClient): Promise<ReadProvider[]> {
    const providers = await this.client(tx).prestataire.findMany({
      where: { suppressionStatut: SuppresionStatut.EN_ATTENTE },
      orderBy: { nom: "asc" },
    });
    return providers.map((provider) => this.toReadProvider(provider));
  }

  async findByFilter(
    filter: FilterProvider,
    tx?: DbClient,
  ): Promise<ReadProvider[]> {
    const providers = await this.client(tx).prestataire.findMany({
      where: {
        lieuID: filter.lieuID ?? undefined,
        categorieID: filter.categorieID ?? undefined,
      },
      orderBy: { nom: "asc" },
    });
    return providers.map((p) => this.toReadProvider(p));
  }

  async readbyID(id: number, tx?: DbClient): Promise<ReadProvider> {
    const provider = await this.client(tx).prestataire.findFirstOrThrow({
      where: { id },
    });
    return this.toReadProvider(provider);
  }

  async create(provider: CreateProvider, tx?: DbClient): Promise<ReadProvider> {
    const created = await this.client(tx).prestataire.create({
      data: provider,
    });
    return this.toReadProvider(created);
  }

  async findConventionPath(id: number, tx?: DbClient): Promise<string | null> {
    const provider = await this.client(tx).prestataire.findFirstOrThrow({
      where: { id },
      select: { conventionPath: true },
    });
    return provider.conventionPath;
  }

  async updateConventionPath(
    id: number,
    conventionPath: string,
    tx?: DbClient,
  ): Promise<ReadProvider> {
    const updated = await this.client(tx).prestataire.update({
      where: { id },
      data: { conventionPath },
    });
    return this.toReadProvider(updated);
  }

  async updatePartial(
    id: number,
    provider: UpdatePartialProvider,
    tx?: DbClient,
  ): Promise<ReadProvider> {
    const updated = await this.client(tx).prestataire.update({
      where: { id },
      data: omitNullish(provider),
    });
    return this.toReadProvider(updated);
  }
}
