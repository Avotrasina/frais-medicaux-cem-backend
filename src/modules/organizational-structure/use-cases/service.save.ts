import { Injectable } from '@nestjs/common';
import { ServiceRepository } from '../repositories/service.repository.js';
import type { CreateService } from '../types/service.types.js';
import type { CreateServiceUseCaseInput } from '../types/use-case.structure-orga.types.js';

@Injectable()
export class CreateServiceUseCase {
  constructor(private readonly serviceRepository: ServiceRepository) {}

  private toCreateService(input: CreateServiceUseCaseInput): CreateService {
    return {
      codeService: input.codeService,
      nom: input.nomService,
      codeDirection: input.codeDirection,
    };
  }

  async execute(input: CreateServiceUseCaseInput): Promise<void> {
    await this.serviceRepository.create(this.toCreateService(input));
  }
}
