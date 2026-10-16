import { Module } from "@nestjs/common";
import { PrismaModule } from "../../infrastructure/prisma/prisma.module.js";
import { StorageModule } from "../../infrastructure/storage/storage.module.js";
import { PersonneModule } from "../personne/personne.module.js";
import { AgentFamilyController } from "./agent-family.controller.js";
import { ConjointRepository } from "./repositories/conjoint.repository.js";
import { EnfantRepository } from "./repositories/enfant.repository.js";
import { FamilleAgentRepository } from "./repositories/famille.agent.repository.js";
import { SaveConjointUseCase } from "./use-cases/conjoint.save.js";
import { UpdateConjointUseCase } from "./use-cases/conjoint.update.js";
import { DeleteConjointUseCase } from "./use-cases/conjoint.delete.js";
import { SaveEnfantUseCase } from "./use-cases/enfant.save.js";
import { UpdateEnfantUseCase } from "./use-cases/enfant.update.js";
import { DeleteEnfantUseCase } from "./use-cases/enfant.delete.js";
import { ReadFamilleUseCase } from "./use-cases/famille.read.js";

@Module({
  imports: [PersonneModule, PrismaModule, StorageModule],
  controllers: [AgentFamilyController],
  providers: [
    ConjointRepository,
    EnfantRepository,
    FamilleAgentRepository,
    SaveConjointUseCase,
    UpdateConjointUseCase,
    DeleteConjointUseCase,
    SaveEnfantUseCase,
    UpdateEnfantUseCase,
    DeleteEnfantUseCase,
    ReadFamilleUseCase,
  ],
  exports: [ConjointRepository, EnfantRepository, FamilleAgentRepository],
})
export class AgentFamilyModule {}
