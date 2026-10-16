import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/prisma/prisma.service.js";
import type { Fonction } from "../../generated/prisma/client.js";
import type { DbClient } from "../../infrastructure/prisma/db-client.type.js";
import type {
  CreateFonction,
  ReadFonction,
  UpdatePartialFonction,
} from "./types/fonction.types.js";
import { HandlePrismaErrors } from "../../common/decorators/handle-prisma-errors.decorator.js";

@Injectable()
@HandlePrismaErrors({ exclude: ["toReadFonction"] })
export class FonctionRepository {
  constructor(private readonly prisma: PrismaService) {}

  private client(tx?: DbClient): DbClient {
    return tx ?? this.prisma;
  }

  private toReadFonction(fonction: Fonction): ReadFonction {
    return { id: fonction.id, nom: fonction.nom };
  }

  async findAll(tx?: DbClient): Promise<ReadFonction[]> {
    const fonctions = await this.client(tx).fonction.findMany({
      orderBy: { nom: "asc" },
    });
    return fonctions.map((f) => this.toReadFonction(f));
  }

  async findByID(id: number, tx?: DbClient): Promise<ReadFonction> {
    const fonction = await this.client(tx).fonction.findUniqueOrThrow({
      where: { id },
    });
    return this.toReadFonction(fonction);
  }

  async create(fonction: CreateFonction, tx?: DbClient): Promise<ReadFonction> {
    const created = await this.client(tx).fonction.create({
      data: { nom: fonction.nom },
    });
    return this.toReadFonction(created);
  }

  async updatePartial(
    id: number,
    fonction: UpdatePartialFonction,
    tx?: DbClient,
  ): Promise<ReadFonction> {
    const updated = await this.client(tx).fonction.update({
      where: { id },
      data: { nom: fonction.nom ?? undefined },
    });
    return this.toReadFonction(updated);
  }
}