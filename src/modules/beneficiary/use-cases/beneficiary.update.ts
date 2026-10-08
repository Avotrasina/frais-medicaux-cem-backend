import { Injectable } from "@nestjs/common";
import { BeneficiaryRepository } from "../beneficiary.repository.js";
import type { UpdateObservationBeneficiary } from "../types/beneficiary.types.js";

@Injectable()
export class UpdateBeneficiaryUseCase {
  constructor(private readonly beneficiaryRepository: BeneficiaryRepository) {}

  async updateObservation(
    idp: string,
    input: UpdateObservationBeneficiary,
  ): Promise<void> {
    await this.beneficiaryRepository.updateObservation(idp, {
      observationIDP: input.observationIDP ?? null,
    });
  }
}