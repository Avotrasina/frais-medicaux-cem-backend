import { Body, Controller, Get, Param, ParseIntPipe, Patch } from "@nestjs/common";
import { ReadBeneficiaryUseCase } from "./use-cases/beneficiary.read.js";
import { UpdateBeneficiaryUseCase } from "./use-cases/beneficiary.update.js";
import { UpdateObservationBeneficiaryDto } from "./dtos/update-observation-beneficiary.dto.js";
import type { ReadBeneficiaryUseCaseType } from "./types/beneficiary.use-case.types.js";

@Controller("beneficiaries")
export class BeneficiaryController {
  constructor(
    private readonly readBeneficiaryUseCase: ReadBeneficiaryUseCase,
    private readonly updateBeneficiaryUseCase: UpdateBeneficiaryUseCase,
  ) {}

  @Get("matricule/:matricule")
  async findByMatricule(
    @Param("matricule", ParseIntPipe) matricule: number,
  ): Promise<ReadBeneficiaryUseCaseType[]> {
    return this.readBeneficiaryUseCase.readByMatricule(matricule);
  }

  @Get("idp/:idp")
  async findByIdp(
    @Param("idp") idp: string,
  ): Promise<ReadBeneficiaryUseCaseType> {
    return this.readBeneficiaryUseCase.readByIDP(idp);
  }

  @Patch("idp/:idp/observation")
  async updateObservation(
    @Param("idp") idp: string,
    @Body() body: UpdateObservationBeneficiaryDto,
  ): Promise<ReadBeneficiaryUseCaseType> {
    return await this.updateBeneficiaryUseCase.updateObservation(idp, body);
  }
}
