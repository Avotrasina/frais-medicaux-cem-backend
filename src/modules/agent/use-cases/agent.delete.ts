import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../infrastructure/prisma/prisma.service.js";
import { RecordNotFoundError } from "../../../common/errors/database.errors.js";
import { AgentRepository } from "../repositories/agent.repository.js";
import { PersonneRepository } from "../../personne/personne.repository.js";

@Injectable()
export class DeleteAgentUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly personneRepository: PersonneRepository,
    private readonly agentRepository: AgentRepository,
  ) {}

  async execute(agentMatricule: number): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const agent = await this.agentRepository.findByMatricule(
        agentMatricule,
        tx,
      );

      await this.personneRepository.delete(agent.id, tx);
    });
  }
}
