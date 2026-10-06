import { Injectable } from "@nestjs/common";
import { PrismaClient } from "../../../generated/prisma/client.js";
import type { Fonction } from "../../../generated/prisma/client.js";
import type { DbClient } from "../../../common/prisma/db-client.type.js";
import type {
  CreateFonction,
  ReadFonction,
  UpdateFonction,
} from "../types/fonction.types.js";
import { HandlePrismaErrors } from "../../../common/decorators/handle-prisma-errors.decorator.js";


@Injectable()
@HandlePrismaErrors({exclude: ["toReadFonction"] })
export class FonctionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private client(tx?: DbClient): DbClient {
    return tx ?? this.prisma;
  }

  private toReadFonction(fonction: Fonction): ReadFonction {
    return { id: fonction.id, nom: fonction.nom };
  }

  async findAll(tx?: DbClient): Promise<ReadFonction[]> {
    const fonctions = await this.client(tx).fonction.findMany();
    return fonctions.map((fonction) => this.toReadFonction(fonction));
  }

  async findOne(id: number, tx?: DbClient): Promise<ReadFonction | null> {
    const fonction = await this.client(tx).fonction.findUnique({
      where: { id },
    });
    return fonction ? this.toReadFonction(fonction) : null;
  }

  async create(fonction: CreateFonction, tx?: DbClient): Promise<ReadFonction> {
    const created = await this.client(tx).fonction.create({ data: fonction });
    return this.toReadFonction(created);
  }

  async update(
    id: number,
    fonction: UpdateFonction,
    tx?: DbClient,
  ): Promise<ReadFonction> {
    const updated = await this.client(tx).fonction.update({
      where: { id },
      data: fonction,
    });
    return this.toReadFonction(updated);
  }

  async delete(id: number, tx?: DbClient): Promise<void> {
    await this.client(tx).fonction.delete({ where: { id } });
  }
}