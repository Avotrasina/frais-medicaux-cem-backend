import { Injectable } from "@nestjs/common";
import { ProviderCategoryRepository } from "../provider-category.repository.js";
import type {
  ReadProviderCategory,
  UpdatePartialProviderCategory,
} from "../types/provider-category.types.js";

@Injectable()
export class UpdateProviderCategoryUseCase {
  constructor(
    private readonly providerCategoryRepository: ProviderCategoryRepository,
  ) {}

  async updatePartial(
    id: number,
    input: UpdatePartialProviderCategory,
  ): Promise<ReadProviderCategory> {
    // aucun champ fourni : pas d'UPDATE inutile, on renvoie l'existant
    if (input.nom == null) {
      return this.providerCategoryRepository.readbyID(id);
    }
    return this.providerCategoryRepository.updatePartial(id, input);
  }
}