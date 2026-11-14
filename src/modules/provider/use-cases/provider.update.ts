import { Injectable } from '@nestjs/common';
import { ProviderRepository } from '../repositories/provider.repository.js';
import type {
  ReadProvider,
  UpdatePartialProvider,
} from '../types/provider.types.js';

@Injectable()
export class UpdateProviderUseCase {
  constructor(private readonly providerRepository: ProviderRepository) {}

  async updatePartial(
    id: number,
    input: UpdatePartialProvider,
  ): Promise<ReadProvider> {
    // No fields were provided: skip an unnecessary UPDATE and return the existing record.
    if (Object.values(input).every((value) => value === undefined)) {
      return this.providerRepository.findById(id);
    }
    return this.providerRepository.updatePartial(id, input);
  }
}
