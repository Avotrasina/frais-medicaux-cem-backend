import { Injectable } from "@nestjs/common";
import { AgentCategoryRepository } from "../agent-category.repository.js";
import type { ReadAgentCategory } from "../types/agent-category.types.js";

@Injectable()
export class ReadAgentCategoryUseCase {
  constructor(
    private readonly agentCategoryRepository: AgentCategoryRepository,
  ) {}

  async findAll(): Promise<ReadAgentCategory[]> {
    return this.agentCategoryRepository.findAll();
  }

  async findByID(id: number): Promise<ReadAgentCategory> {
    return this.agentCategoryRepository.findByID(id);
  }
}