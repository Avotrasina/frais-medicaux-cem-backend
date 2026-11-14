import { Injectable } from '@nestjs/common';
import { DirectionRepository } from '../repositories/direction.repository.js';
import type { ReadDirectionWithServices } from '../types/direction.types.js';

@Injectable()
export class ReadAllDirectionsUseCase {
  constructor(private readonly directionRepository: DirectionRepository) {}

  async findAll(): Promise<ReadDirectionWithServices[]> {
    return this.directionRepository.findAllWithServices();
  }

  async findDeletionRequests(): Promise<ReadDirectionWithServices[]> {
    return this.directionRepository.findDeletionRequestsWithServices();
  }
}
