import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module.js';
import { PlafondModule } from '../plafond/plafond.module.js';
import { RefSocialService } from './shared/ref-social.service.js';
import { ReglesPriseEnChargeModule } from '../regles-prise-en-charge/regles-prise-en-charge.module.js';
import { FactureGlobaleController } from './factures/globale/facture-globale.controller.js';
import { FactureIndividuelleController } from './factures/individuelle/facture-individuelle.controller.js';
import { FactureWorkflowController } from './factures/workflow/facture-workflow.controller.js';
import { FactureGlobaleService } from './factures/globale/facture-globale.service.js';
import { FactureCalculService } from './shared/facture-calcul.service.js';
import { FactureIndividuelleService } from './factures/individuelle/facture-individuelle.service.js';
import { CloturePaieController } from './factures/paie/cloture-paie.controller.js';
import { CloturePaieService } from './factures/paie/cloture-paie.service.js';
import { PaieEtatController } from './factures/paie/paie-etat.controller.js';
import { PaieEtatService } from './factures/paie/paie-etat.service.js';
import { FactureRoleGuard } from './shared/facture-role.guard.js';
import { FactureWorkflowService } from './factures/workflow/facture-workflow.service.js';
import { MouvementFactureService } from './shared/mouvement-facture.service.js';
import { FactureClotureService } from './shared/facture-cloture.service.js';
import { FacturePermissionsService } from './shared/facture-permissions.service.js';
import { SuiviController } from './suivi/suivi.controller.js';
import { SuiviService } from './suivi/suivi.service.js';
import { SuiviCalculService } from './suivi/suivi-calcul.service.js';
import { UtilisateurController } from './utilisateur.controller.js';
import { StorageModule } from '../../infrastructure/storage/storage.module.js';
import { PieceJointeFactureController } from './pieces-jointes/piece-jointe-facture.controller.js';
import { PieceJointeFactureService } from './pieces-jointes/piece-jointe-facture.service.js';
import { UtilisateurService } from './utilisateur.service.js';

@Module({
  imports: [
    PrismaModule,
    PlafondModule,
    ReglesPriseEnChargeModule,
    StorageModule,
  ],
  controllers: [
    FactureGlobaleController,
    FactureIndividuelleController,
    FactureWorkflowController,
    CloturePaieController,
    PaieEtatController,
    SuiviController,
    UtilisateurController,
    PieceJointeFactureController,
  ],
  providers: [
    FactureGlobaleService,
    RefSocialService,
    FactureRoleGuard,
    FactureWorkflowService,
    MouvementFactureService,
    FactureCalculService,
    FactureIndividuelleService,
    CloturePaieService,
    PaieEtatService,
    FactureClotureService,
    FacturePermissionsService,
    SuiviService,
    SuiviCalculService,
    PieceJointeFactureService,
    UtilisateurService,
  ],
  exports: [FactureGlobaleService],
})
export class FacturationModule {}
