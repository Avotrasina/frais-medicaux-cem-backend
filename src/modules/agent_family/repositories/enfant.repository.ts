import { Injectable } from "@nestjs/common";
import { PrismaClient,Prisma} from "../../../generated/prisma/client.js";
import type { DbClient } from "../../../infrastructure/prisma/db-client.type.js";
import type { CreateEnfant, UpdatePartialEnfant,ReadEnfant} from "../types/enfant.types.js";
import { HandlePrismaErrors } from "../../../common/decorators/handle-prisma-errors.decorator.js";

type EnfantWithFamilleAgent = Prisma.EnfantGetPayload<{
  include: { familleAgent: true };
}>;

@Injectable()
@HandlePrismaErrors()
export class EnfantRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private client(tx?: DbClient): DbClient {
    return tx ?? this.prisma;
  }

  private toReadEnfant(enfant: EnfantWithFamilleAgent): ReadEnfant {
    return {
      id: enfant.id,
      numEnfant: enfant.numEnfant,
      agentMatricule: enfant.familleAgent.agentMatricule,
      carteSocialePath: enfant.familleAgent.carteSocialePath,
    };
  }

  async create(enfant: CreateEnfant, tx?: DbClient): Promise<number> {
    const { agentMatricule, carteSocialePath, personne } = enfant;

    const created = await this.client(tx).enfant.create({
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

  async readbyID(id: number, tx?: DbClient): Promise<ReadEnfant> {
    const enfant = await this.client(tx).enfant.findUniqueOrThrow({
      where: { id },
      include: { familleAgent: true },
    });
    return this.toReadEnfant(enfant);
  }

    async updatePartial(
      id: number,
      enfant: UpdatePartialEnfant,
      tx?: DbClient,
    ): Promise<void> {
      const { personne } = enfant;
      if (!personne || Object.keys(personne).length === 0) return;

      await this.client(tx).enfant.update({
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
      await this.client(tx).enfant.update({
        where: { id },
        data: {
          familleAgent: {
            update: { carteSocialePath: newCardPath },
          },
        },
      });
    }

  async delete(id: number, tx?: DbClient): Promise<void> {
    await this.client(tx).familleAgent.delete({ where: { id } });
  }
}