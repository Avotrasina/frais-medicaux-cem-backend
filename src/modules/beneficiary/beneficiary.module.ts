import { Module } from "@nestjs/common";
import { PrismaModule } from "../../infrastructure/prisma/prisma.module.js";
import { BeneficiaryController } from "./beneficiary.controller.js";
import { BeneficiaryRepository } from "./beneficiary.repository.js";
import { ReadBeneficiaryUseCase } from "./use-cases/beneficiary.read.js";
import { UpdateBeneficiaryUseCase } from "./use-cases/beneficiary.update.js";

@Module({
  imports: [PrismaModule],
  controllers: [BeneficiaryController],
  providers: [BeneficiaryRepository, ReadBeneficiaryUseCase, UpdateBeneficiaryUseCase],
  exports: [BeneficiaryRepository],
})
export class BeneficiaryModule {}
