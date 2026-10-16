import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/prisma/prisma.service.js";
import type { CategorieAgent } from "../../generated/prisma/client.js";
import type { DbClient } from "../../infrastructure/prisma/db-client.type.js";
import type {
  CreateAgentCategory,
  ReadAgentCategory,
  UpdatePartialAgentCategory,
} from "./types/agent-category.types.js";
import { HandlePrismaErrors } from "../../common/decorators/handle-prisma-errors.decorator.js";

@Injectable()
@HandlePrismaErrors({ exclude: ["toReadAgentCategory"] })
export class AgentCategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  private client(tx?: DbClient): DbClient {
    return tx ?? this.prisma;
  }

  private toReadAgentCategory(category: CategorieAgent): ReadAgentCategory {
    return { id: category.id, codeCategory: category.codeCategory };
  }

  async findAll(tx?: DbClient): Promise<ReadAgentCategory[]> {
    const categories = await this.client(tx).categorieAgent.findMany({
      orderBy: { codeCategory: "asc" },
    });
    return categories.map((c) => this.toReadAgentCategory(c));
  }

  async findByID(id: number, tx?: DbClient): Promise<ReadAgentCategory> {
    const category = await this.client(tx).categorieAgent.findUniqueOrThrow({
      where: { id },
    });
    return this.toReadAgentCategory(category);
  }

  async create(
    category: CreateAgentCategory,
    tx?: DbClient,
  ): Promise<ReadAgentCategory> {
    const created = await this.client(tx).categorieAgent.create({
      data: { codeCategory: category.codeCategory },
    });
    return this.toReadAgentCategory(created);
  }

  async updatePartial(
    id: number,
    category: UpdatePartialAgentCategory,
    tx?: DbClient,
  ): Promise<ReadAgentCategory> {
    const updated = await this.client(tx).categorieAgent.update({
      where: { id },
      data: { codeCategory: category.codeCategory ?? undefined },
    });
    return this.toReadAgentCategory(updated);
  }
}