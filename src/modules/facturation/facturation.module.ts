import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module.js';
import { PlafondModule } from '../plafond/plafond.module.js';
import { RefSocialService } from '../../facturation/ref-social/ref-social.service.js';
import { ReglesPriseEnChargeModule } from '../../regles-prise-en-charge/regles-prise-en-charge.module.js';
import { FactureGlobaleController } from './factures/globale/facture-globale.controller.js';
import { FactureIndividuelleController } from './factures/individuelle/facture-individuelle.controller.js';
import { FactureWorkflowController } from './factures/workflow/facture-workflow.controller.js';
import { FactureGlobaleService } from './factures/globale/facture-globale.service.js';
import { FactureCalculService } from './shared/facture-calcul.service.js';
import { FactureIndividuelleService } from './factures/individuelle/facture-individuelle.service.js';
import { FactureRoleGuard } from './shared/facture-role.guard.js';
import { FactureWorkflowService } from './factures/workflow/facture-workflow.service.js';
import { MouvementFactureService } from './shared/mouvement-facture.service.js';
import { FacturePermissionsService } from './shared/facture-permissions.service.js';
import { SuiviController } from './suivi/suivi.controller.js';
import { SuiviService } from './suivi/suivi.service.js';
import { SuiviCalculService } from './suivi/suivi-calcul.service.js';
import { UtilisateurController } from './utilisateur.controller.js';

@Module({
  imports: [PrismaModule, PlafondModule, ReglesPriseEnChargeModule],
  controllers: [
    FactureGlobaleController,
    FactureIndividuelleController,
    FactureWorkflowController,
    SuiviController,
    UtilisateurController,
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
