import { Injectable } from '@nestjs/common';
import { FamilleAgentRepository } from '../repositories/agent-family.repository.js';
import type { ReadAgentFamily } from '../types/agent-family.types.js';

@Injectable()
export class ReadFamilleUseCase {
  constructor(private readonly familleRepository: FamilleAgentRepository) {}

  async findByMatricule(agentMatricule: number): Promise<ReadAgentFamily[]> {
    return this.familleRepository.findByAgentMatricule(agentMatricule);
  }
}
