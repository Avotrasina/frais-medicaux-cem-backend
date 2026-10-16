import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../infrastructure/prisma/prisma.service.js";
import { AttestationRepository } from "../repositories/attestation.repository.js";
import { AttestationPdfService } from "../services/attesatation-pdf.service.js";

@Injectable()
export class ReviewAttesation{
    constructor(
        private readonly prisma : PrismaService,
        private readonly attestationRepository : AttestationRepository,
        private readonly attestationService : AttestationPdfService,
    ){}

    async approve(attestaionID: number){
        await this.attestationRepository.updateStatut(attestaionID,"VALIDEE")
    }

    async reject(attestationID: number){
        await this.prisma.$transaction(async(tx)=>{
            const attestation = await this.attestationRepository.findByID(attestationID,tx)
            await this.attestationRepository.updateStatut(attestationID,"REFUSEE")
            attestation.attestationPath ? await this.attestationService.delete(attestation.attestationPath) : undefined
        })
        
    }
}