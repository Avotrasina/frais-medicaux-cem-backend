import { Injectable } from "@nestjs/common";
import { ConjointRepository } from "../repositories/conjoint.repository.js";
import { FileStorageService } from "../../../infrastructure/storage/file-storage.service.js";
import type { UpdatePartialConjoint } from "../types/conjoint.types.js";

@Injectable()
export class UpdateConjointUseCase {
  constructor(
    private readonly conjointRepository: ConjointRepository,
    private readonly fileStorage: FileStorageService,
  ) {}

  async updatePartial(id: number, input: UpdatePartialConjoint): Promise<void> {
    return this.conjointRepository.updatePartial(id, input);
  }

  async updateCarteSociale(id: number, newCardPath: string): Promise<void> {
    const {carteSocialePath:oldPath,...reste} = await this.conjointRepository.readbyID(id);

    await this.conjointRepository.updateCarteSociale(id, newCardPath);

    if (oldPath && oldPath !== newCardPath) {
      await this.fileStorage.deleteImage(oldPath);
    }
  }
}