import { Module } from '@nestjs/common';
import { FacturationCoreModule } from '../facturation-core.module.js';
import { PieceJointeFactureController } from './piece-jointe-facture.controller.js';

@Module({
  imports: [FacturationCoreModule],
  controllers: [PieceJointeFactureController],
})
export class PiecesJointesModule {}
