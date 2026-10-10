import { Injectable } from "@nestjs/common";
import { BeneficiaryRepository } from "../beneficiary.repository.js";
import type { UpdateObservationBenefficiaryUseCaseTYpe,ReadBeneficiaryUseCaseType } from "../types/beneficiary.use-case.types.js";

@Injectable()
export class UpdateBeneficiaryUseCase {
  constructor(private readonly beneficiaryRepository: BeneficiaryRepository) {}

  async updateObservation(
    idp: string,
    input: UpdateObservationBenefficiaryUseCaseTYpe,
  ): Promise<ReadBeneficiaryUseCaseType> {
    return await this.beneficiaryRepository.updateObservation(idp, {
      observationIDP: input.observationIDP ?? null,
    });
  }
}