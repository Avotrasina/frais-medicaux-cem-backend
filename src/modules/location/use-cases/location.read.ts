import { Injectable } from "@nestjs/common";
import { LocationRepository } from "../location.repository.js";
import type { ReadLieu } from "../types/location.types.js";

@Injectable()
export class ReadLieuUseCase {
  constructor(private readonly lieuRepository: LocationRepository) {}

  async readAll(): Promise<ReadLieu[]> {
    return this.lieuRepository.findAll();
  }

  async readDeletionRequests(): Promise<ReadLieu[]> {
    return this.lieuRepository.findDeletionRequests();
  }

  async readById(id: number): Promise<ReadLieu> {
    return this.lieuRepository.findByID(id);
  }
}