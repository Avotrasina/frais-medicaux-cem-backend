import { Module } from '@nestjs/common';
import { FacturationCoreModule } from '../facturation-core.module.js';
import { SuiviController } from './suivi.controller.js';

@Module({
  imports: [FacturationCoreModule],
  controllers: [SuiviController],
})
export class SuiviModule {}
