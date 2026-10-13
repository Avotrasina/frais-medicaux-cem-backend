import { Injectable } from "@nestjs/common";
import { PrismaClient } from "../../../generated/prisma/client.js";
import { ConjointRepository } from "../repositories/conjoint.repository.js";
import { PersonneRepository } from "../../personne/personne.repository.js";

@Injectable()
export class DeleteConjointUseCase {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly personneRepository: PersonneRepository,
    private readonly conjointRepository: ConjointRepository,
  ) {}

  async execute(id: number): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await this.conjointRepository.findByID(id, tx);
      await this.personneRepository.delete(id, tx);
    });
  }
}