import { Module } from '@nestjs/common';
import { PrismaModule } from './infrastructure/prisma/prisma.module.js';
import { StorageModule } from './infrastructure/storage/storage.module.js';
import { AgentCategoryModule } from './modules/agent-category/agent-category.module.js';
import { AgentFamilyModule } from './modules/agent-family/agent-family.module.js';
import { AgentModule } from './modules/agent/agent.module.js';
import { AttestationModule } from './modules/attestation/attestation.module.js';
import { ActeModule } from './modules/acte/acte.module.js';
import { BeneficiaryModule } from './modules/beneficiary/beneficiary.module.js';
import { CategorieActeModule } from './modules/categorie-acte/categorie-acte.module.js';
import { LieuModule } from './modules/location/location.module.js';
import { OrganizationalStructureModule } from './modules/organizational-structure/organizational-structure.module.js';
import { PersonneModule } from './modules/personne/personne.module.js';
import { PlafondModule } from './modules/plafond/plafond.module.js';
import { ProviderCategoryModule } from './modules/provider-category/provider-category.module.js';
import { ProviderModule } from './modules/provider/provider.module.js';
import { FacturationModule } from './modules/facturation/facturation.module.js';

@Module({
  imports: [
    PrismaModule,
    StorageModule,
    AgentCategoryModule,
    AgentFamilyModule,
    AgentModule,
    ActeModule,
    AttestationModule,
    BeneficiaryModule,
    CategorieActeModule,
    LieuModule,
    OrganizationalStructureModule,
    PersonneModule,
    PlafondModule,
    ProviderCategoryModule,
    ProviderModule,
    FacturationModule,
  ],
})
export class AppModule {}
