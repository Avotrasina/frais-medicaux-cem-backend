import { Injectable } from '@nestjs/common';
import { AgentCategoryRepository } from '../repositories/agent-category.repository.js';
import type {
  CreateAgentCategory,
  ReadAgentCategory,
} from '../types/agent-category.types.js';

@Injectable()
export class SaveAgentCategoryUseCase {
  constructor(
    private readonly agentCategoryRepository: AgentCategoryRepository,
  ) {}

  async execute(input: CreateAgentCategory): Promise<ReadAgentCategory> {
    return this.agentCategoryRepository.create(input);
  }
}
