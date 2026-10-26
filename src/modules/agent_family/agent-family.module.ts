import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module.js';
import { StorageModule } from '../../infrastructure/storage/storage.module.js';
import { BeneficiaryModule } from '../beneficiary/beneficiary.module.js';
import { PersonneModule } from '../personne/personne.module.js';
import { AgentFamilyController } from './agent-family.controller.js';
import { ConjointRepository } from './repositories/conjoint.repository.js';
import { EnfantRepository } from './repositories/enfant.repository.js';
import { FamilleAgentRepository } from './repositories/agent-family.repository.js';
import { SaveConjointUseCase } from './use-cases/conjoint.save.js';
import { UpdateConjointUseCase } from './use-cases/conjoint.update.js';
import { SaveEnfantUseCase } from './use-cases/enfant.save.js';
import { UpdateEnfantUseCase } from './use-cases/enfant.update.js';
import { GetFamilleCardUseCase } from './use-cases/agent-family.get-card.js';
import { ReadFamilleUseCase } from './use-cases/famille.read.js';
import { AgentFamilyDeletionUseCase } from './use-cases/agent-family.delete.js';

@Module({
  imports: [PersonneModule, BeneficiaryModule, PrismaModule, StorageModule],
  controllers: [AgentFamilyController],
  providers: [
    ConjointRepository,
    EnfantRepository,
    FamilleAgentRepository,
    SaveConjointUseCase,
    UpdateConjointUseCase,
    SaveEnfantUseCase,
    UpdateEnfantUseCase,
    ReadFamilleUseCase,
    GetFamilleCardUseCase,
    AgentFamilyDeletionUseCase,
  ],
  exports: [ConjointRepository, EnfantRepository, FamilleAgentRepository],
})
export class AgentFamilyModule {}
