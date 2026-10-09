import { Injectable } from "@nestjs/common";
import { ProviderRepository } from "../provider.repository.js";
import { omitNullish } from "../../../common/utils/omit-nullish.js";
import type {
  ReadProvider,
  UpdatePartialProvider,
} from "../types/provider.types.js";

@Injectable()
export class UpdateProviderUseCase {
  constructor(private readonly providerRepository: ProviderRepository) {}

  async updatePartial(
    id: number,
    input: UpdatePartialProvider,
  ): Promise<ReadProvider> {
    // aucun champ fourni : pas d'UPDATE inutile, on renvoie l'existant
    if (Object.keys(omitNullish(input)).length === 0) {
      return this.providerRepository.readbyID(id);
    }
    return this.providerRepository.updatePartial(id, input);
  }
}