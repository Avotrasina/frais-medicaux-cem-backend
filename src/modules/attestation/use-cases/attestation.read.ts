import { Injectable } from "@nestjs/common";
import { AttestationRepository } from "../repositories/attestation.repository.js";

@Injectable()
export class ReadAttestattion{
    constructor(
        private readonly attestationRepository : AttestationRepository,
    ){}

    async readAllPending(){
        return await this.attestationRepository.findPending()
    }

    async readBeneficiaryValidateAttestation(beneficiaryIdp:string){
        return await this.attestationRepository.findBeneficiaryValidateAttestion(beneficiaryIdp)
    }
}