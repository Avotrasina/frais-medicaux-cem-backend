import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../infrastructure/prisma/prisma.service.js";
import type {
  Direction,
  Prisma,
} from "../../../generated/prisma/client.js";
import type { DbClient } from "../../../infrastructure/prisma/db-client.type.js";
import type {
  CreateDirection,
  ReadDirection,
  ReadDirectionWithServices,
  UpdateDirection,
} from "../types/direction.types.js";
import { HandlePrismaErrors } from "../../../common/decorators/handle-prisma-errors.decorator.js";
import { SuppresionStatut } from "../../../generated/prisma/enums.js";

type DirectionWithServices = Prisma.DirectionGetPayload<{
  include: { services: true };
}>;

@Injectable()
@HandlePrismaErrors({
  exclude: ["toReadDirection", "toReadDirectionWithServices"],
})
export class DirectionRepository {
  constructor(private readonly prisma: PrismaService) {}

  private client(tx?: DbClient): DbClient {
    return tx ?? this.prisma;
  }

  private toReadDirection(direction: Direction): ReadDirection {
    return {
      codeDirection: direction.codeDirection,
      nom: direction.nom,
    };
  }

  private toReadDirectionWithServices(
    direction: DirectionWithServices,
  ): ReadDirectionWithServices {
    return {
      ...this.toReadDirection(direction),
      services: direction.services.map((service) => ({
        codeService: service.codeService,
        nom: service.nom,
        codeDirection: service.codeDirection,
      })),
    };
  }

  async findAll(tx?: DbClient): Promise<ReadDirection[]> {
    const directions = await this.client(tx).direction.findMany({
      orderBy: { nom: "asc" },
    });
    return directions.map((direction) => this.toReadDirection(direction));
  }

  async findByID(codeDirection:string,tx?:DbClient):Promise<ReadDirection>{
    const direction = await this.client(tx).direction.findFirstOrThrow({
      where:{codeDirection}
    })
    return this.toReadDirection(direction);
  }

  async findAllWithServices(
    tx?: DbClient,
  ): Promise<ReadDirectionWithServices[]> {
    const directions = await this.client(tx).direction.findMany({
      include: { services: { orderBy: { nom: "asc" } } },
      orderBy: { nom: "asc" },
    });
    return directions.map((direction) =>
      this.toReadDirectionWithServices(direction),
    );
  }

  async findDeletionRequestsWithServices(
    tx?: DbClient,
  ): Promise<ReadDirectionWithServices[]> {
    const directions = await this.client(tx).direction.findMany({
      where: { suppressionStatut: SuppresionStatut.EN_ATTENTE },
      include: { services: { orderBy: { nom: "asc" } } },
      orderBy: { nom: "asc" },
    });
    return directions.map((direction) =>
      this.toReadDirectionWithServices(direction),
    );
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