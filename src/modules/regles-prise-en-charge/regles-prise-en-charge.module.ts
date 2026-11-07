import { Module } from '@nestjs/common';
import { PrismaModule } from '../infrastructure/prisma/prisma.module.js';
import { RegleController } from './regle.controller.js';
import { RegleService } from './regle.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [RegleController],
  providers: [RegleService],
  exports: [RegleService],
})
export class ReglesPriseEnChargeModule {}
