import { Injectable } from "@nestjs/common";
import { ProviderRepository } from "../provider.repository.js";
import type { CreateProvider, ReadProvider } from "../types/provider.types.js";

@Injectable()
export class SaveProviderUseCase {
  constructor(
    private readonly providerRepository: ProviderRepository,
  ) {}

  async execute(input: Omit<CreateProvider, "conventionPath">, conventionPath: string): Promise<ReadProvider> {
    return this.providerRepository.create({ ...input, conventionPath });
  }
}
