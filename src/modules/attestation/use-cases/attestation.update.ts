import { Injectable } from "@nestjs/common";
import { AttestationRepository } from "../repositories/attestation.repository.js";
import { AttestationPdfService } from "../services/attesatation-pdf.service.js";
import {BeneficiaryRepository} from "../../beneficiary/beneficiary.repository.js"
import {ProviderRepository} from "../../provider/provider.repository.js"
import {StructureOrganisationnelleRepository} from '../../organizational_structure/repositories/structure-orga.repository.js'
import {FonctionRepository} from "../../fonction/fonction.repository.js"
import {AgentRepository} from "../../agent/repositories/agent.repository.js"
import {LocationRepository} from "../../location/location.repository.js"
import { PrismaService } from "../../../infrastructure/prisma/prisma.service.js";
import type {AgentData,FamilleData,AttestationData} from "../types/attestation.types.js"
import type {UpdateAttestationUseCaseType} from "../types/attestation.use-case.types.js"
import {BackOfficeFrontOffice} from "../types/attestation.types.js"
import { CodeFamille } from "../../beneficiary/types/idp.types.js";

@Injectable()
export class UpdateAttestation{
    constructor(
        private readonly prisma : PrismaService,
        private readonly attestationRepository:AttestationRepository,
        private readonly attestationService:AttestationPdfService,
        private readonly beneficiaryRepository: BeneficiaryRepository,
        private readonly providerRepository: ProviderRepository,
        private readonly agentRepository: AgentRepository,
        private readonly structureRepository :  StructureOrganisationnelleRepository,
        private readonly fonctionRepository : FonctionRepository,
        private readonly lieuRepository : LocationRepository,
    ){}

    async execute(
        attestaionID: number,
        attestationData: UpdateAttestationUseCaseType
    ){
        const actualYear = new Date().getFullYear();
        let attestationPath :string | null = null;
    
        await this.prisma.$transaction(async(tx)=>{
            const oldAttestation = await this.attestationRepository.findByID(attestaionID,tx);
            const newAttestion = await this.attestationRepository.updateByID(attestaionID,attestationData,tx);
            oldAttestation.attestationPath ? await this.attestationService.delete(oldAttestation.attestationPath) : undefined;
            const beneficiary = await this.beneficiaryRepository.findByIDP(newAttestion.idpBeneficiaire,tx);
            const provider = await this.providerRepository.readbyID(newAttestion.prestataireID)
            const nomLocation = (await this.lieuRepository.findByID(provider.lieuID,tx)).nom
            const agentObject = await this.agentRepository.findByMatriculeWithPersonne(beneficiary.matricule,tx)
            const familleData : FamilleData | null = beneficiary.codeFamille == "AGENT" ? null : {
                sexe : beneficiary.sexe,
                nom : beneficiary.nom,
                prenom : beneficiary.prenom,
                dateNaissance : beneficiary.dateNaissance
            }
            if(agentObject.agent.agentType == "AGENT_ACTIF" && agentObject.agent.fonctionID && agentObject.agent.structureID){
                const structureObject = await this.structureRepository.findByID(agentObject.agent.structureID,tx);
                const nomAgence = structureObject.nomAgence;
                const nomDirection = structureObject.nomDirection;
                
                const nomFonction = (await this.fonctionRepository.findByID(agentObject.agent.fonctionID,tx)).nom;
                const agentData : AgentData = {
                    sexe: agentObject.sexe,
                    nom:agentObject.nom,
                    prenom:agentObject.prenom,
                    matricule:agentObject.agent.matricule,
                    statusPEC:agentObject.agent.statutPEC,
                    backofficefrontoffice: nomDirection ? BackOfficeFrontOffice["DIRECTION"] : BackOfficeFrontOffice["AGENCE"],
                    nomFonction,
                    nomDirection,
                    nomAgence,
                    acte:oldAttestation.naturePrestation,
                    service_prestataire:newAttestion.servicePrestataire,
                    nomEtablissement:provider.nom,
                    localite: nomLocation,
                    date_pec: new Date(),
                }
                const newAttestation = await this.attestationRepository.create({
                    attestationPath:null,
                    naturePrestation: newAttestion.naturePrestation,
                    servicePrestataire:newAttestion.servicePrestataire,
                    idpBeneficiaire:beneficiary.idp,
                    providerID:provider.id
                },tx)
                const attestatonRef = `${actualYear} - ${newAttestation.id}`
                const attestionData : AttestationData = {
                    reference:attestatonRef,
                    image:beneficiary.carteProfessionnellePath ?? beneficiary.carteSocialePath,
                    codeFamille : CodeFamille[beneficiary.codeFamille],
                    famille:familleData ?? null,
                    agent:agentData,
                    idp:beneficiary.idp
                }
                attestationPath = await this.attestationService.generateAndSave(attestionData)
                await this.attestationRepository.updateByID(newAttestation.id,{attestationPath},tx)
            }
            else if (agentObject.agent.agentType === "AGENT_RETRAITE") {
                const agentData : AgentData = {
                    sexe: agentObject.sexe,
                    nom:agentObject.nom,
                    prenom:agentObject.prenom,
                    matricule:agentObject.agent.matricule,
                    statusPEC:agentObject.agent.statutPEC,
                    backofficefrontoffice: BackOfficeFrontOffice["RETRAITE"],
                    nomFonction:null,
                    nomDirection:null,
                    nomAgence:null,
                    acte:newAttestion.naturePrestation,
                    service_prestataire:newAttestion.servicePrestataire,
                    nomEtablissement:provider.nom,
                    localite: nomLocation,
                    date_pec: new Date(),
                }
                const newAttestation = await this.attestationRepository.create({
                    attestationPath:null,
                    naturePrestation: newAttestion.naturePrestation,
                    servicePrestataire:newAttestion.servicePrestataire,
                    idpBeneficiaire:beneficiary.idp,
                    providerID:provider.id
                },tx)
                const attestatonRef = `${actualYear} - ${newAttestation.id}`
                const attestionData : AttestationData = {
                    reference:attestatonRef,
                    image:beneficiary.carteProfessionnellePath ?? beneficiary.carteSocialePath,
                    codeFamille : CodeFamille[beneficiary.codeFamille],
                    famille:familleData ?? null,
                    agent:agentData,
                    idp:beneficiary.idp
                }
                attestationPath = await this.attestationService.generateAndSave(attestionData)
                await this.attestationRepository.updateByID(newAttestation.id,{attestationPath},tx)
            }
        })
    }
}