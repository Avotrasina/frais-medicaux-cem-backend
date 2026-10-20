import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../infrastructure/prisma/prisma.service.js";
import { FileStorageService } from "../../../infrastructure/storage/file-storage.service.js";
import { ConventionRepository } from "../../convention/convention.repository.js";
import type { ReadConvenion } from "../../convention/types/convention.types.js";

@Injectable()
export class UpdateProviderConventionUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly conventionRepository: ConventionRepository,
    private readonly fileStorage: FileStorageService,
  ) {}

  async execute(
    idProvider: number,
    newPaths: string[],
  ): Promise<ReadConvenion[]> {
    const oldPaths = await this.conventionRepository.findPathsByIDProvider(idProvider);

    const conventions = await this.prisma.$transaction(async (tx) => {
      await this.conventionRepository.deleteBYProviderID(idProvider, tx);
      return Promise.all(
        newPaths.map((path) =>
          this.conventionRepository.create({ path, idProvider }, tx),
        ),
      );
    });

    await Promise.all(oldPaths.map((path) => this.fileStorage.deleteImage(path)));
    return conventions;
  }
}
