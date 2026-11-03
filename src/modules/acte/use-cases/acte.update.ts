import { Injectable } from '@nestjs/common';
import { ActeRepository } from '../repositories/acte.repository.js';
import type { ReadActe, UpdateActe } from '../types/acte.types.js';

@Injectable()
export class UpdateActeUseCase {
  constructor(private readonly acteRepository: ActeRepository) {}

  async execute(id: number, input: UpdateActe): Promise<ReadActe> {
    if (Object.keys(input).length === 0) {
      return this.acteRepository.findById(id);
    }
    return this.acteRepository.update(id, input);
  }
}
