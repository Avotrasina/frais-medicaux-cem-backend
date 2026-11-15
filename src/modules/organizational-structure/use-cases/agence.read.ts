import { Injectable } from '@nestjs/common';
import { RecordNotFoundError } from '../../../common/errors/database.errors.js';
import { AgenceRepository } from '../repositories/agence.repository.js';
import type { ReadAgence } from '../types/agence.types.js';

@Injectable()
export class ReadAllAgencesUseCase {
  constructor(private readonly agenceRepository: AgenceRepository) {}

  async findAll(): Promise<ReadAgence[]> {
    return this.agenceRepository.findAll();
  }

  async findById(codeAgence: string): Promise<ReadAgence> {
    const agence = await this.agenceRepository.findById(codeAgence);
    if (!agence) throw new RecordNotFoundError('Agence');
    return agence;
  }

  async findDeletionRequests(): Promise<ReadAgence[]> {
    return this.agenceRepository.findDeletionRequests();
  }
}
