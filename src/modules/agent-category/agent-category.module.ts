import { Module } from "@nestjs/common";
import { AgentCategoryController } from "./agent-category.controller.js";
import { AgentCategoryRepository } from "./agent-category.repository.js";
import { SaveAgentCategoryUseCase } from "./use-cases/agent-category.save.js";
import { UpdateAgentCategoryUseCase } from "./use-cases/agent-category.update.js";
import { ReadAgentCategoryUseCase } from "./use-cases/agent-category.read.js";

@Module({
  controllers: [AgentCategoryController],
  providers: [
    AgentCategoryRepository,
    SaveAgentCategoryUseCase,
    UpdateAgentCategoryUseCase,
    ReadAgentCategoryUseCase,
  ],
  exports: [AgentCategoryRepository],
})
export class AgentCategoryModule {}