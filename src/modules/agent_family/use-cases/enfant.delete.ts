import { Injectable } from "@nestjs/common";
import { PrismaClient } from "../../../generated/prisma/client.js";
import { EnfantRepository } from "../repositories/enfant.repository.js";
import { PersonneRepository } from "../../personne/personne.repository.js";

@Injectable()
export class DeleteEnfantUseCase {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly personneRepository: PersonneRepository,
    private readonly enfantRepository: EnfantRepository,
  ) {}

  async execute(id: number): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await this.enfantRepository.readbyID(id, tx);
      await this.personneRepository.delete(id, tx);
    });
  }
}