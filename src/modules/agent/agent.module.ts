import { forwardRef, Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module.js';
import { StorageModule } from '../../infrastructure/storage/storage.module.js';
import { BeneficiaryModule } from '../beneficiary/beneficiary.module.js';
import { PersonneModule } from '../personne/personne.module.js';
import { AgentController } from './agent.controller.js';
import { AgentRepository } from './repositories/agent.repository.js';
import { SaveAgentUseCase } from './use-cases/agent.save.js';
import { UpdateAgentUseCase } from './use-cases/agent.update.js';
import { DeleteAgentUseCase } from './use-cases/agent.delete.js';
import { ReadAgentUseCase } from './use-cases/agent.read.js';
import { GetAgentCardUseCase } from './use-cases/agent.get-card.js';
import { OrganizationalStructureModule } from '../organizational-structure/organizational-structure.module.js';

@Module({
  imports: [
    forwardRef(() => OrganizationalStructureModule),
    PersonneModule,
    BeneficiaryModule,
    PrismaModule,
    StorageModule,
  ],
  controllers: [AgentController],
  providers: [
    AgentRepository,
    SaveAgentUseCase,
    UpdateAgentUseCase,
    DeleteAgentUseCase,
    ReadAgentUseCase,
    GetAgentCardUseCase,
  ],
  exports: [AgentRepository],
})
export class AgentModule {}
