import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module.js';
import { AgentCategoryController } from './agent-category.controller.js';
import { AgentCategoryRepository } from './repositories/agent-category.repository.js';
import { AgentModule } from '../agent/agent.module.js';
import { SaveAgentCategoryUseCase } from './use-cases/agent-category.save.js';
import { UpdateAgentCategoryUseCase } from './use-cases/agent-category.update.js';
import { ReadAgentCategoryUseCase } from './use-cases/agent-category.read.js';
import { DeleteAgentCategoryUseCase } from './use-cases/agent-category.delete.js';
import { StorageModule } from '../../infrastructure/storage/storage.module.js';

@Module({
  imports: [PrismaModule, StorageModule, AgentModule],
  controllers: [AgentCategoryController],
  providers: [
    AgentCategoryRepository,
    SaveAgentCategoryUseCase,
    UpdateAgentCategoryUseCase,
    ReadAgentCategoryUseCase,
    DeleteAgentCategoryUseCase,
  ],
  exports: [AgentCategoryRepository],
})
export class AgentCategoryModule {}
