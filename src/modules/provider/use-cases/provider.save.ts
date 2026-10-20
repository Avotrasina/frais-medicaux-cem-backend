import { Injectable } from "@nestjs/common";
import { ProviderRepository } from "../provider.repository.js";
import type { CreateProvider, ReadProvider } from "../types/provider.types.js";
import { ConventionRepository } from "../../convention/convention.repository.js";
import { PrismaService } from "../../../infrastructure/prisma/prisma.service.js";

@Injectable()
export class SaveProviderUseCase {
  constructor(
    private readonly providerRepository: ProviderRepository,
    private readonly conventionRepository: ConventionRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(input: CreateProvider, conventionPaths: string[] = []): Promise<ReadProvider> {
    return this.prisma.$transaction(async (tx) => {
      const provider = await this.providerRepository.create(input, tx);
      await Promise.all(
        conventionPaths.map((path) =>
          this.conventionRepository.create({ path, idProvider: provider.id }, tx),
        ),
      );
      return provider;
    });
  }
}
