import { Injectable } from "@nestjs/common";
import { PrismaClient } from "../../../generated/prisma/client.js";
import { EnfantRepository } from "../repositories/enfant.repository.js";
import { PersonneRepository } from "../../personne/personne.repository.js";
import type { CreateEnfant } from "../types/enfant.types.js";

@Injectable()
export class SaveEnfantUseCase {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly personneRepository: PersonneRepository,
    private readonly enfantRepository: EnfantRepository,
  ) {}

  async execute(input: CreateEnfant): Promise<number> {
    const { personne, agentMatricule, carteSocialePath } = input;

    return this.prisma.$transaction(async (tx) => {
      const createdPersonne = await this.personneRepository.create(
        personne,
        tx,
      );
      return this.enfantRepository.create(
        { id: createdPersonne.id, agentMatricule, carteSocialePath },
        tx,
      );
    });
  }
}