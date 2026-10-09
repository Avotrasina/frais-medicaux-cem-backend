import { Injectable } from "@nestjs/common";
import { LieuRepository } from "../lieu.repository.js";
import type { ReadLieu } from "../types/lieu.types.js";

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