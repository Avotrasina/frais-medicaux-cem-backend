import { Injectable } from "@nestjs/common";
import { PrismaClient } from "../../../generated/prisma/client.js";
import type { DbClient } from "../../../infrastructure/prisma/db-client.type.js";
import {
  FAMILLE_AGENT_INCLUDE,
  type ReadFamilleAgent,
} from "../types/famille.agent.types.js";
import { HandlePrismaErrors } from "../../../common/decorators/handle-prisma-errors.decorator.js";

@Injectable()
@HandlePrismaErrors()
export class FamilleAgentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private client(tx?: DbClient): DbClient {
    return tx ?? this.prisma;
  }

  async findByAgentMatricule(
    agentMatricule: string,
    tx?: DbClient,
  ): Promise<ReadFamilleAgent[]> {
    return this.client(tx).familleAgent.findMany({
      where: { agentMatricule },
      include: FAMILLE_AGENT_INCLUDE,
    });
  }

  
}