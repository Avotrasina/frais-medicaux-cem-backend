import { Injectable } from "@nestjs/common";
import { PrismaClient } from "../../../generated/prisma/client.js";
import type { DbClient } from "../../../infrastructure/prisma/db-client.type.js";
import type {
  CreateFamilleAgent,
  ReadFamilleAgent,
  UpdateFamilleAgent,
} from "../types/famille.agent.types.js";
import { HandlePrismaErrors } from "../../../common/decorators/handle-prisma-errors.decorator.js";


@Injectable()
@HandlePrismaErrors()
export class FamilleAgentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private client(tx?: DbClient): DbClient {
    return tx ?? this.prisma;
  }

  async findAll(tx?: DbClient): Promise<ReadFamilleAgent[]> {
    return this.client(tx).familleAgent.findMany();
  }

  async findOne(id: number, tx?: DbClient): Promise<ReadFamilleAgent | null> {
    return this.client(tx).familleAgent.findUnique({ where: { id } });
  }

  async findByAgentMatricule(
    agentMatricule: string,
    tx?: DbClient,
  ): Promise<ReadFamilleAgent[]> {
    return this.client(tx).familleAgent.findMany({ where: { agentMatricule } });
  }

  async create(
    familleAgent: CreateFamilleAgent,
    tx?: DbClient,
  ): Promise<ReadFamilleAgent> {
    return this.client(tx).familleAgent.create({ data: familleAgent });
  }

  async update(
    id: number,
    familleAgent: UpdateFamilleAgent,
    tx?: DbClient,
  ): Promise<ReadFamilleAgent> {
    return this.client(tx).familleAgent.update({
      where: { id },
      data: familleAgent,
    });
  }

  async delete(id: number, tx?: DbClient): Promise<void> {
    await this.client(tx).familleAgent.delete({ where: { id } });
  }
}