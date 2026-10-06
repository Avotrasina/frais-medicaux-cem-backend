import { Injectable } from "@nestjs/common";
import { PrismaClient } from "../../../generated/prisma/client.js";
import type { DbClient } from "../../../infrastructure/prisma/db-client.type.js";
import type {
  CreateConjoint,
  ReadConjoint,
  UpdateConjoint,
} from "../types/conjoint.types.js";
import { HandlePrismaErrors } from "../../../common/decorators/handle-prisma-errors.decorator.js";


@Injectable()
@HandlePrismaErrors()
export class ConjointRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private client(tx?: DbClient): DbClient {
    return tx ?? this.prisma;
  }

  async findAll(tx?: DbClient): Promise<ReadConjoint[]> {
    return this.client(tx).conjoint.findMany();
  }

  async findOne(id: number, tx?: DbClient): Promise<ReadConjoint | null> {
    return this.client(tx).conjoint.findUnique({ where: { id } });
  }

  async findByNumConjoint(
    numConjoint: number,
    tx?: DbClient,
  ): Promise<ReadConjoint | null> {
    return this.client(tx).conjoint.findUnique({ where: { numConjoint } });
  }

  async create(conjoint: CreateConjoint, tx?: DbClient): Promise<ReadConjoint> {
    return this.client(tx).conjoint.create({ data: conjoint });
  }

  async update(
    id: number,
    conjoint: UpdateConjoint,
    tx?: DbClient,
  ): Promise<ReadConjoint> {
    return this.client(tx).conjoint.update({ where: { id }, data: conjoint });
  }

  async delete(id: number, tx?: DbClient): Promise<void> {
    await this.client(tx).conjoint.delete({ where: { id } });
  }
}