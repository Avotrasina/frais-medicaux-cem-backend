import { Module } from "@nestjs/common";
import { BeneficiaryController } from "./beneficiary.controller.js";
import { BeneficiaryRepository } from "./beneficiary.repository.js";
import { ReadBeneficiaryUseCase } from "./use-cases/beneficiary.read.js";

@Module({
  controllers: [BeneficiaryController],
  providers: [BeneficiaryRepository, ReadBeneficiaryUseCase],
  exports: [BeneficiaryRepository],
})
export class BeneficiaryModule {}