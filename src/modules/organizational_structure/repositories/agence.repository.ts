import { Injectable } from "@nestjs/common";
import { PrismaClient } from "../../../generated/prisma/client.js";
import type { Agence } from "../../../generated/prisma/client.js";
import type { DbClient } from "../../../infrastructure/prisma/db-client.type.js";
import type {
  CreateAgence,
  ReadAgence,
  UpdateAgence,
} from "../types/agence.types.js";
import { HandlePrismaErrors } from "../../../common/decorators/handle-prisma-errors.decorator.js";

@Injectable()
@HandlePrismaErrors({ exclude: ["toReadAgence"] })
export class AgenceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private client(tx?: DbClient): DbClient {
    return tx ?? this.prisma;
  }

  private toReadAgence(agence: Agence): ReadAgence {
    return {
      codeAgence: agence.codeAgence,
      nomAgence: agence.nomAgence,
    };
  }

  async findAll(tx?: DbClient): Promise<ReadAgence[]> {
    const agences = await this.client(tx).agence.findMany();
    return agences.map((agence) => this.toReadAgence(agence));
  }


  async create(agence: CreateAgence, tx?: DbClient): Promise<ReadAgence> {
    const created = await this.client(tx).agence.create({ data: agence });
    return this.toReadAgence(created);
  }

  async update(
    codeAgence: string,
    agence: UpdateAgence,
    tx?: DbClient,
  ): Promise<ReadAgence> {
    const updated = await this.client(tx).agence.update({
      where: { codeAgence },
      data: agence,
    });
    return this.toReadAgence(updated);
  }

  async delete(codeAgence: string, tx?: DbClient): Promise<void> {
    await this.client(tx).agence.delete({ where: { codeAgence } });
  }
}