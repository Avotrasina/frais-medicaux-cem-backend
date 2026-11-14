import { Injectable } from '@nestjs/common';
import { RecordNotFoundError } from '../../../common/errors/database.errors.js';
import { ServiceRepository } from '../repositories/service.repository.js';
import type { ReadService } from '../types/service.types.js';
import type { ReadServicesByDirectionUseCaseInput } from '../types/use-case.structure-orga.types.js';

@Injectable()
export class ReadServiceUseCase {
  constructor(private readonly serviceRepository: ServiceRepository) {}

  async findAll(): Promise<ReadService[]> {
    return this.serviceRepository.findAll();
  }

  async findById(codeService: string): Promise<ReadService> {
    const service = await this.serviceRepository.findById(codeService);
    if (!service) throw new RecordNotFoundError('Service');
    return service;
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
