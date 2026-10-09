import { Injectable } from "@nestjs/common";
import { LieuRepository } from "../lieu.repository.js";
import type { CreateLieu, ReadLieu } from "../types/lieu.types.js";

@Injectable()
export class SaveLieuUseCase {
  constructor(private readonly lieuRepository: LieuRepository) {}

  async execute(input: CreateLieu): Promise<ReadLieu> {
    return this.lieuRepository.create(input);
  }
}