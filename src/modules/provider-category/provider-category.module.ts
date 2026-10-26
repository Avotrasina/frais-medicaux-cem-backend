import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module.js';
import { ProviderCategoryController } from './provider-category.controller.js';
import { ProviderCategoryRepository } from './provider-category.repository.js';
import { SaveProviderCategoryUseCase } from './use-cases/provider-category.save.js';
import { UpdateProviderCategoryUseCase } from './use-cases/provider-category.update.js';
import { ReadProviderCategoryUseCase } from './use-cases/provider-category.read.js';
import { ProviderTreeDeletionUseCase } from '../provider/provider-tree.delete.js';
import { ProviderDeletionRepository } from '../provider/repositories/provider-deletion.repository.js';
import { StorageModule } from '../../infrastructure/storage/storage.module.js';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [ProviderCategoryController],
  providers: [
    ProviderCategoryRepository,
    SaveProviderCategoryUseCase,
    UpdateProviderCategoryUseCase,
    ReadProviderCategoryUseCase,
    ProviderTreeDeletionUseCase,
    ProviderDeletionRepository,
  ],
  exports: [ProviderCategoryRepository],
})
export class ProviderCategoryModule {}
