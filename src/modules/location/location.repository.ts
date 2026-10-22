import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/prisma/prisma.service.js";
import type { Lieu } from "../../generated/prisma/client.js";
import type { DbClient } from "../../infrastructure/prisma/db-client.type.js";
import type {
  CreateLieu,
  ReadLieu,
  UpdatePartialLieu,
} from "./types/location.types.js";
import { HandlePrismaErrors } from "../../common/decorators/handle-prisma-errors.decorator.js";

@Injectable()
@HandlePrismaErrors({ exclude: ["toReadLieu"] })
export class LocationRepository {
  constructor(private readonly prisma: PrismaService) {}

  private client(tx?: DbClient): DbClient {
    return tx ?? this.prisma;
  }

  private toReadLieu(lieu: Lieu): ReadLieu {
    return { id: lieu.id, nom: lieu.nom };
  }

  async findAll(tx?: DbClient): Promise<ReadLieu[]> {
    const lieux = await this.client(tx).lieu.findMany({
      orderBy: { nom: "asc" },
    });
    return lieux.map((l) => this.toReadLieu(l));
  }

  async findByID(id: number, tx?: DbClient): Promise<ReadLieu> {
    const lieu = await this.client(tx).lieu.findFirstOrThrow({
      where: { id },
    });
    return this.toReadLieu(lieu);
  }

  async create(lieu: CreateLieu, tx?: DbClient): Promise<ReadLieu> {
    const created = await this.client(tx).lieu.create({
      data: { nom: lieu.nom },
    });
    return this.toReadLieu(created);
  }

  async updatePartial(
    id: number,
    lieu: UpdatePartialLieu,
    tx?: DbClient,
  ): Promise<ReadLieu> {
    const updated = await this.client(tx).lieu.update({
      where: { id },
      data: { nom: lieu.nom ?? undefined },
    });
    return this.toReadLieu(updated);
  }
}