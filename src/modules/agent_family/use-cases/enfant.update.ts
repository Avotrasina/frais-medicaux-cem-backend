import { Injectable } from "@nestjs/common";
import { PrismaClient } from "../../../generated/prisma/client.js";
import { EnfantRepository } from "../repositories/enfant.repository.js";
import { PersonneRepository } from "../../personne/personne.repository.js";
import { FileStorageService } from "../../../infrastructure/storage/file-storage.service.js";
import { omitNullish } from "../../../common/utils/omit-nullish.js";
import type { UpdatePartialEnfant } from "../types/enfant.types.js";

@Injectable()
export class UpdateEnfantUseCase {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly personneRepository: PersonneRepository,
    private readonly enfantRepository: EnfantRepository,
    private readonly fileStorage: FileStorageService,
  ) {}

  async updatePartial(id: number, input: UpdatePartialEnfant): Promise<void> {
    const { personne } = input;
    if (!personne || Object.keys(omitNullish(personne)).length === 0) return;

    await this.prisma.$transaction(async (tx) => {
      await this.enfantRepository.findByID(id, tx);
      await this.personneRepository.update(id, personne, tx);
    });
  }

  async updateCarteSociale(id: number, newCardPath: string): Promise<void> {
    const { carteSocialePath: oldPath, ...reste } =
      await this.enfantRepository.findByID(id);

    await this.enfantRepository.updateCarteSociale(id, newCardPath);

    if (oldPath && oldPath !== newCardPath) {
      await this.fileStorage.deleteImage(oldPath);
    }
  }
}