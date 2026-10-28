import { Injectable } from '@nestjs/common';
import { AttestationRepository } from '../repositories/attestation.repository.js';

@Injectable()
export class ReadAttestationUseCase {
  constructor(private readonly attestationRepository: AttestationRepository) {}

   findAll(){
    return this.attestationRepository.findAll();
  }

   findByBeneficiaryIdp(beneficiaryIdp: string) {
    return this.attestationRepository.findByBeneficiaryIdp(
      beneficiaryIdp,
    );
  }
}
