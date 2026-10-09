import { Module } from "@nestjs/common";
import { ProviderCategoryController } from "./provider-category.controller.js";
import { ProviderCategoryRepository } from "./provider-category.repository.js";
import { SaveProviderCategoryUseCase } from "./use-cases/provider-category.save.js";
import { UpdateProviderCategoryUseCase } from "./use-cases/provider-category.update.js";
import { ReadProviderCategoryUseCase } from "./use-cases/provider-category.read.js";

@Module({
  controllers: [ProviderCategoryController],
  providers: [
    ProviderCategoryRepository,
    SaveProviderCategoryUseCase,
    UpdateProviderCategoryUseCase,
    ReadProviderCategoryUseCase,
  ],
  exports: [ProviderCategoryRepository],
})
export class ProviderCategoryModule {}