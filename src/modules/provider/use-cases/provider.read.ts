import { Injectable, NotFoundException } from '@nestjs/common';
import { basename } from 'node:path';
import { ProviderRepository } from '../repositories/provider.repository.js';
import type { FilterProvider, ReadProvider } from '../types/provider.types.js';
import { FileStorageService } from '../../../infrastructure/storage/file-storage.service.js';

@Injectable()
export class ReadProviderUseCase {
  constructor(
    private readonly providerRepository: ProviderRepository,
    private readonly fileStorage: FileStorageService,
  ) {}

  async findAll(): Promise<ReadProvider[]> {
    return this.providerRepository.findAll();
  }

  async findDeletionRequests(): Promise<ReadProvider[]> {
    return this.providerRepository.findDeletionRequests();
  }

  async findByFilter(filter: FilterProvider): Promise<ReadProvider[]> {
    return this.providerRepository.findByFilter(filter);
  }

  async findConvention(
    idProvider: number,
  ): Promise<{ buffer: Buffer; fileName: string }> {
    const path = await this.providerRepository.findConventionPath(idProvider);
    if (!path)
      throw new NotFoundException('No agreement PDF found for this provider');
    const buffer = await this.fileStorage.readPdf(path);
    if (!buffer) throw new NotFoundException('Agreement PDF not found on disk');
    return { buffer, fileName: basename(path) };
  }
}
