import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import { FileStorageService } from '../../../infrastructure/storage/file-storage.service.js';
import { AgentRepository } from '../repositories/agent.repository.js';
import type { DeletionAction } from '../../../common/types/soft-deletion.types.js';

@Injectable()
export class DeleteAgentUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly agentRepository: AgentRepository,
    private readonly fileStorage: FileStorageService,
  ) {}

  async request(agentMatricule: number): Promise<void> {
    await this.apply(agentMatricule, 'requestDeletion');
  }

  async reject(agentMatricule: number): Promise<void> {
    await this.apply(agentMatricule, 'rejectDeletion');
  }

  async validate(agentMatricule: number): Promise<void> {
    const paths = await this.prisma.$transaction((tx) =>
      this.agentRepository.applyDeletionTree(
        agentMatricule,
        'validateDeletion',
        tx,
      ),
    );
    await Promise.all(paths.map((path) => this.fileStorage.deleteImage(path)));
  }

  private async apply(
    agentMatricule: number,
    action: DeletionAction,
  ): Promise<void> {
    await this.prisma.$transaction((tx) =>
      this.agentRepository.applyDeletionTree(agentMatricule, action, tx),
    );
  }
}
