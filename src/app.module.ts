import { Module } from "@nestjs/common";
import { PrismaModule } from "./infrastructure/prisma/prisma.module.js";
import { StorageModule } from "./infrastructure/storage/storage.module.js";
import { AgentCategoryModule } from "./modules/agent-category/agent-category.module.js";
import { AgentFamilyModule } from "./modules/agent_family/agent-family.module.js";
import { AgentModule } from "./modules/agent/agent.module.js";
import { AttestationModule } from "./modules/attestation/attestation.module.js";
import { BeneficiaryModule } from "./modules/beneficiary/beneficiary.module.js";
import { FonctionModule } from "./modules/fonction/fonction.module.js";
import { LieuModule } from "./modules/location/location.module.js";
import { OrganizationalStructureModule } from "./modules/organizational_structure/organizational-structure.module.js";
import { PersonneModule } from "./modules/personne/personne.module.js";
import { ProviderCategoryModule } from "./modules/provider-category/provider-category.module.js";
import { ProviderModule } from "./modules/provider/provider.module.js";

@Module({
  imports: [
    PrismaModule,
    StorageModule,
    AgentCategoryModule,
    AgentFamilyModule,
    AgentModule,
    AttestationModule,
    BeneficiaryModule,
    FonctionModule,
    LieuModule,
    OrganizationalStructureModule,
    PersonneModule,
    ProviderCategoryModule,
    ProviderModule,
  ],
})
export class AppModule {}
