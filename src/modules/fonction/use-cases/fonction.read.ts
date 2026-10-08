import { Injectable } from "@nestjs/common";
import { FonctionRepository } from "../fonction.repository.js";
import type { ReadFonction } from "../types/fonction.types.js";

@Injectable()
export class ReadFonctionUseCase {
  constructor(private readonly fonctionRepository: FonctionRepository) {}

  async readAll(): Promise<ReadFonction[]> {
    return this.fonctionRepository.findAll();
  }

  async readById(id: number): Promise<ReadFonction> {
    return this.fonctionRepository.readbyID(id);
  }
}