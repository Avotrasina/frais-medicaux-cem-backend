import { Injectable } from '@nestjs/common';
import { ActeRepository } from '../repositories/acte.repository.js';
import type { CreateActe, ReadActe } from '../types/acte.types.js';

@Injectable()
export class CreateActeUseCase {
  constructor(private readonly acteRepository: ActeRepository) {}

  async execute(input: CreateActe): Promise<ReadActe> {
    return this.acteRepository.create(input);
  }
}
