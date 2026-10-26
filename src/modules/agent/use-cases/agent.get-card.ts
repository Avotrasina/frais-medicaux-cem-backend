import { Injectable, NotFoundException } from '@nestjs/common';
import { extname, basename } from 'node:path';
import { AgentRepository } from '../repositories/agent.repository.js';
import { FileStorageService } from '../../../infrastructure/storage/file-storage.service.js';
import type { AgentCardFile } from '../types/use-case.agent.types.js';

const MIME_BY_EXT: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

@Injectable()
export class GetAgentCardUseCase {
  constructor(
    private readonly agentRepository: AgentRepository,
    private readonly fileStorage: FileStorageService,
  ) {}

  async execute(matricule: number): Promise<AgentCardFile> {
    const carteProfessionnellePath =
      await this.agentRepository.findAgentCard(matricule);

    const stream = await this.fileStorage.openImage(carteProfessionnellePath);
    if (!stream) {
      throw new NotFoundException('Professional card not found on disk');
    }

    return {
      stream,
      mimeType:
        MIME_BY_EXT[extname(carteProfessionnellePath).toLowerCase()] ??
        'application/octet-stream',
      fileName: basename(carteProfessionnellePath),
    };
  }
}
