import { Module } from "@nestjs/common";
import { FonctionController } from "./fonction.controller.js";
import { FonctionRepository } from "./fonction.repository.js";
import { SaveFonctionUseCase } from "./use-cases/fonction.save.js";
import { UpdateFonctionUseCase } from "./use-cases/fonction.update.js";
import { ReadFonctionUseCase } from "./use-cases/fonction.read.js";

@Module({
  controllers: [FonctionController],
  providers: [
    FonctionRepository,
    SaveFonctionUseCase,
    UpdateFonctionUseCase,
    ReadFonctionUseCase,
  ],
  exports: [FonctionRepository],
})
export class FonctionModule {}