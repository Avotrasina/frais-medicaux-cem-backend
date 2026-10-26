import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import type { Prisma } from '../../../generated/prisma/client.js';
import type { DbClient } from '../../../infrastructure/prisma/db-client.type.js';
import { Sexe } from '../../personne/personne.types.js';
import type { ReadEnfant, CreateEnfant } from '../types/enfant.types.js';
import { HandlePrismaErrors } from '../../../common/decorators/handle-prisma-errors.decorator.js';
import { SuppresionStatut } from '../../../generated/prisma/enums.js';

type EnfantWithFamilyPerson = Prisma.EnfantGetPayload<{
  include: { familleAgent: { include: { personne: true } } };
}>;

type CreatedEnfantWithFamily = Prisma.EnfantGetPayload<{
  include: { familleAgent: true };
}>;

type CreateEnfantRecord = Omit<CreateEnfant, 'personne'> & {
  id: number;
};

@Injectable()
@HandlePrismaErrors()
export class EnfantRepository {
  constructor(private readonly prisma: PrismaService) {}

  private client(tx?: DbClient): DbClient {
    return tx ?? this.prisma;
  }

  private toReadEnfant(enfant: EnfantWithFamilyPerson): ReadEnfant {
    const { familleAgent } = enfant;
    const { personne } = familleAgent;
    return {
      id: enfant.id,
      nom: personne.nom,
      prenom: personne.prenom,
      dateNaissance: personne.dateNaissance,
      sexe: Sexe[personne.sexe],
      numEnfant: enfant.numEnfant,
      agentMatricule: familleAgent.agentMatricule,
      carteSocialePath: familleAgent.carteSocialePath,
    };
  }

  async findDeletionRequests(tx?: DbClient): Promise<ReadEnfant[]> {
    const enfants = await this.client(tx).enfant.findMany({
      where: { suppressionStatut: SuppresionStatut.EN_ATTENTE },
      include: { familleAgent: { include: { personne: true } } },
      orderBy: { numEnfant: 'asc' },
    });
    return enfants.map((enfant) => this.toReadEnfant(enfant));
  }

  async create(
    enfant: CreateEnfantRecord,
    tx?: DbClient,
  ): Promise<CreatedEnfantWithFamily> {
    const { id, agentMatricule, carteSocialePath } = enfant;

    return this.client(tx).enfant.create({
      data: {
        familleAgent: {
          create: { id, agentMatricule, carteSocialePath },
        },
      },
      include: {
        familleAgent: true,
      },
    });
  }

  async findById(id: number, tx?: DbClient): Promise<ReadEnfant> {
    const enfant = await this.client(tx).enfant.findFirstOrThrow({
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
