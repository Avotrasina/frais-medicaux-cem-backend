import { Injectable } from '@nestjs/common';
import { AgentCategoryRepository } from '../repositories/agent-category.repository.js';
import type {
  ReadAgentCategory,
  UpdatePartialAgentCategory,
} from '../types/agent-category.types.js';

@Injectable()
export class UpdateAgentCategoryUseCase {
  constructor(
    private readonly agentCategoryRepository: AgentCategoryRepository,
  ) {}

  async updatePartial(
    id: number,
    input: UpdatePartialAgentCategory,
  ): Promise<ReadAgentCategory> {
    if (input.codeCategory == null) {
      return this.agentCategoryRepository.findById(id);
    }
    return this.agentCategoryRepository.updatePartial(id, input);
  }
}
