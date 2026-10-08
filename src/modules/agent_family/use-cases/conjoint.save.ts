import { Injectable } from "@nestjs/common";
import { ConjointRepository } from "../repositories/conjoint.repository.js";
import type { CreateConjoint } from "../types/conjoint.types.js";

@Injectable()
export class SaveConjointUseCase {
  constructor(private readonly conjointRepository: ConjointRepository) {}

  async execute(input: CreateConjoint): Promise<number> {
    return this.conjointRepository.create(input);
  }
}