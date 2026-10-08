import { Injectable } from "@nestjs/common";
import { AgentCategoryRepository } from "../agent-category.repository.js";
import type { ReadAgentCategory } from "../types/agent-category.types.js";

@Injectable()
export class ReadAgentCategoryUseCase {
  constructor(
    private readonly agentCategoryRepository: AgentCategoryRepository,
  ) {}

  async readAll(): Promise<ReadAgentCategory[]> {
    return this.agentCategoryRepository.findAll();
  }

  async readById(id: number): Promise<ReadAgentCategory> {
    return this.agentCategoryRepository.readbyID(id);
  }
}