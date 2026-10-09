import { Injectable } from "@nestjs/common";
import { LieuRepository } from "../location.repository.js";
import type { ReadLieu } from "../types/location.types.js";

@Injectable()
export class ReadLieuUseCase {
  constructor(private readonly lieuRepository: LieuRepository) {}

  async readAll(): Promise<ReadLieu[]> {
    return this.lieuRepository.findAll();
  }

  async readById(id: number): Promise<ReadLieu> {
    return this.lieuRepository.readbyID(id);
  }
}