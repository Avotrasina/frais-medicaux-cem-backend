import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import type { Personne } from '../../../generated/prisma/client.js';
import type { DbClient } from '../../../infrastructure/prisma/db-client.type.js';
import {
  Sexe,
  type CreatePersonne,
  type ReadPersonne,
  type UpdatePartialPersonne,
} from '../personne.types.js';
import { HandlePrismaErrors } from '../../../common/decorators/handle-prisma-errors.decorator.js';

@Injectable()
@HandlePrismaErrors({ exclude: ['toReadPersonne'] })
export class PersonneRepository {
  constructor(private readonly prisma: PrismaService) {}

  private client(tx?: DbClient): DbClient {
    return tx ?? this.prisma;
  }

  private toReadPersonne(personne: Personne): ReadPersonne {
    return { ...personne, sexe: Sexe[personne.sexe] };
  }

  async findById(id: number, tx?: DbClient): Promise<ReadPersonne> {
    const personne = await this.client(tx).personne.findFirstOrThrow({
      where: { id },
    });
    return this.toReadPersonne(personne);
  }

  async create(personne: CreatePersonne, tx?: DbClient): Promise<ReadPersonne> {
    const createdPersonne = await this.client(tx).personne.create({
      data: personne,
    });
    return this.toReadPersonne(createdPersonne);
  }

  async update(
    id: number,
    personne: UpdatePartialPersonne,
    tx?: DbClient,
  ): Promise<ReadPersonne> {
    const updatedPersonne = await this.client(tx).personne.update({
      where: { id },
      data: {
        nom: personne.nom ? personne.nom : undefined,
        prenom: personne.prenom ? personne.prenom : undefined,
        dateNaissance: personne.dateNaissance
          ? personne.dateNaissance
          : undefined,
        sexe: personne.sexe ? personne.sexe : undefined,
      },
    });
    return this.toReadPersonne(updatedPersonne);
  }

  async delete(id: number, tx?: DbClient): Promise<void> {
    await this.client(tx).personne.delete({ where: { id } });
  }
}
