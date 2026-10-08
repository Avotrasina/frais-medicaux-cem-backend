import { Injectable } from "@nestjs/common";
import { AgenceRepository } from "../repositories/agence.repository.js";
import type { UpdateAgence } from "../types/agence.types.js";
import type { UpdateAgenceUseCaseInput } from "../types/use-case.structure-orga.types.js";

@Injectable()
export class UpdateAgenceUseCase {
  constructor(private readonly agenceRepository: AgenceRepository) {}

  private toUpdateAgence(input: UpdateAgenceUseCaseInput): UpdateAgence {
    return { nomAgence: input.nomAgence };
  }

  async execute(input: UpdateAgenceUseCaseInput): Promise<void> {
    await this.agenceRepository.update(
      input.codeAgence,
      this.toUpdateAgence(input),
    );
  }
}