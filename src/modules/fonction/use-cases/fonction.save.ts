import { Injectable } from "@nestjs/common";
import { FonctionRepository } from "../fonction.repository.js";
import type { CreateFonction, ReadFonction } from "../types/fonction.types.js";

@Injectable()
export class SaveFonctionUseCase {
  constructor(private readonly fonctionRepository: FonctionRepository) {}

  async execute(input: CreateFonction): Promise<ReadFonction> {
    return this.fonctionRepository.create(input);
  }
}