import { Injectable } from "@nestjs/common";
import { PrismaClient } from "../../../generated/prisma/client.js";
import { RecordNotFoundError } from "../../../common/errors/database.errors.js";
import { AgentRepository } from "../repositories/agent.repository.js";
import { PersonneRepository } from "../../personne/personne.repository.js";

@Injectable()
export class DeleteAgentUseCase {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly personneRepository: PersonneRepository,
    private readonly agentRepository: AgentRepository,
  ) {}

  async execute(agentMatricule: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const agent = await this.agentRepository.findByMatricule(
        agentMatricule,
        tx,
      );

      if (!agent) {
        throw new RecordNotFoundError("Agent");
      }

      await this.personneRepository.delete(agent.id, tx);
    });
  }
}