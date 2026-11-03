import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module.js';
import { PlafondModule } from '../plafond/plafond.module.js';
import { ActeController } from './acte.controller.js';
import { ActeRepository } from './repositories/acte.repository.js';
import { CreateActeUseCase } from './use-cases/acte.create.js';
import { DeleteActeUseCase } from './use-cases/acte.delete.js';
import { ReadActeUseCase } from './use-cases/acte.read.js';
import { UpdateActeUseCase } from './use-cases/acte.update.js';

@Module({
  imports: [PrismaModule, PlafondModule],
  controllers: [ActeController],
  providers: [
    ActeRepository,
    CreateActeUseCase,
    ReadActeUseCase,
    UpdateActeUseCase,
    DeleteActeUseCase,
  ],
  exports: [ActeRepository],
})
export class ActeModule {}
