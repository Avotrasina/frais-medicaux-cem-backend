import { Injectable } from '@nestjs/common';
import { ProviderCategoryRepository } from '../repositories/provider-category.repository.js';
import type { ReadProviderCategory } from '../types/provider-category.types.js';

@Injectable()
export class ReadProviderCategoryUseCase {
  constructor(
    private readonly providerCategoryRepository: ProviderCategoryRepository,
  ) {}

  async findAll(): Promise<ReadProviderCategory[]> {
    return this.providerCategoryRepository.findAll();
  }

  async findDeletionRequests(): Promise<ReadProviderCategory[]> {
    return this.providerCategoryRepository.findDeletionRequests();
  }

  async findById(id: number): Promise<ReadProviderCategory> {
    return this.providerCategoryRepository.findById(id);
  }
}
