import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service.js';
import { StructureOrganisationnelleRepository } from '../repositories/structure-orga.repository.js';
import { AgenceRepository } from '../repositories/agence.repository.js';
import { StructureOrganisationnelleType } from '../types/structure-orga.types.js';
import type { CreateStructureOrganisationnelle } from '../types/structure-orga.types.js';
import type { CreateAgence } from '../types/agence.types.js';
import type { CreateAgenceUseCaseInput } from '../types/use-case.structure-orga.types.js';

@Injectable()
export class CreateAgenceUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly structureRepository: StructureOrganisationnelleRepository,
    private readonly agenceRepository: AgenceRepository,
  ) {}

  private splitInput(input: CreateAgenceUseCaseInput): {
    structure: CreateStructureOrganisationnelle;
    agence: CreateAgence;
  } {
    const structure: CreateStructureOrganisationnelle = {
      id: input.codeAgence,
      structureOrganisationnelleType: StructureOrganisationnelleType.AGENCE,
    };

    const agence: CreateAgence = {
      codeAgence: input.codeAgence,
      nomAgence: input.nomAgence,
    };

    return { structure, agence };
  }

  async execute(input: CreateAgenceUseCaseInput): Promise<void> {
    const { structure, agence } = this.splitInput(input);

    await this.prisma.$transaction(async (tx) => {
      await this.structureRepository.create(structure, tx);
      await this.agenceRepository.create(agence, tx);
    });
  }
}
