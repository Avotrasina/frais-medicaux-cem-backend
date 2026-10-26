import { Injectable } from '@nestjs/common';
import { FileStorageService } from '../../../infrastructure/storage/file-storage.service.js';
import { ProviderRepository } from '../repositories/provider.repository.js';
import type { ReadProvider } from '../types/provider.types.js';

@Injectable()
export class UpdateProviderConventionUseCase {
  constructor(
    private readonly providerRepository: ProviderRepository,
    private readonly fileStorage: FileStorageService,
  ) {}

  async execute(idProvider: number, newPath: string): Promise<ReadProvider> {
    const oldPath =
      await this.providerRepository.findConventionPath(idProvider);
    const updated = await this.providerRepository.updateConventionPath(
      idProvider,
      newPath,
    );
    if (oldPath) await this.fileStorage.deletePdf(oldPath);
    return updated;
  }
}
