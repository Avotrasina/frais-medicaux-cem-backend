import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post } from "@nestjs/common";
import {DeleteAttesation} from "./use-cases/attestation.delete.js";
import {ReadAttestattion} from "./use-cases/attestation.read.js";
import {ReviewAttesation} from "./use-cases/attestation.review.js";
import {SaveAttestation} from "./use-cases/attestation.save.js";
import {UpdateAttestation} from "./use-cases/attestation.update.js";
import {CreateAttestationDto} from "./dtos/create-attestation.dto.js";
import {UpdatePartialAttestationDto} from "./dtos/update-attestation.dto.js";

@Controller("attestation")
export class AttestationController{
    constructor(
        private readonly attestationDeleteUseCase :  DeleteAttesation,
        private readonly attestationReadUseCase : ReadAttestattion,
        private readonly attestationReviewUseCase : ReviewAttesation,
        private readonly attestationSaveUseCase : SaveAttestation,
        private readonly attestationUpdateUseCase : UpdateAttestation
    ){}

    @Post("/create/")
    @HttpCode(HttpStatus.CREATED)
    async createAttestation(
        @Body() dto:CreateAttestationDto
    ):Promise<void>{
        await this.attestationSaveUseCase.execute(dto)
    }

    @Patch("/update/:id")
    @HttpCode(HttpStatus.NO_CONTENT)
    async updateAttestationData (
        @Param("id",ParseIntPipe) id :number,
        @Body() dto : UpdatePartialAttestationDto
    ){
        await this.attestationUpdateUseCase.execute(id,dto);
    }

    @Patch("/approve/:id")
    @HttpCode(HttpStatus.NO_CONTENT)
    async approveAttestation(
        @Param("id",ParseIntPipe) id:number,
    ){
        await this.attestationReviewUseCase.approve(id);
    }

    @Patch("/reject/:id")
    @HttpCode(HttpStatus.NO_CONTENT)
    async rejectAttestation(
        @Param("id",ParseIntPipe) id:number,
    ){
        await this.attestationReviewUseCase.reject(id);
    }

    @Delete("/delete/:id")
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteAttestation(
        @Param("id",ParseIntPipe) id:number,
    ){
        await this.attestationDeleteUseCase.execute(id);
    }

    @Get("/pening/")
    @HttpCode(HttpStatus.OK)
    async getAllPendingAttestation(){
        return await this.attestationReadUseCase.readAllPending();
    }

    @Get("/agent/:idp")
    @HttpCode(HttpStatus.OK)
    async getAgentAttestation(
        @Param("idp",) idp:string,
    ){
        return await this.attestationReadUseCase.readBeneficiaryValidateAttestation(idp);
    }
}