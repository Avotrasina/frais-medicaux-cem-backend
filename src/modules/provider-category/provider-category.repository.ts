import { Injectable } from "@nestjs/common";
import { PrismaClient } from "../../generated/prisma/client.js";
import type { CategoriePrestataire } from "../../generated/prisma/client.js";
import type { DbClient } from "../../infrastructure/prisma/db-client.type.js";
import type {
  CreateProviderCategory,
  ReadProviderCategory,
  UpdatePartialProviderCategory,
} from "./types/provider-category.types.js";
import { HandlePrismaErrors } from "../../common/decorators/handle-prisma-errors.decorator.js";

@Injectable()
@HandlePrismaErrors({ exclude: ["toReadProviderCategory"] })
export class ProviderCategoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private client(tx?: DbClient): DbClient {
    return tx ?? this.prisma;
  }

  private toReadProviderCategory(
    category: CategoriePrestataire,
  ): ReadProviderCategory {
    return { id: category.id, nom: category.nom };
  }

  async findAll(tx?: DbClient): Promise<ReadProviderCategory[]> {
    const categories = await this.client(tx).categoriePrestataire.findMany({
      orderBy: { nom: "asc" },
    });
    return categories.map((c) => this.toReadProviderCategory(c));
  }

  async readbyID(id: number, tx?: DbClient): Promise<ReadProviderCategory> {
    const category = await this.client(
      tx,
    ).categoriePrestataire.findUniqueOrThrow({
      where: { id },
    });
    return this.toReadProviderCategory(category);
  }

  async create(
    category: CreateProviderCategory,
    tx?: DbClient,
  ): Promise<ReadProviderCategory> {
    const created = await this.client(tx).categoriePrestataire.create({
      data: { nom: category.nom },
    });
    return this.toReadProviderCategory(created);
  }

  async updatePartial(
    id: number,
    category: UpdatePartialProviderCategory,
    tx?: DbClient,
  ): Promise<ReadProviderCategory> {
    const updated = await this.client(tx).categoriePrestataire.update({
      where: { id },
      data: { nom: category.nom ?? undefined },
    });
    return this.toReadProviderCategory(updated);
  }
}