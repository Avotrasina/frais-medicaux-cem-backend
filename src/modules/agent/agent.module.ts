import { Module } from "@nestjs/common";
import { PersonneModule } from "../personne/personne.module.js";
import { AgentController } from "./agent.controller.js";
import { AgentRepository } from "./repositories/agent.repository.js";
import { SaveAgentUseCase } from "./use-cases/agent.save.js";
import { UpdateAgentUseCase } from "./use-cases/agent.update.js";
import { DeleteAgentUseCase } from "./use-cases/agent.delete.js";
import { ReadAgentUseCase } from "./use-cases/agent.read.js";

@Module({
  imports: [PersonneModule],
  controllers: [AgentController],
  providers: [
    AgentRepository,
    SaveAgentUseCase,
    UpdateAgentUseCase,
    DeleteAgentUseCase,
    ReadAgentUseCase,
  ],
  exports: [AgentRepository],
})
export class AgentModule {}