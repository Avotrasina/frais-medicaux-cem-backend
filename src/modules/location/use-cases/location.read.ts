import { Injectable } from '@nestjs/common';
import { LocationRepository } from '../repositories/location.repository.js';
import type { ReadLieu } from '../types/location.types.js';

@Injectable()
export class ReadLieuUseCase {
  constructor(private readonly lieuRepository: LocationRepository) {}

  async findAll(): Promise<ReadLieu[]> {
    return this.lieuRepository.findAll();
  }

  async findDeletionRequests(): Promise<ReadLieu[]> {
    return this.lieuRepository.findDeletionRequests();
  }

  async findById(id: number): Promise<ReadLieu> {
    return this.lieuRepository.findById(id);
  }
}
