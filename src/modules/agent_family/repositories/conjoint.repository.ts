import { Injectable } from "@nestjs/common";
import { PrismaClient, Prisma } from "../../../generated/prisma/client.js";
import type { DbClient } from "../../../infrastructure/prisma/db-client.type.js";
import type {
  CreateConjoint,
  ReadConjoint,
} from "../types/conjoint.types.js";
import { Sexe } from "../../personne/personne.types.js";
import { HandlePrismaErrors } from "../../../common/decorators/handle-prisma-errors.decorator.js";

type ConjointWithFamilleAgentPersonne = Prisma.ConjointGetPayload<{
  include: { familleAgent: { include: { personne: true } } };
}>;

type CreateConjointRecord = Omit<CreateConjoint, "personne"> & { id: number };

@Injectable()
@HandlePrismaErrors()
export class ConjointRepository {
  constructor(private readonly prisma: PrismaClient) {}

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
  ): Promise<number> {
    const { id, agentMatricule, carteSocialePath } = conjoint;

    const created = await this.client(tx).conjoint.create({
      data: {
        familleAgent: {
          create: { id, agentMatricule, carteSocialePath },
        },
      },
      select: { id: true },
    });
    return created.id;
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

  async readbyID(id: number, tx?: DbClient): Promise<ReadConjoint> {
    const conjoint = await this.client(tx).conjoint.findUniqueOrThrow({
      where: { id },
      include: { familleAgent: { include: { personne: true } } },
    });
    return this.toReadConjoint(conjoint);
  }
}