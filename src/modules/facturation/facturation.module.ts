import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module.js';
import { PlafondModule } from '../plafond/plafond.module.js';
import { RefSocialService } from '../../facturation/ref-social/ref-social.service.js';
import { ReglesPriseEnChargeModule } from '../../regles-prise-en-charge/regles-prise-en-charge.module.js';
import { FactureGlobaleController } from './facture-globale.controller.js';
import { FactureIndividuelleController } from './facture-individuelle.controller.js';
import { FactureWorkflowController } from './facture-workflow.controller.js';
import { FactureGlobaleService } from './facture-globale.service.js';
import { FactureCalculService } from './facture-calcul.service.js';
import { FactureIndividuelleService } from './facture-individuelle.service.js';
import { FactureRoleGuard } from './facture-role.guard.js';
import { FactureWorkflowService } from './facture-workflow.service.js';
import { MouvementFactureService } from './mouvement-facture.service.js';
import { FacturePermissionsService } from './facture-permissions.service.js';
import { SuiviController } from './suivi.controller.js';
import { SuiviService } from './suivi.service.js';
import { SuiviCalculService } from './suivi-calcul.service.js';

@Module({
  imports: [PrismaModule, PlafondModule, ReglesPriseEnChargeModule],
  controllers: [
    FactureGlobaleController,
    FactureIndividuelleController,
    FactureWorkflowController,
    SuiviController,
  ],
  providers: [
    FactureGlobaleService,
    RefSocialService,
    FactureRoleGuard,
    FactureWorkflowService,
    MouvementFactureService,
    FactureCalculService,
    FactureIndividuelleService,
    FacturePermissionsService,
    SuiviService,
    SuiviCalculService,
  ],
  exports: [FactureGlobaleService],
})
export class FacturationModule {}
