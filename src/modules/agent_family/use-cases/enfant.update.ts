import { Injectable } from "@nestjs/common";
import { EnfantRepository } from "../repositories/enfant.repository.js";
import { FileStorageService } from "../../../infrastructure/storage/file-storage.service.js";
import type { UpdatePartialEnfant } from "../types/enfant.types.js";

@Injectable()
export class UpdateEnfantUseCase {
  constructor(
    private readonly enfantRepository: EnfantRepository,
    private readonly fileStorage: FileStorageService,
  ) {}

  async updatePartial(id: number, input: UpdatePartialEnfant): Promise<void> {
    return this.enfantRepository.updatePartial(id, input);
  }

  async updateCarteSociale(id: number, newCardPath: string): Promise<void> {
    const {carteSocialePath:oldPath,...reste} = await this.enfantRepository.readbyID(id);

    await this.enfantRepository.updateCarteSociale(id, newCardPath);

    if (oldPath && oldPath !== newCardPath) {
      await this.fileStorage.deleteImage(oldPath);
    }
  }
}