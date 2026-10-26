import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../infrastructure/prisma/prisma.service.js";
import type { DbClient } from "../../../infrastructure/prisma/db-client.type.js";
import { Sexe } from "../../personne/personne.types.js";
import type {
  CreatedConjointWithAgentFamily,
  ReadConjoint,
  ConjointWitAgentFamilyPersonne,
  CreateConjointRecord
} from "../types/conjoint.types.js";
import { HandlePrismaErrors } from "../../../common/decorators/handle-prisma-errors.decorator.js";
import { SuppresionStatut } from "../../../generated/prisma/enums.js";

@Injectable()
@HandlePrismaErrors()
export class ConjointRepository {
  constructor(private readonly prisma: PrismaService) {}

  private client(tx?: DbClient): DbClient {
    return tx ?? this.prisma;
  }

  private toReadConjoint(
    conjoint: ConjointWitAgentFamilyPersonne,
  ): ReadConjoint {
    const { familleAgent } = conjoint;
    const { personne } = familleAgent;
    return {
      id: conjoint.id,
      nom: personne.nom,
      prenom: personne.prenom,
      dateNaissance: personne.dateNaissance,
      sexe: Sexe[personne.sexe],
      numConjoint: conjoint.numConjoint,
      agentMatricule: familleAgent.agentMatricule,
      carteSocialePath: familleAgent.carteSocialePath,
    };
  }

  async findDeletionRequests(tx?: DbClient): Promise<ReadConjoint[]> {
    const conjoints = await this.client(tx).conjoint.findMany({
      where: { suppressionStatut: SuppresionStatut.EN_ATTENTE },
      include: { familleAgent: { include: { personne: true } } },
      orderBy: { numConjoint: "asc" },
    });
    return conjoints.map((conjoint) => this.toReadConjoint(conjoint));
  }

  async create(
    conjoint: CreateConjointRecord,
    tx?: DbClient,
  ): Promise<CreatedConjointWithAgentFamily> {
    const { id, agentMatricule, carteSocialePath } = conjoint;

    return this.client(tx).conjoint.create({
      data: {
        familleAgent: {
          create: { id, agentMatricule, carteSocialePath },
        },
      },
      include:{familleAgent:true},
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
    const conjoint = await this.client(tx).conjoint.findFirstOrThrow({
      where: { id },
      include: { familleAgent: { include: { personne: true } } },
    });
    return this.toReadConjoint(conjoint);
  }
}