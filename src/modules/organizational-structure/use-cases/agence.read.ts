import { Injectable } from '@nestjs/common';
import { AgenceRepository } from '../repositories/agence.repository.js';
import type { ReadAgence } from '../types/agence.types.js';

@Injectable()
export class ReadAllAgencesUseCase {
  constructor(private readonly agenceRepository: AgenceRepository) {}

  async findAll(): Promise<ReadAgence[]> {
    return this.agenceRepository.findAll();
  }

  async findDeletionRequests(): Promise<ReadAgence[]> {
    return this.agenceRepository.findDeletionRequests();
  }
}
