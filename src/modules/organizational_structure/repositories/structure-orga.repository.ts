import { Injectable } from "@nestjs/common";
import { PrismaClient } from "../../../generated/prisma/client.js";
import type { StructureOrganisationnelle } from "../../../generated/prisma/client.js";
import type { DbClient } from "../../../infrastructure/prisma/db-client.type.js";
import {
  StructureOrganisationnelleType,
  type CreateStructureOrganisationnelle,
  type ReadStructureOrganisationnelle,
  type UpdateStructureOrganisationnelle,
} from "../types/structure-orga.types.js";
import { HandlePrismaErrors } from "../../../common/decorators/handle-prisma-errors.decorator.js";

@Injectable()
@HandlePrismaErrors({ exclude: ["toReadStructureOrganisationnelle"] })
export class StructureOrganisationnelleRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private client(tx?: DbClient): DbClient {
    return tx ?? this.prisma;
  }

  private toReadStructureOrganisationnelle(
    structure: StructureOrganisationnelle,
  ): ReadStructureOrganisationnelle {
    return {
      id: structure.id,
      structureOrganisationnelleType:
        StructureOrganisationnelleType[structure.structureOrganisationnelleType],
    };
  }

  async findAll(tx?: DbClient): Promise<ReadStructureOrganisationnelle[]> {
    const structures = await this.client(tx).structureOrganisationnelle.findMany();
    return structures.map((structure) =>
      this.toReadStructureOrganisationnelle(structure),
    );
  }


  async create(
    structure: CreateStructureOrganisationnelle,
    tx?: DbClient,
  ): Promise<ReadStructureOrganisationnelle> {
    const created = await this.client(tx).structureOrganisationnelle.create({
      data: structure,
    });
    return this.toReadStructureOrganisationnelle(created);
  }

  async update(
    id: string,
    structure: UpdateStructureOrganisationnelle,
    tx?: DbClient,
  ): Promise<ReadStructureOrganisationnelle> {
    const updated = await this.client(tx).structureOrganisationnelle.update({
      where: { id },
      data: structure,
    });
    return this.toReadStructureOrganisationnelle(updated);
  }

  async delete(id: string, tx?: DbClient): Promise<void> {
    await this.client(tx).structureOrganisationnelle.delete({ where: { id } });
  }
}