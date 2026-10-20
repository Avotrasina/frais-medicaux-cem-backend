import { Module } from "@nestjs/common";
import { PrismaModule } from "../../infrastructure/prisma/prisma.module.js";
import { ProviderController } from "./provider.controller.js";
import { ProviderRepository } from "./provider.repository.js";
import { SaveProviderUseCase } from "./use-cases/provider.save.js";
import { UpdateProviderUseCase } from "./use-cases/provider.update.js";
import { ReadProviderUseCase } from "./use-cases/provider.read.js";
import { StorageModule } from "../../infrastructure/storage/storage.module.js";
import { ConventionModule } from "../convention/convention.module.js";
import { UpdateProviderConventionUseCase } from "./use-cases/provider-convention.update.js";

@Module({
  imports: [PrismaModule, StorageModule, ConventionModule],
  controllers: [ProviderController],
  providers: [
    ProviderRepository,
    SaveProviderUseCase,
    UpdateProviderUseCase,
    ReadProviderUseCase,
    UpdateProviderConventionUseCase,
  ],
  exports: [ProviderRepository],
})
export class ProviderModule {}
