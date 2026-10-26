import { Injectable } from '@nestjs/common';
import { ProviderRepository } from '../repositories/provider.repository.js';
import { omitNullish } from '../../../common/utils/omit-nullish.js';
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
    if (Object.keys(omitNullish(input)).length === 0) {
      return this.providerRepository.findById(id);
    }
    return this.providerRepository.updatePartial(id, input);
  }
}
