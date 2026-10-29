import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import type { CategorieAgent } from '../../../generated/prisma/client.js';
import type { DbClient } from '../../../infrastructure/prisma/db-client.type.js';
import type {
  CreateAgentCategory,
  ReadAgentCategory,
  UpdatePartialAgentCategory,
} from '../types/agent-category.types.js';
import { HandlePrismaErrors } from '../../../common/decorators/handle-prisma-errors.decorator.js';
import { executeSoftDeletion } from '../../../infrastructure/prisma/soft-deletion.repository.js';
import type { DeletionAction } from '../../../common/types/soft-deletion.types.js';
import { SuppressionStatut } from '../../../generated/prisma/enums.js';

@Injectable()
@HandlePrismaErrors({ exclude: ['toReadAgentCategory'] })
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
      orderBy: { codeCategory: 'asc' },
    });
    return categories.map((c) => this.toReadAgentCategory(c));
  }

  async findDeletionRequests(tx?: DbClient): Promise<ReadAgentCategory[]> {
    const categories = await this.client(tx).categorieAgent.findMany({
      where: { suppressionStatut: SuppressionStatut.EN_ATTENTE },
      orderBy: { codeCategory: 'asc' },
    });
    return categories.map((category) => this.toReadAgentCategory(category));
  }

  async findById(id: number, tx?: DbClient): Promise<ReadAgentCategory> {
    const category = await this.client(tx).categorieAgent.findFirstOrThrow({
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

  async updateDeletionStatus(
    id: number,
    action: DeletionAction,
    tx?: DbClient,
  ): Promise<void> {
    await executeSoftDeletion(
      tx ?? this.prisma,
      [{ model: 'categorieAgent', where: { id } }],
      action,
    );
  }

  async findAgentMatricules(id: number, tx?: DbClient): Promise<number[]> {
    const category = await this.client(tx).categorieAgent.findFirstOrThrow({
      where: { id },
      select: { agents: { select: { matricule: true } } },
    });
    return category.agents.map(({ matricule }) => matricule);
  }
}
