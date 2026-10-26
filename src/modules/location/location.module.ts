import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module.js';
import { LieuController } from './location.controller.js';
import { LocationRepository } from './location.repository.js';
import { SaveLieuUseCase } from './use-cases/location.save.js';
import { UpdateLieuUseCase } from './use-cases/location.update.js';
import { ReadLieuUseCase } from './use-cases/location.read.js';
import { ProviderTreeDeletionUseCase } from '../provider/provider-tree.delete.js';
import { ProviderDeletionRepository } from '../provider/repositories/provider-deletion.repository.js';
import { StorageModule } from '../../infrastructure/storage/storage.module.js';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [LieuController],
  providers: [
    LocationRepository,
    SaveLieuUseCase,
    UpdateLieuUseCase,
    ReadLieuUseCase,
    ProviderTreeDeletionUseCase,
    ProviderDeletionRepository,
  ],
  exports: [LocationRepository],
})
export class LieuModule {}
