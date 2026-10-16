import { Module } from "@nestjs/common";
import { PrismaModule } from "../../infrastructure/prisma/prisma.module.js";
import { LieuController } from "./location.controller.js";
import { LocationRepository } from "./location.repository.js";
import { SaveLieuUseCase } from "./use-cases/location.save.js";
import { UpdateLieuUseCase } from "./use-cases/location.update.js";
import { ReadLieuUseCase } from "./use-cases/location.read.js";

@Module({
  imports: [PrismaModule],
  controllers: [LieuController],
  providers: [
    LocationRepository,
    SaveLieuUseCase,
    UpdateLieuUseCase,
    ReadLieuUseCase,
  ],
  exports: [LocationRepository],
})
export class LieuModule {}