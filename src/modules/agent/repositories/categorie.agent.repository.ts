import { Injectable } from "@nestjs/common";
import { PrismaClient } from "../../../generated/prisma/client.js";
import type { CategorieAgent } from "../../../generated/prisma/client.js";
import type { DbClient } from "../../../common/prisma/db-client.type.js";
import type {
  CreateCategorieAgent,
  ReadCategorieAgent,
  UpdateCategorieAgent,
} from "../types/categorie.agent.types.js";
import { HandlePrismaErrors } from "../../../common/decorators/handle-prisma-errors.decorator.js";


@Injectable()
@HandlePrismaErrors({ entity: "CategorieAgent", exclude: ["toReadCategorieAgent"] })
export class CategorieAgentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private client(tx?: DbClient): DbClient {
    return tx ?? this.prisma;
  }

  private toReadCategorieAgent(
    categorieAgent: CategorieAgent,
  ): ReadCategorieAgent {
    return {
      id: categorieAgent.id,
      codeCategory: categorieAgent.codeCategory,
    };
  }

  async findAll(tx?: DbClient): Promise<ReadCategorieAgent[]> {
    const categories = await this.client(tx).categorieAgent.findMany();
    return categories.map((categorie) => this.toReadCategorieAgent(categorie));
  }

  async findOne(
    id: number,
    tx?: DbClient,
  ): Promise<ReadCategorieAgent | null> {
    const categorie = await this.client(tx).categorieAgent.findUnique({
      where: { id },
    });
    return categorie ? this.toReadCategorieAgent(categorie) : null;
  }

  async findByCodeCategory(
    codeCategory: string,
    tx?: DbClient,
  ): Promise<ReadCategorieAgent | null> {
    const categorie = await this.client(tx).categorieAgent.findUnique({
      where: { codeCategory },
    });
    return categorie ? this.toReadCategorieAgent(categorie) : null;
  }

  async create(
    categorieAgent: CreateCategorieAgent,
    tx?: DbClient,
  ): Promise<ReadCategorieAgent> {
    const created = await this.client(tx).categorieAgent.create({
      data: categorieAgent,
    });
    return this.toReadCategorieAgent(created);
  }

  async update(
    id: number,
    categorieAgent: UpdateCategorieAgent,
    tx?: DbClient,
  ): Promise<ReadCategorieAgent> {
    const updated = await this.client(tx).categorieAgent.update({
      where: { id },
      data: categorieAgent,
    });
    return this.toReadCategorieAgent(updated);
  }

  async delete(id: number, tx?: DbClient): Promise<void> {
    await this.client(tx).categorieAgent.delete({ where: { id } });
  }
}