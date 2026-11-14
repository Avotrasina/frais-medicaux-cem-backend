import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module.js';
import { ProviderModule } from '../provider/provider.module.js';
import { LieuController } from './location.controller.js';
import { LocationRepository } from './repositories/location.repository.js';
import { SaveLieuUseCase } from './use-cases/location.save.js';
import { UpdateLieuUseCase } from './use-cases/location.update.js';
import { ReadLieuUseCase } from './use-cases/location.read.js';

@Module({
  imports: [PrismaModule, ProviderModule],
  controllers: [LieuController],
  providers: [
    LocationRepository,
    SaveLieuUseCase,
    UpdateLieuUseCase,
    ReadLieuUseCase,
  ],
  exports: [LocationRepository],
})
export class LieuModule {}
