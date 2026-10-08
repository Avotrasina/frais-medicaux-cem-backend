import { Injectable } from "@nestjs/common";
import { PrismaClient } from "../../../generated/prisma/client.js";
import { StructureOrganisationnelleRepository } from "../repositories/structure-orga.repository.js";
import { DirectionRepository } from "../repositories/direction.repository.js";
import { StructureOrganisationnelleType } from "../types/structure-orga.types.js";
import type { CreateStructureOrganisationnelle } from "../types/structure-orga.types.js";
import type { CreateDirection } from "../types/direction.types.js";
import type { CreateDirectionUseCaseInput } from "../types/use-case.structure-orga.types.js";

@Injectable()
export class CreateDirectionUseCase {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly structureRepository: StructureOrganisationnelleRepository,
    private readonly directionRepository: DirectionRepository,
  ) {}

  private splitInput(input: CreateDirectionUseCaseInput): {
    structure: CreateStructureOrganisationnelle;
    direction: CreateDirection;
  } {
    const structure: CreateStructureOrganisationnelle = {
      id: input.codeDirection,
      structureOrganisationnelleType: StructureOrganisationnelleType.DIRECTION,
    };

    const direction: CreateDirection = {
      codeDirection: input.codeDirection,
      nom: input.nomDirection,
    };

    return { structure, direction };
  }

  async execute(input: CreateDirectionUseCaseInput): Promise<void> {
    const { structure, direction } = this.splitInput(input);

    await this.prisma.$transaction(async (tx) => {
      await this.structureRepository.create(structure, tx);
      await this.directionRepository.create(direction, tx);
    });
  }
}