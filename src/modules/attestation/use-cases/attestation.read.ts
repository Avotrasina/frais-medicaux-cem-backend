import { Injectable } from '@nestjs/common';
import { AttestationRepository } from '../repositories/attestation.repository.js';

@Injectable()
export class ReadAttestationUseCase {
  constructor(private readonly attestationRepository: AttestationRepository) {}

  async findPending() {
    return this.attestationRepository.findPending();
  }

  async findValidatedByBeneficiaryIdp(beneficiaryIdp: string) {
    return this.attestationRepository.findValidatedByBeneficiaryIdp(
      beneficiaryIdp,
    );
  }
}
