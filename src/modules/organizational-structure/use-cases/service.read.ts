import { Injectable } from '@nestjs/common';
import { ServiceRepository } from '../repositories/service.repository.js';
import type { ReadService } from '../types/service.types.js';
import type { ReadServicesByDirectionUseCaseInput } from '../types/use-case.structure-orga.types.js';

@Injectable()
export class ReadServiceUseCase {
  constructor(private readonly serviceRepository: ServiceRepository) {}

  async findAll(): Promise<ReadService[]> {
    return this.serviceRepository.findAll();
  }

  async findDeletionRequests(): Promise<ReadService[]> {
    return this.serviceRepository.findDeletionRequests();
  }

  async findByDirection(
    input: ReadServicesByDirectionUseCaseInput,
  ): Promise<ReadService[]> {
    return this.serviceRepository.findByCodeDirection(input.codeDirection);
  }
}
