import { Injectable } from "@nestjs/common";
import { FonctionRepository } from "../fonction.repository.js";
import type { ReadFonction } from "../types/fonction.types.js";

@Injectable()
export class ReadFonctionUseCase {
  constructor(private readonly fonctionRepository: FonctionRepository) {}

  async findAll(): Promise<ReadFonction[]> {
    return this.fonctionRepository.findAll();
  }

  async findByID(id: number): Promise<ReadFonction> {
    return this.fonctionRepository.findByID(id);
  }
}