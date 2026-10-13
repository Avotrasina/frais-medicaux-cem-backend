import { Injectable } from "@nestjs/common";
import { FamilleAgentRepository } from "../repositories/famille.agent.repository.js";
import type { ReadAgentFamily } from "../types/famille.agent.types.js";

@Injectable()
export class ReadFamilleUseCase {
  constructor(private readonly familleRepository: FamilleAgentRepository) {}

  async readByMatricule(agentMatricule: string): Promise<ReadAgentFamily[]> {
    return this.familleRepository.findByAgentMatricule(agentMatricule);
  }
}