import { Injectable } from "@nestjs/common";
import { FonctionRepository } from "../fonction.repository.js";
import type {
  ReadFonction,
  UpdatePartialFonction,
} from "../types/fonction.types.js";

@Injectable()
export class UpdateFonctionUseCase {
  constructor(private readonly fonctionRepository: FonctionRepository) {}

  async updatePartial(
    id: number,
    input: UpdatePartialFonction,
  ): Promise<ReadFonction> {
    // aucun champ fourni : pas d'UPDATE inutile, on renvoie l'existant
    if (input.nom == null) {
      return this.fonctionRepository.readbyID(id);
    }
    return this.fonctionRepository.updatePartial(id, input);
  }
}