import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module.js';
import { AgentModule } from '../agent/agent.module.js';
import { StructureOrganisationnelleController } from './organizational-structure.controller.js';

import { StructureOrganisationnelleRepository } from './repositories/structure-orga.repository.js';
import { AgenceRepository } from './repositories/agence.repository.js';
import { DirectionRepository } from './repositories/direction.repository.js';
import { ServiceRepository } from './repositories/service.repository.js';
import { StructureDeletionRepository } from './repositories/structure-deletion.repository.js';

import { CreateAgenceUseCase } from './use-cases/agence.save.js';
import { UpdateAgenceUseCase } from './use-cases/agence.update.js';
import { ReadAllAgencesUseCase } from './use-cases/agence.read.js';

import { CreateDirectionUseCase } from './use-cases/direction.save.js';
import { UpdateDirectionUseCase } from './use-cases/direction.update.js';
import { ReadAllDirectionsUseCase } from './use-cases/direction.read.js';

import { CreateServiceUseCase } from './use-cases/service.save.js';
import { UpdateServiceUseCase } from './use-cases/service.update.js';
import { ReadServiceUseCase } from './use-cases/service.read.js';
import { DeleteOrganizationalStructureUseCase } from './use-cases/structure.delete.js';

@Module({
  imports: [forwardRef(() => AgentModule), PrismaModule],
  controllers: [StructureOrganisationnelleController],
  providers: [
    StructureOrganisationnelleRepository,
    AgenceRepository,
    DirectionRepository,
    ServiceRepository,
    StructureDeletionRepository,

    CreateAgenceUseCase,
    UpdateAgenceUseCase,
    ReadAllAgencesUseCase,

    CreateDirectionUseCase,
    UpdateDirectionUseCase,
    ReadAllDirectionsUseCase,

    CreateServiceUseCase,
    UpdateServiceUseCase,
    ReadServiceUseCase,
    DeleteOrganizationalStructureUseCase,
  ],
  exports: [ServiceRepository, StructureOrganisationnelleRepository],
})
export class OrganizationalStructureModule {}
