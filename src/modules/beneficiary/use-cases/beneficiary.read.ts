import { Injectable } from '@nestjs/common';
import { BeneficiaryRepository } from '../repositories/beneficiary.repository.js';
import type { ReadBeneficiary } from '../types/beneficiary.types.js';

@Injectable()
export class ReadBeneficiaryUseCase {
  constructor(private readonly beneficiaryRepository: BeneficiaryRepository) {}

  async findByMatricule(matricule: number): Promise<ReadBeneficiary[]> {
    return this.beneficiaryRepository.findByMatricule(matricule);
  }

  async findByIdp(idp: string): Promise<ReadBeneficiary> {
    return this.beneficiaryRepository.findByIdp(idp);
  }
}
