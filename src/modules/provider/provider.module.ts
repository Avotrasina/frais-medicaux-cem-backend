import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module.js';
import { ProviderController } from './provider.controller.js';
import { ProviderRepository } from './repositories/provider.repository.js';
import { SaveProviderUseCase } from './use-cases/provider.save.js';
import { UpdateProviderUseCase } from './use-cases/provider.update.js';
import { ReadProviderUseCase } from './use-cases/provider.read.js';
import { StorageModule } from '../../infrastructure/storage/storage.module.js';
import { UpdateProviderConventionUseCase } from './use-cases/provider-convention.update.js';
import { ProviderTreeDeletionUseCase } from './use-cases/provider-tree.delete.js';
import { ProviderDeletionRepository } from './repositories/provider-deletion.repository.js';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [ProviderController],
  providers: [
    ProviderRepository,
    SaveProviderUseCase,
    UpdateProviderUseCase,
    ReadProviderUseCase,
    UpdateProviderConventionUseCase,
    ProviderTreeDeletionUseCase,
    ProviderDeletionRepository,
  ],
  exports: [ProviderRepository, ProviderTreeDeletionUseCase],
})
export class ProviderModule {}
