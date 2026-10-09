import { Injectable } from "@nestjs/common";
import { ProviderCategoryRepository } from "../provider-category.repository.js";
import type {
  CreateProviderCategory,
  ReadProviderCategory,
} from "../types/provider-category.types.js";

@Injectable()
export class SaveProviderCategoryUseCase {
  constructor(
    private readonly providerCategoryRepository: ProviderCategoryRepository,
  ) {}

  async execute(input: CreateProviderCategory): Promise<ReadProviderCategory> {
    return this.providerCategoryRepository.create(input);
  }
}