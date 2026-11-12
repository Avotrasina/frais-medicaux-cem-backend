import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module.js';
import { StorageModule } from '../../infrastructure/storage/storage.module.js';
import { UtilisateurController } from './utilisateur.controller.js';
import { UtilisateurService } from './utilisateur.service.js';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [UtilisateurController],
  providers: [UtilisateurService],
  exports: [UtilisateurService],
})
export class UtilisateurModule {}
