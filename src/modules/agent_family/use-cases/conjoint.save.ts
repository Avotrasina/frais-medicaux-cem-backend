import { Injectable } from "@nestjs/common";
import { PrismaClient } from "../../../generated/prisma/client.js";
import { ConjointRepository } from "../repositories/conjoint.repository.js";
import { PersonneRepository } from "../../personne/personne.repository.js";
import type { CreateConjoint } from "../types/conjoint.types.js";

@Injectable()
export class SaveConjointUseCase {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly personneRepository: PersonneRepository,
    private readonly conjointRepository: ConjointRepository,
  ) {}

  async execute(input: CreateConjoint): Promise<number> {
    const { personne, agentMatricule, carteSocialePath } = input;

    return this.prisma.$transaction(async (tx) => {
      const createdPersonne = await this.personneRepository.create(
        personne,
        tx,
      );
      return this.conjointRepository.create(
        { id: createdPersonne.id, agentMatricule, carteSocialePath },
        tx,
      );
    });
  }
}