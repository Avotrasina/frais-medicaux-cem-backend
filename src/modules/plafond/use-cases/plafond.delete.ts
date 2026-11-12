import { Injectable } from '@nestjs/common';
import { PlafondRepository } from '../repositories/plafond.repository.js';

@Injectable()
export class DeletePlafondUseCase {
  constructor(private readonly plafondRepository: PlafondRepository) {}

  async execute(id: number): Promise<void> {
    await this.plafondRepository.delete(id);
  }
}
