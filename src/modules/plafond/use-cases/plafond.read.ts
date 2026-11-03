import { Injectable } from '@nestjs/common';
import type { PlafondQueryDto } from '../dtos/plafond-query.dto.js';
import { PlafondRepository } from '../repositories/plafond.repository.js';
import type { ReadPlafond } from '../types/plafond.types.js';

@Injectable()
export class ReadPlafondUseCase {
  constructor(private readonly plafondRepository: PlafondRepository) {}

  async findAll(filters?: PlafondQueryDto): Promise<ReadPlafond[]> {
    return this.plafondRepository.findAll(filters);
  }

  async findById(id: number): Promise<ReadPlafond> {
    return this.plafondRepository.findById(id);
  }
}
