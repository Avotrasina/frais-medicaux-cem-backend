import { Injectable, UnprocessableEntityException } from "@nestjs/common";
import { AttestationRepository } from "../repositories/attestation.repository.js";
import { AttestationPdfService } from "../services/attesatation-pdf.service.js";
import { BeneficiaryRepository } from "../../beneficiary/beneficiary.repository.js";
import { ProviderRepository } from "../../provider/provider.repository.js";
import { StructureOrganisationnelleRepository } from "../../organizational_structure/repositories/structure-orga.repository.js";
import { AgentRepository } from "../../agent/repositories/agent.repository.js";
import { LocationRepository } from "../../location/location.repository.js";
import { PrismaService } from "../../../infrastructure/prisma/prisma.service.js";
import type { AgentData, FamilleData, AttestationData } from "../types/attestation.types.js";
import type { UpdateAttestationUseCaseType } from "../types/attestation.use-case.types.js";
import { BackOfficeFrontOffice } from "../types/attestation.types.js";
import { CodeFamille } from "../../beneficiary/types/idp.types.js";
import { env } from "../../../common/settings/env.validator.js";

@Injectable()
export class UpdateAttestation {
    constructor(
        private readonly prisma: PrismaService,
        private readonly attestationRepository: AttestationRepository,
        private readonly attestationService: AttestationPdfService,
        private readonly beneficiaryRepository: BeneficiaryRepository,
        private readonly providerRepository: ProviderRepository,
        private readonly agentRepository: AgentRepository,
        private readonly structureRepository: StructureOrganisationnelleRepository,
        private readonly lieuRepository: LocationRepository,
    ) {}

    async execute(
        attestationID: number,
        dto: UpdateAttestationUseCaseType,
    ): Promise<void> {
        const { attestationData, oldPath } = await this.prisma.$transaction(
            async (tx) => {
                const oldAttestation = await this.attestationRepository.findByID(attestationID, tx);
                const updated = await this.attestationRepository.updateByID(attestationID, dto, tx);

                const beneficiary = await this.beneficiaryRepository.findByIDP(updated.idpBeneficiaire, tx);
                const provider = await this.providerRepository.readbyID(updated.prestataireID);
                const location = await this.lieuRepository.findByID(provider.lieuID, tx);
                const agentObject = await this.agentRepository.findByMatriculeWithPersonne(
                    beneficiary.matricule,
                    tx,
                );

                const famille: FamilleData | null =
                    beneficiary.codeFamille === "AGENT"
                        ? null
                        : {
                              sexe: beneficiary.sexe,
                              nom: beneficiary.nom,
                              prenom: beneficiary.prenom,
                              dateNaissance: beneficiary.dateNaissance,
                          };

                const baseAgentData = {
                    sexe: agentObject.sexe,
                    nom: agentObject.nom,
                    prenom: agentObject.prenom,
                    matricule: agentObject.agent.matricule,
                    statusPEC: agentObject.agent.statutPEC,
                    acte: updated.naturePrestation,
                    service_prestataire: updated.servicePrestataire,
                    nomEtablissement: provider.nom,
                    localite: location.nom,
                };

                let agentData: AgentData;

                if (
                    agentObject.agent.agentType === "AGENT_ACTIF" &&
                    agentObject.agent.fonction &&
                    agentObject.agent.structureID
                ) {
                    const structure = await this.structureRepository.findByID(
                        agentObject.agent.structureID,
                        tx,
                    );
                    agentData = {
                        ...baseAgentData,
                        backofficefrontoffice: structure.nomDirection
                            ? BackOfficeFrontOffice.DIRECTION
                            : BackOfficeFrontOffice.AGENCE,
                        nomFonction: agentObject.agent.fonction,
                        nomDirection: structure.nomDirection,
                        nomAgence: structure.nomAgence,
                    };
                } else if (agentObject.agent.agentType === "AGENT_RETRAITE") {
                    agentData = {
                        ...baseAgentData,
                        backofficefrontoffice: BackOfficeFrontOffice.RETRAITE,
                        nomFonction: null,
                        nomDirection: null,
                        nomAgence: null,
                    };
                } else {
                    // Évite de supprimer l'ancien PDF sans pouvoir en générer un nouveau
                    throw new UnprocessableEntityException(
                        "Impossible de générer l'attestation : agent actif sans fonction ou sans structure.",
                    );
                }

                const attestationData: AttestationData = {
                    // On garde l'année de création pour que la référence reste stable
                    reference: `${oldAttestation.datePEC.getFullYear()} - ${attestationID}`,
                    image: beneficiary.carteProfessionnellePath ?? beneficiary.carteSocialePath,
                    codeFamille: CodeFamille[beneficiary.codeFamille],
                    famille,
                    agent: agentData,
                    idp: beneficiary.idp,
                    // La date PEC est immuable pendant une mise à jour des autres champs.
                    datePEC: updated.datePEC,
                };

                return { attestationData, oldPath: oldAttestation.attestationPath };
            },
            {
                maxWait: env.TRANSACTION_MAX_WAIT,
                timeout: env.TRANSACTION_TIMEOUT,
            },
        );

        const newPath = await this.attestationService.generateAndSave(attestationData);

        try {
            await this.attestationRepository.updateByID(attestationID, {
                attestationPath: newPath,
            });
        } catch (error) {
            await this.attestationService.delete(newPath);
            throw error;
        }

        if (oldPath && oldPath !== newPath) {
            await this.attestationService.delete(oldPath);
        }
    }
}
