import { Injectable } from '@nestjs/common';
import { ActeRepository } from '../repositories/acte.repository.js';

@Injectable()
export class DeleteActeUseCase {
  constructor(private readonly acteRepository: ActeRepository) {}

  async execute(id: number): Promise<void> {
    await this.acteRepository.delete(id);
  }
}
