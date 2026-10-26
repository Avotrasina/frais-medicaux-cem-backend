import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../infrastructure/prisma/prisma.service.js";
import type { Service } from "../../../generated/prisma/client.js";
import type { DbClient } from "../../../infrastructure/prisma/db-client.type.js";
import type {
  CreateService,
  ReadService,
  UpdateService,
} from "../types/service.types.js";
import { HandlePrismaErrors } from "../../../common/decorators/handle-prisma-errors.decorator.js";
import { SuppresionStatut } from "../../../generated/prisma/enums.js";

@Injectable()
@HandlePrismaErrors({ exclude: ["toReadService"] })
export class ServiceRepository {
  constructor(private readonly prisma: PrismaService) {}

  private client(tx?: DbClient): DbClient {
    return tx ?? this.prisma;
  }

  private toReadService(service: Service): ReadService {
    return {
      codeService: service.codeService,
      nom: service.nom,
      codeDirection: service.codeDirection,
    };
  }

  async findAll(tx?: DbClient): Promise<ReadService[]> {
    const services = await this.client(tx).service.findMany({
      orderBy: [{ codeDirection: "asc" }, { nom: "asc" }],
    });
    return services.map((service) => this.toReadService(service));
  }

  async findDeletionRequests(tx?: DbClient): Promise<ReadService[]> {
    const services = await this.client(tx).service.findMany({
      where: { suppressionStatut: SuppresionStatut.EN_ATTENTE },
      orderBy: [{ codeDirection: "asc" }, { nom: "asc" }],
    });
    return services.map((service) => this.toReadService(service));
  }

  async findByCodeDirection(
    codeDirection: string,
    tx?: DbClient,
  ): Promise<ReadService[]> {
    const services = await this.client(tx).service.findMany({
      where: { codeDirection },
      orderBy: { nom: "asc" },
    });
    return services.map((service) => this.toReadService(service));
  }

  async findByID(codeService:string,tx?:DbClient):Promise<ReadService|null>{
    const service = await this.client(tx).service.findFirst({where:{codeService}})
    return service ?  this.toReadService(service) : null
  }

  async create(service: CreateService, tx?: DbClient): Promise<ReadService> {
    const created = await this.client(tx).service.create({ data: service });
    return this.toReadService(created);
  }

  async update(
    codeService: string,
    service: UpdateService,
    tx?: DbClient,
  ): Promise<ReadService> {
    const updated = await this.client(tx).service.update({
      where: { codeService },
      data: service,
    });
    return this.toReadService(updated);
  }

  async delete(codeService: string, tx?: DbClient): Promise<void> {
    await this.client(tx).service.delete({ where: { codeService } });
  }
}