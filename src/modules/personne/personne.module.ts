import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module.js';
import { PersonneRepository } from './repositories/personne.repository.js';

@Module({
  imports: [PrismaModule],
  providers: [PersonneRepository],
  exports: [PersonneRepository],
})
export class PersonneModule {}
