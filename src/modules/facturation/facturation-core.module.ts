import { Module } from '@nestjs/common';
import { ReglesPriseEnChargeModule } from '../regles-prise-en-charge/regles-prise-en-charge.module.js';
import { StorageModule } from '../../infrastructure/storage/storage.module.js';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module.js';
import { PlafondModule } from '../plafond/plafond.module.js';
import { RefSocialService } from './shared/ref-social.service.js';
import { FactureGlobaleService } from './factures/globale/facture-globale.service.js';
import { FactureIndividuelleService } from './factures/individuelle/facture-individuelle.service.js';
import { FactureWorkflowService } from './factures/workflow/facture-workflow.service.js';
import { CloturePaieService } from './factures/paie/cloture-paie.service.js';
import { PaieEtatService } from './factures/paie/paie-etat.service.js';
import { FactureCalculService } from './shared/facture-calcul.service.js';
import { FactureClotureService } from './shared/facture-cloture.service.js';
import { FacturePermissionsService } from './shared/facture-permissions.service.js';
import { MouvementFactureService } from './shared/mouvement-facture.service.js';
import { PieceJointeFactureService } from './pieces-jointes/piece-jointe-facture.service.js';
import { SuiviCalculService } from './suivi/suivi-calcul.service.js';
import { SuiviService } from './suivi/suivi.service.js';

const FACTURATION_SERVICES = [
  FactureGlobaleService,
  RefSocialService,
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
];

@Module({
  imports: [
    PrismaModule,
    PlafondModule,
    ReglesPriseEnChargeModule,
    StorageModule,
  ],
  providers: FACTURATION_SERVICES,
  exports: [
    FactureGlobaleService,
    FactureIndividuelleService,
    FactureWorkflowService,
    CloturePaieService,
    PaieEtatService,
    PieceJointeFactureService,
    SuiviService,
  ],
})
export class FacturationCoreModule {}
