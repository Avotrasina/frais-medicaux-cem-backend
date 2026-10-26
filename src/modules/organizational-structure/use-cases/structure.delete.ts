import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import { StructureDeletionRepository } from '../repositories/structure-deletion.repository.js';
import type { DeletionAction } from '../../../common/types/soft-deletion.types.js';
import type { OrganizationalDeletionTarget } from '../types/structure-deletion.types.js';

@Injectable()
export class DeleteOrganizationalStructureUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly structureDeletionRepository: StructureDeletionRepository,
  ) {}

  async request(
    target: OrganizationalDeletionTarget,
    id: string,
  ): Promise<void> {
    await this.apply(target, id, 'requestDeletion');
  }

  async reject(
    target: OrganizationalDeletionTarget,
    id: string,
  ): Promise<void> {
    await this.apply(target, id, 'rejectDeletion');
  }

  async validate(
    target: OrganizationalDeletionTarget,
    id: string,
  ): Promise<void> {
    await this.apply(target, id, 'validateDeletion');
  }

  private async apply(
    target: OrganizationalDeletionTarget,
    id: string,
    action: DeletionAction,
  ): Promise<void> {
    await this.prisma.$transaction((tx) =>
      this.structureDeletionRepository.applyTreeDeletion(
        target,
        id,
        action,
        tx,
      ),
    );
  }
}
