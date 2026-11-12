import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../infrastructure/prisma/prisma.module.js';
import { FacturationCoreModule } from '../facturation-core.module.js';
import { FactureRoleGuard } from '../shared/facture-role.guard.js';
import { FactureGlobaleController } from './globale/facture-globale.controller.js';
import { FactureIndividuelleController } from './individuelle/facture-individuelle.controller.js';
import { FactureWorkflowController } from './workflow/facture-workflow.controller.js';
import { CloturePaieController } from './paie/cloture-paie.controller.js';
import { PaieEtatController } from './paie/paie-etat.controller.js';

@Module({
  imports: [FacturationCoreModule, PrismaModule],
  providers: [FactureRoleGuard],
  controllers: [
    FactureGlobaleController,
    FactureIndividuelleController,
    FactureWorkflowController,
    CloturePaieController,
    PaieEtatController,
  ],
})
export class FacturesModule {}
