import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../infrastructure/prisma/prisma.service.js";
import type { DbClient } from "../../../infrastructure/prisma/db-client.type.js";
import type {
  CreatedConjoint,
  ReadConjoint,
  ConjointWithFamilleAgentPersonne,
  CreateConjointRecord
} from "../types/conjoint.types.js";
import { HandlePrismaErrors } from "../../../common/decorators/handle-prisma-errors.decorator.js";

@Injectable()
@HandlePrismaErrors()
export class ConjointRepository {
  constructor(private readonly prisma: PrismaService) {}

  private client(tx?: DbClient): DbClient {
    return tx ?? this.prisma;
  }

  private toReadConjoint(
    conjoint: ConjointWithFamilleAgentPersonne,
  ): ReadConjoint {
    const { familleAgent } = conjoint;
    const { personne } = familleAgent;
    return {
      ...personne,
      numConjoint: conjoint.numConjoint,
      agentMatricule: familleAgent.agentMatricule,
      carteSocialePath: familleAgent.carteSocialePath,
    };
  }

  async create(
    conjoint: CreateConjointRecord,
    tx?: DbClient,
  ): Promise<CreatedConjoint> {
    const { id, agentMatricule, carteSocialePath } = conjoint;

    return this.client(tx).conjoint.create({
      data: {
        familleAgent: {
          create: { id, agentMatricule, carteSocialePath },
        },
      },
      select: { id: true, numConjoint: true },
    });
  }

  async updateCarteSociale(
    id: number,
    newCardPath: string,
    tx?: DbClient,
  ): Promise<void> {
    await this.client(tx).conjoint.update({
      where: { id },
      data: {
        familleAgent: {
          update: { carteSocialePath: newCardPath },
        },
      },
    });
  }

  async findByID(id: number, tx?: DbClient): Promise<ReadConjoint> {
    const conjoint = await this.client(tx).conjoint.findUniqueOrThrow({
      where: { id },
      include: { familleAgent: { include: { personne: true } } },
    });
    return this.toReadConjoint(conjoint);
  }
}