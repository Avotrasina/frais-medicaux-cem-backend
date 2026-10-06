import { Injectable } from "@nestjs/common";
import { PrismaClient } from "../../../generated/prisma/client.js";
import type { Direction } from "../../../generated/prisma/client.js";
import type { DbClient } from "../../../infrastructure/prisma/db-client.type.js";
import type {
  CreateDirection,
  ReadDirection,
  UpdateDirection,
} from "../types/direction.types.js";
import { HandlePrismaErrors } from "../../../common/decorators/handle-prisma-errors.decorator.js";

@Injectable()
@HandlePrismaErrors({ exclude: ["toReadDirection"] })
export class DirectionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private client(tx?: DbClient): DbClient {
    return tx ?? this.prisma;
  }

  private toReadDirection(direction: Direction): ReadDirection {
    return {
      codeDirection: direction.codeDirection,
      nom: direction.nom,
    };
  }

  async findAll(tx?: DbClient): Promise<ReadDirection[]> {
    const directions = await this.client(tx).direction.findMany();
    return directions.map((direction) => this.toReadDirection(direction));
  }

  async findOne(
    codeDirection: string,
    tx?: DbClient,
  ): Promise<ReadDirection | null> {
    const direction = await this.client(tx).direction.findUnique({
      where: { codeDirection },
    });
    return direction ? this.toReadDirection(direction) : null;
  }

  async create(
    direction: CreateDirection,
    tx?: DbClient,
  ): Promise<ReadDirection> {
    const created = await this.client(tx).direction.create({
      data: direction,
    });
    return this.toReadDirection(created);
  }

  async update(
    codeDirection: string,
    direction: UpdateDirection,
    tx?: DbClient,
  ): Promise<ReadDirection> {
    const updated = await this.client(tx).direction.update({
      where: { codeDirection },
      data: direction,
    });
    return this.toReadDirection(updated);
  }

  async delete(codeDirection: string, tx?: DbClient): Promise<void> {
    await this.client(tx).direction.delete({ where: { codeDirection } });
  }
}