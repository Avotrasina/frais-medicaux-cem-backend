import { Injectable } from "@nestjs/common";
import { LocationRepository } from "../location.repository.js";
import type { ReadLieu, UpdatePartialLieu } from "../types/location.types.js";

@Injectable()
export class UpdateLieuUseCase {
  constructor(private readonly lieuRepository: LocationRepository) {}

  async updatePartial(id: number, input: UpdatePartialLieu): Promise<ReadLieu> {
    if (input.nom == null) {
      return this.lieuRepository.findByID(id);
    }
    return this.lieuRepository.updatePartial(id, input);
  }
}