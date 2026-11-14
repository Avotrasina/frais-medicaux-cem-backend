import { Injectable } from '@nestjs/common';
import { ProviderCategoryRepository } from '../repositories/provider-category.repository.js';
import type {
  ReadProviderCategory,
  UpdatePartialProviderCategory,
} from '../types/provider-category.types.js';

@Injectable()
export class UpdateProviderCategoryUseCase {
  constructor(
    private readonly providerCategoryRepository: ProviderCategoryRepository,
  ) {}

  async updatePartial(
    id: number,
    input: UpdatePartialProviderCategory,
  ): Promise<ReadProviderCategory> {
    // No fields were provided: skip an unnecessary UPDATE and return the existing record.
    if (input.nom == null) {
      return this.providerCategoryRepository.findById(id);
    }
    return this.providerCategoryRepository.updatePartial(id, input);
  }
}
