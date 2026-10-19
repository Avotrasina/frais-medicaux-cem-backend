import { Injectable } from "@nestjs/common";
import { BeneficiaryRepository } from "../beneficiary.repository.js";
import type { ReadBeneficiaryUseCaseType } from "../types/beneficiary.use-case.types.js";

@Injectable()
export class ReadBeneficiaryUseCase {
  constructor(private readonly beneficiaryRepository: BeneficiaryRepository) {}

  async readByMatricule(
    matricule: number,
  ): Promise<ReadBeneficiaryUseCaseType[]> {
    return this.beneficiaryRepository.findByMatricule(matricule);
  }

  async readByIDP(idp: string): Promise<ReadBeneficiaryUseCaseType> {
    return this.beneficiaryRepository.findByIDP(idp);
  }
}
