import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import { FileStorageService } from '../../../infrastructure/storage/file-storage.service.js';
import { AgentRepository } from '../../agent/repositories/agent.repository.js';
import { AgentCategoryRepository } from '../agent-category.repository.js';
import type { DeletionAction } from '../../../common/types/soft-deletion.types.js';

@Injectable()
export class DeleteAgentCategoryUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly agentRepository: AgentRepository,
    private readonly categoryRepository: AgentCategoryRepository,
    private readonly fileStorage: FileStorageService,
  ) {}

  async request(id: number): Promise<void> {
    await this.apply(id, 'requestDeletion');
  }

  async reject(id: number): Promise<void> {
    await this.apply(id, 'rejectDeletion');
  }

  async validate(id: number): Promise<void> {
    const paths = await this.prisma.$transaction(async (tx) => {
      const matricules = await this.categoryRepository.findAgentMatricules(
        id,
        tx,
      );
      await this.categoryRepository.updateDeletionStatus(
        id,
        'validateDeletion',
        tx,
      );

      const files: string[] = [];
      for (const matricule of matricules) {
        files.push(
          ...(await this.agentRepository.applyDeletionTree(
            matricule,
            'validateDeletion',
            tx,
          )),
        );
      }
      return files;
    });

    await Promise.all(paths.map((path) => this.fileStorage.deleteImage(path)));
  }

  private async apply(id: number, action: DeletionAction): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const matricules = await this.categoryRepository.findAgentMatricules(
        id,
        tx,
      );
      await this.categoryRepository.updateDeletionStatus(id, action, tx);
      for (const matricule of matricules) {
        await this.agentRepository.applyDeletionTree(matricule, action, tx);
      }
    });
  }
}
