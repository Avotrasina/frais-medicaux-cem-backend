import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module.js';
import { PlafondController } from './plafond.controller.js';
import { PlafondRepository } from './repositories/plafond.repository.js';
import { CreatePlafondUseCase } from './use-cases/plafond.create.js';
import { DeletePlafondUseCase } from './use-cases/plafond.delete.js';
import { ReadPlafondUseCase } from './use-cases/plafond.read.js';
import { UpdatePlafondUseCase } from './use-cases/plafond.update.js';
import { PlafondSuiviGardeService } from './plafond-suivi-garde.service.js';
import { PlafondResolutionService } from './plafond-resolution.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [PlafondController],
  providers: [
    PlafondRepository,
    CreatePlafondUseCase,
    ReadPlafondUseCase,
    UpdatePlafondUseCase,
    DeletePlafondUseCase,
    PlafondSuiviGardeService,
    PlafondResolutionService,
  ],
  exports: [PlafondRepository, PlafondResolutionService],
})
export class PlafondModule {}
