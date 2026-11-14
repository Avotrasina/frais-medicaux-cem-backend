import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import { FileStorageService } from '../../../infrastructure/storage/file-storage.service.js';
import { ProviderDeletionRepository } from '../repositories/provider-deletion.repository.js';
import type { ProviderDeletionRoot } from '../types/provider-tree-deletion.types.js';

@Injectable()
export class ProviderTreeDeletionUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly providerDeletionRepository: ProviderDeletionRepository,
    private readonly storage: FileStorageService,
  ) {}

  async request(model: ProviderDeletionRoot, id: number): Promise<void> {
    await this.apply(model, id, 'requestDeletion');
  }

  async reject(model: ProviderDeletionRoot, id: number): Promise<void> {
    await this.apply(model, id, 'rejectDeletion');
  }

  async validate(model: ProviderDeletionRoot, id: number): Promise<void> {
    const paths = await this.prisma.$transaction((tx) =>
      this.providerDeletionRepository.applyTreeDeletion(
        model,
        id,
        'validateDeletion',
        tx,
      ),
    );
    await Promise.all(paths.map((path) => this.storage.deletePdf(path)));
  }

  /** Wraps the state changes in a Prisma transaction. */
  private async apply(
    model: ProviderDeletionRoot,
    id: number,
    action: 'requestDeletion' | 'rejectDeletion',
  ): Promise<void> {
    await this.prisma.$transaction((tx) =>
      this.providerDeletionRepository.applyTreeDeletion(model, id, action, tx),
    );
  }
}
