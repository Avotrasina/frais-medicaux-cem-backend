import { Body, Controller, Get, Param, Patch } from "@nestjs/common";
import { ReadBeneficiaryUseCase } from "./use-cases/beneficiary.read.js";
import { UpdateBeneficiaryUseCase } from "./use-cases/beneficiary.update.js";
import { UpdateObservationBeneficiaryDto } from "./dtos/update-observation-beneficiary.dto.js";
import type { ReadBeneficiaryByMatricule } from "./types/beneficiary.types.js";

@Controller("beneficiaries")
export class BeneficiaryController {
  constructor(
    private readonly readBeneficiaryUseCase: ReadBeneficiaryUseCase,
    private readonly updateBeneficiaryUseCase: UpdateBeneficiaryUseCase,
  ) {}

  @Get("matricule/:matricule")
  async findByMatricule(
    @Param("matricule") matricule: string,
  ): Promise<ReadBeneficiaryByMatricule[]> {
    return this.readBeneficiaryUseCase.readByMatricule(matricule);
  }

  @Patch(":idp/observation")
  async updateObservation(
    @Param("idp") idp: string,
    @Body() body: UpdateObservationBeneficiaryDto,
  ): Promise<void> {
    await this.updateBeneficiaryUseCase.updateObservation(idp, body);
  }
}