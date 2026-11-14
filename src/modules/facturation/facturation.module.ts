import { Module } from '@nestjs/common';
import { FacturationCoreModule } from './facturation-core.module.js';
import { FacturesModule } from './factures/factures.module.js';
import { PiecesJointesModule } from './pieces-jointes/pieces-jointes.module.js';
import { SuiviModule } from './suivi/suivi.module.js';

@Module({
  imports: [
    FacturationCoreModule,
    FacturesModule,
    SuiviModule,
    PiecesJointesModule,
  ],
  exports: [FacturationCoreModule],
})
export class FacturationModule {}
