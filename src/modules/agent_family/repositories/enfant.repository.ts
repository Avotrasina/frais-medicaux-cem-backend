import { Injectable } from "@nestjs/common";
import { PrismaClient } from "../../../generated/prisma/client.js";
import type { DbClient } from "../../../infrastructure/prisma/db-client.type.js";
import type {
  CreateEnfant,
  ReadEnfant,
  UpdateEnfant,
} from "../types/enfant.types.js";
import { HandlePrismaErrors } from "../../../common/decorators/handle-prisma-errors.decorator.js";



@Injectable()
@HandlePrismaErrors()
export class EnfantRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private client(tx?: DbClient): DbClient {
    return tx ?? this.prisma;
  }

  async findAll(tx?: DbClient): Promise<ReadEnfant[]> {
    return this.client(tx).enfant.findMany();
  }

  async findOne(id: number, tx?: DbClient): Promise<ReadEnfant | null> {
    return this.client(tx).enfant.findUnique({ where: { id } });
  }

  async findByNumEnfant(
    numEnfant: number,
    tx?: DbClient,
  ): Promise<ReadEnfant | null> {
    return this.client(tx).enfant.findUnique({ where: { numEnfant } });
  }

  async create(enfant: CreateEnfant, tx?: DbClient): Promise<ReadEnfant> {
    return this.client(tx).enfant.create({ data: enfant });
  }

  async update(
    id: number,
    enfant: UpdateEnfant,
    tx?: DbClient,
  ): Promise<ReadEnfant> {
    return this.client(tx).enfant.update({ where: { id }, data: enfant });
  }

  async delete(id: number, tx?: DbClient): Promise<void> {
    await this.client(tx).enfant.delete({ where: { id } });
  }
}