import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module.js';
import { PlafondModule } from '../plafond/plafond.module.js';
import { CategorieActeModule } from '../categorie-acte/categorie-acte.module.js';
import { ActeController } from './acte.controller.js';
import { ActeRepository } from './repositories/acte.repository.js';
import { CreateActeUseCase } from './use-cases/acte.create.js';
import { CreateActeWithCeilingsUseCase } from './use-cases/acte-create-with-ceilings.use-case.js';
import { DeleteActeUseCase } from './use-cases/acte.delete.js';
import { ReadActeUseCase } from './use-cases/acte.read.js';
import { UpdateActeUseCase } from './use-cases/acte.update.js';

@Module({
  imports: [PrismaModule, PlafondModule, CategorieActeModule],
  controllers: [ActeController],
  providers: [
    ActeRepository,
    CreateActeUseCase,
    CreateActeWithCeilingsUseCase,
    ReadActeUseCase,
    UpdateActeUseCase,
    DeleteActeUseCase,
  ],
  exports: [ActeRepository],
})
export class ActeModule {}
