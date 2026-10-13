import { Injectable } from "@nestjs/common";
import { PrismaClient } from "../../../generated/prisma/client.js";
import { ConjointRepository } from "../repositories/conjoint.repository.js";
import { PersonneRepository } from "../../personne/personne.repository.js";
import { FileStorageService } from "../../../infrastructure/storage/file-storage.service.js";
import { omitNullish } from "../../../common/utils/omit-nullish.js";
import type { UpdatePartialConjoint } from "../types/conjoint.types.js";

@Injectable()
export class UpdateConjointUseCase {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly personneRepository: PersonneRepository,
    private readonly conjointRepository: ConjointRepository,
    private readonly fileStorage: FileStorageService,
  ) {}

  async updatePartial(id: number, input: UpdatePartialConjoint): Promise<void> {
    const { personne } = input;
    if (!personne || Object.keys(omitNullish(personne)).length === 0) return;

    await this.prisma.$transaction(async (tx) => {
      await this.conjointRepository.findByID(id, tx);
      await this.personneRepository.update(id, personne, tx);
    });
  }

  async updateCarteSociale(id: number, newCardPath: string): Promise<void> {
    const { carteSocialePath: oldPath, ...reste } =
      await this.conjointRepository.findByID(id);

    await this.conjointRepository.updateCarteSociale(id, newCardPath);

    if (oldPath && oldPath !== newCardPath) {
      await this.fileStorage.deleteImage(oldPath);
    }
  }
}