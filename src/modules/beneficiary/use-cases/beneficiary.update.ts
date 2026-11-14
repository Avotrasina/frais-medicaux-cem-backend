import { Injectable } from '@nestjs/common';
import { BeneficiaryRepository } from '../repositories/beneficiary.repository.js';
import type {
  ReadBeneficiary,
  UpdateObservationBeneficiary,
} from '../types/beneficiary.types.js';

@Injectable()
export class UpdateBeneficiaryUseCase {
  constructor(private readonly beneficiaryRepository: BeneficiaryRepository) {}

  async updateObservation(
    idp: string,
    input: UpdateObservationBeneficiary,
  ): Promise<ReadBeneficiary> {
    return await this.beneficiaryRepository.updateObservation(idp, {
      observationIDP: input.observationIDP ?? null,
    });
  }
}
