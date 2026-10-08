import { Injectable } from "@nestjs/common";
import { BeneficiaryRepository } from "../beneficiary.repository.js";
import type { ReadBeneficiaryByMatricule } from "../types/beneficiary.types.js";

@Injectable()
export class ReadBeneficiaryUseCase {
  constructor(private readonly beneficiaryRepository: BeneficiaryRepository) {}

  async readByMatricule(
    matricule: string,
  ): Promise<ReadBeneficiaryByMatricule[]> {
    return this.beneficiaryRepository.findByMatricule(matricule);
  }
}