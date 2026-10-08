import { Injectable } from "@nestjs/common";
import { AgentCategoryRepository } from "../agent-category.repository.js";
import type {
  ReadAgentCategory,
  UpdatePartialAgentCategory,
} from "../types/agent-category.types.js";

@Injectable()
export class UpdateAgentCategoryUseCase {
  constructor(
    private readonly agentCategoryRepository: AgentCategoryRepository,
  ) {}

  async updatePartial(
    id: number,
    input: UpdatePartialAgentCategory,
  ): Promise<ReadAgentCategory> {
    // aucun champ fourni : pas d'UPDATE inutile, on renvoie l'existant
    if (input.codeCategory == null) {
      return this.agentCategoryRepository.readbyID(id);
    }
    return this.agentCategoryRepository.updatePartial(id, input);
  }
}