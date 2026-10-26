import { Injectable } from "@nestjs/common";
import { ProviderCategoryRepository } from "../provider-category.repository.js";
import type { ReadProviderCategory } from "../types/provider-category.types.js";

@Injectable()
export class ReadProviderCategoryUseCase {
  constructor(
    private readonly providerCategoryRepository: ProviderCategoryRepository,
  ) {}

  async readAll(): Promise<ReadProviderCategory[]> {
    return this.providerCategoryRepository.findAll();
  }

  async readDeletionRequests(): Promise<ReadProviderCategory[]> {
    return this.providerCategoryRepository.findDeletionRequests();
  }

  async readById(id: number): Promise<ReadProviderCategory> {
    return this.providerCategoryRepository.readbyID(id);
  }
}