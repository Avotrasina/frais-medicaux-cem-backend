import { Injectable } from "@nestjs/common";
import { ProviderRepository } from "../provider.repository.js";
import type { FilterProvider, ReadProvider } from "../types/provider.types.js";

@Injectable()
export class ReadProviderUseCase {
  constructor(private readonly providerRepository: ProviderRepository) {}

  async readAll(): Promise<ReadProvider[]> {
    return this.providerRepository.findAll();
  }

  async filter(filter: FilterProvider): Promise<ReadProvider[]> {
    return this.providerRepository.findByFilter(filter);
  }
}