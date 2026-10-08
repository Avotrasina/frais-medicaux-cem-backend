import { Injectable } from "@nestjs/common";
import { PrismaClient,Prisma} from "../../../generated/prisma/client.js";
import type { DbClient } from "../../../infrastructure/prisma/db-client.type.js";
import type {
  CreateConjoint,
  UpdatePartialConjoint,
  ReadConjoint
} from "../types/conjoint.types.js";
import { HandlePrismaErrors } from "../../../common/decorators/handle-prisma-errors.decorator.js";

type ConjointWithFamilleAgent = Prisma.ConjointGetPayload<{
  include: { familleAgent: true };
}>;

@Injectable()
@HandlePrismaErrors()
export class ConjointRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private client(tx?: DbClient): DbClient {
    return tx ?? this.prisma;
  }

  private toReadConjoint(conjoint: ConjointWithFamilleAgent): ReadConjoint {
    return {
      id: conjoint.id,
      numConjoint: conjoint.numConjoint,
      agentMatricule: conjoint.familleAgent.agentMatricule,
      carteSocialePath: conjoint.familleAgent.carteSocialePath,
    };
  }

  async create(conjoint: CreateConjoint, tx?: DbClient): Promise<number> {
    const { agentMatricule, carteSocialePath, personne } = conjoint;

    const created = await this.client(tx).conjoint.create({
      data: {
        familleAgent: {
          create: {
            carteSocialePath,
            agent: { connect: { matricule: agentMatricule } },
            personne: { create: personne },
          },
        },
      },
      select: { id: true },
    });
    return created.id;
  }

  async updatePartial(
    id: number,
    conjoint: UpdatePartialConjoint,
    tx?: DbClient,
  ): Promise<void> {
    const { personne } = conjoint;
    if (!personne || Object.keys(personne).length === 0) return;

    await this.client(tx).conjoint.update({
      where: { id },
      data: {
        familleAgent: {
          update: { personne: { update: personne } },
        },
      },
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

  async readbyID(id: number, tx?: DbClient): Promise<ReadConjoint> {
    const conjoint = await this.client(tx).conjoint.findUniqueOrThrow({
      where: { id },
      include: { familleAgent: true },
    });
    return this.toReadConjoint(conjoint);
  }
  
  async delete(id: number, tx?: DbClient): Promise<void> {
    await this.client(tx).familleAgent.delete({ where: { id } });
  }
}