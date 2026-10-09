import { Module } from "@nestjs/common";
import { LieuController } from "./lieu.controller.js";
import { LieuRepository } from "./lieu.repository.js";
import { SaveLieuUseCase } from "./use-cases/lieu.save.js";
import { UpdateLieuUseCase } from "./use-cases/lieu.update.js";
import { ReadLieuUseCase } from "./use-cases/lieu.read.js";

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