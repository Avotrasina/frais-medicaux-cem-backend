import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import { FileStorageService } from '../../../infrastructure/storage/file-storage.service.js';
import { FamilleAgentRepository } from '../repositories/agent-family.repository.js';
import type { AgentFamilyMemberType } from '../types/agent-family-deletion.types.js';
import type { ReadConjoint } from '../types/conjoint.types.js';
import type { ReadEnfant } from '../types/enfant.types.js';
import { ConjointRepository } from '../repositories/conjoint.repository.js';
import { EnfantRepository } from '../repositories/enfant.repository.js';

@Injectable()
export class AgentFamilyDeletionUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly familleAgentRepository: FamilleAgentRepository,
    private readonly storage: FileStorageService,
    private readonly conjointRepository: ConjointRepository,
    private readonly enfantRepository: EnfantRepository,
  ) {}

  readConjointRequests(): Promise<ReadConjoint[]> {
    return this.conjointRepository.findDeletionRequests();
  }

  readEnfantRequests(): Promise<ReadEnfant[]> {
    return this.enfantRepository.findDeletionRequests();
  }

  async request(type: AgentFamilyMemberType, id: number): Promise<void> {
    await this.apply(type, id, 'requestDeletion');
  }

  async reject(type: AgentFamilyMemberType, id: number): Promise<void> {
    await this.apply(type, id, 'rejectDeletion');
  }

  async validate(type: AgentFamilyMemberType, id: number): Promise<void> {
    const cardPath = await this.prisma.$transaction((tx) =>
      this.familleAgentRepository.applyMemberDeletion(
        type,
        id,
        'validateDeletion',
        tx,
      ),
    );
    await this.storage.deleteImage(cardPath);
  }

  private async apply(
    type: AgentFamilyMemberType,
    id: number,
    action: 'requestDeletion' | 'rejectDeletion',
  ): Promise<void> {
    await this.prisma.$transaction((tx) =>
      this.familleAgentRepository.applyMemberDeletion(type, id, action, tx),
    );
  }
}
