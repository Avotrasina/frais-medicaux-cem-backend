import { Injectable } from "@nestjs/common";
import { EnfantRepository } from "../repositories/enfant.repository.js";
import type { CreateEnfant } from "../types/enfant.types.js";

@Injectable()
export class SaveEnfantUseCase {
  constructor(private readonly enfantRepository: EnfantRepository) {}

  async execute(input: CreateEnfant): Promise<number> {
    return this.enfantRepository.create(input);
  }
}