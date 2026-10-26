import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import { ServiceRepository } from '../repositories/service.repository.js';
import { AgentRepository } from '../../agent/repositories/agent.repository.js';
import type {
  UpdateServiceNomUseCaseInput,
  UpdateServiceCodeDirectionUseCaseInput,
} from '../types/use-case.structure-orga.types.js';

@Injectable()
export class UpdateServiceUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly serviceRepository: ServiceRepository,
    private readonly agentRepository: AgentRepository,
  ) {}

  async updateNom(input: UpdateServiceNomUseCaseInput): Promise<void> {
    await this.serviceRepository.update(input.codeService, {
      nom: input.nomService,
    });
  }

  async updateCodeDirection(
    input: UpdateServiceCodeDirectionUseCaseInput,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await this.serviceRepository.update(
        input.codeService,
        { codeDirection: input.codeDirection },
        tx,
      );
      await this.agentRepository.updateStructureByService(
        input.codeService,
        input.codeDirection,
        tx,
      );
    });
  }
}
