import { Injectable } from "@nestjs/common";
import { PrismaClient, Prisma } from "../../../generated/prisma/client.js";
import type { DbClient } from "../../../infrastructure/prisma/db-client.type.js";
import type { CreateEnfant, ReadEnfant } from "../types/enfant.types.js";
import { Sexe } from "../../personne/personne.types.js";
import { HandlePrismaErrors } from "../../../common/decorators/handle-prisma-errors.decorator.js";

type EnfantWithFamilleAgentPersonne = Prisma.EnfantGetPayload<{
  include: { familleAgent: { include: { personne: true } } };
}>;

type CreateEnfantRecord = Omit<CreateEnfant, "personne"> & { id: number };

@Injectable()
@HandlePrismaErrors()
export class EnfantRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private client(tx?: DbClient): DbClient {
    return tx ?? this.prisma;
  }

  private toReadEnfant(enfant: EnfantWithFamilleAgentPersonne): ReadEnfant {
    const { familleAgent } = enfant;
    const { personne } = familleAgent;
    return {
      ...personne,
      numEnfant: enfant.numEnfant,
      agentMatricule: familleAgent.agentMatricule,
      carteSocialePath: familleAgent.carteSocialePath,
    };
  }

  async create(enfant: CreateEnfantRecord, tx?: DbClient): Promise<number> {
    const { id, agentMatricule, carteSocialePath } = enfant;

    const created = await this.client(tx).enfant.create({
      data: {
        familleAgent: {
          create: { id, agentMatricule, carteSocialePath },
        },
      },
      select: { id: true },
    });
    return created.id;
  }

  async readbyID(id: number, tx?: DbClient): Promise<ReadEnfant> {
    const enfant = await this.client(tx).enfant.findUniqueOrThrow({
      where: { id },
      include: { familleAgent: { include: { personne: true } } },
    });
    return this.toReadEnfant(enfant);
  }

  async updateCarteSociale(
    id: number,
    newCardPath: string,
    tx?: DbClient,
  ): Promise<void> {
    await this.client(tx).enfant.update({
      where: { id },
      data: {
        familleAgent: {
          update: { carteSocialePath: newCardPath },
        },
      },
    });
  }
}