import { Injectable, NotFoundException } from "@nestjs/common";
import { basename } from "node:path";
import { ProviderRepository } from "../provider.repository.js";
import type { FilterProvider, ReadProvider } from "../types/provider.types.js";
import { FileStorageService } from "../../../infrastructure/storage/file-storage.service.js";

@Injectable()
export class ReadProviderUseCase {
  constructor(
    private readonly providerRepository: ProviderRepository,
    private readonly fileStorage: FileStorageService,
  ) {}

  async readAll(): Promise<ReadProvider[]> {
    return this.providerRepository.findAll();
  }

  async readDeletionRequests(): Promise<ReadProvider[]> {
    return this.providerRepository.findDeletionRequests();
  }

  async filter(filter: FilterProvider): Promise<ReadProvider[]> {
    return this.providerRepository.findByFilter(filter);
  }

  async readConvention(idProvider: number): Promise<{ buffer: Buffer; fileName: string }> {
    const path = await this.providerRepository.findConventionPath(idProvider);
    if (!path) throw new NotFoundException("Aucune convention PDF trouvée pour ce provider");
    const buffer = await this.fileStorage.readPdf(path);
    if (!buffer) throw new NotFoundException("PDF de convention introuvable sur le disque");
    return { buffer, fileName: basename(path) };
  }
}
