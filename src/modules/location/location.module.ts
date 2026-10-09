import { Module } from "@nestjs/common";
import { LieuController } from "./location.controller.js";
import { LieuRepository } from "./location.repository.js";
import { SaveLieuUseCase } from "./use-cases/location.save.js";
import { UpdateLieuUseCase } from "./use-cases/location.update.js";
import { ReadLieuUseCase } from "./use-cases/location.read.js";

@Module({
  controllers: [LieuController],
  providers: [
    LieuRepository,
    SaveLieuUseCase,
    UpdateLieuUseCase,
    ReadLieuUseCase,
  ],
  exports: [LieuRepository],
})
export class LieuModule {}