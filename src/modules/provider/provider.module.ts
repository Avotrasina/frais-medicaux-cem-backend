import { Module } from "@nestjs/common";
import { PrismaModule } from "../../infrastructure/prisma/prisma.module.js";
import { ProviderController } from "./provider.controller.js";
import { ProviderRepository } from "./provider.repository.js";
import { SaveProviderUseCase } from "./use-cases/provider.save.js";
import { UpdateProviderUseCase } from "./use-cases/provider.update.js";
import { ReadProviderUseCase } from "./use-cases/provider.read.js";

@Module({
  imports: [PrismaModule],
  controllers: [ProviderController],
  providers: [
    ProviderRepository,
    SaveProviderUseCase,
    UpdateProviderUseCase,
    ReadProviderUseCase,
  ],
  exports: [ProviderRepository],
})
export class ProviderModule {}