import { Injectable } from "@nestjs/common";
import { LieuRepository } from "../location.repository.js";
import type { ReadLieu, UpdatePartialLieu } from "../types/location.types.js";

@Injectable()
export class UpdateLieuUseCase {
  constructor(private readonly lieuRepository: LieuRepository) {}

  async updatePartial(id: number, input: UpdatePartialLieu): Promise<ReadLieu> {
    if (input.nom == null) {
      return this.lieuRepository.readbyID(id);
    }
    return this.lieuRepository.updatePartial(id, input);
  }
}