import { Injectable } from "@nestjs/common";
import { AgenceRepository } from "../repositories/agence.repository.js";
import type { ReadAgence } from "../types/agence.types.js";

@Injectable()
export class ReadAllAgencesUseCase {
  constructor(private readonly agenceRepository: AgenceRepository) {}

  async execute(): Promise<ReadAgence[]> {
    return this.agenceRepository.findAll();
  }
}