import {Injectable } from "@nestjs/common";
import { PrismaClient } from "../../../generated/prisma/client.js";
import { AttestationRepository } from "../repositories/attestation.repository.js";
import { AttestationPdfService } from "../services/attesatation-pdf.service.js";
import { bool } from "envalid";

@Injectable()
export class DeleteAttesation{
    constructor(
        private readonly prisma : PrismaClient,
        private readonly attestationRepository : AttestationRepository,
        private readonly attestationService : AttestationPdfService
    ){}

    async execute(attestationID:number){
        let isdeleted  : boolean = false
        await this.prisma.$transaction(async () =>{
            const attestationPath = await this.attestationRepository.delete(attestationID)
            if (attestationPath){
                await this.attestationService.delete(attestationPath)
                isdeleted = true
            }
        }).catch(async()=>{
            if(isdeleted){
                
            }
        })
    }
}