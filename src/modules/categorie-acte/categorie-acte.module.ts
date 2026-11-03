import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module.js';
import { PlafondModule } from '../plafond/plafond.module.js';
import { CategorieActeController } from './categorie-acte.controller.js';
import { CategorieActeRepository } from './repositories/categorie-acte.repository.js';
import { CreateCategorieActeUseCase } from './use-cases/categorie-acte.create.js';
import { DeleteCategorieActeUseCase } from './use-cases/categorie-acte.delete.js';
import { ReadCategorieActeUseCase } from './use-cases/categorie-acte.read.js';
import { UpdateCategorieActeUseCase } from './use-cases/categorie-acte.update.js';

@Module({
  imports: [PrismaModule, PlafondModule],
  controllers: [CategorieActeController],
  providers: [
    CategorieActeRepository,
    CreateCategorieActeUseCase,
    ReadCategorieActeUseCase,
    UpdateCategorieActeUseCase,
    DeleteCategorieActeUseCase,
  ],
  exports: [CategorieActeRepository],
})
export class CategorieActeModule {}
