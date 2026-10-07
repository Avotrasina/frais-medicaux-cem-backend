import { Injectable } from "@nestjs/common";
import { PrismaClient } from "../../../generated/prisma/client.js";
import { RecordNotFoundError } from "../../../common/errors/database.errors.js";
import { AgentRepository } from "../repositories/agent.repository.js";
import { PersonneRepository } from "../repositories/personne.repository.js";
import { AgentType } from "../types/agent.types.js";
import type { AgentUpdatePartial,AgentUpdateProfCard} from "../types/use-case.agent.types.js";
import type { UpdatePartialAgent } from "../types/agent.types.js";
import type { UpdatePartialPersonne } from "../types/personne.types.js";
import { FileStorageService } from "../../../infrastructure/storage/file-storage.service.js";

@Injectable()
export class UpdateAgentUseCase {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly personneRepository: PersonneRepository,
    private readonly agentRepository: AgentRepository,
    private readonly fileStorage: FileStorageService,
  ) {}

  private splitPartialInput(input: AgentUpdatePartial): {
    personne: UpdatePartialPersonne;
    agent: UpdatePartialAgent;
  } {
    const personne: UpdatePartialPersonne = {
      nom: input.nom,
      prenom: input.prenom,
      dateNaissance: input.dateNaissance,
      sexe:input.sexe
    };

    const agent: UpdatePartialAgent = {
      matricule: input.matricule,
      observationMatricule: input.observationMatricule,
      dateEntree: input.dateEntree,
      fonctionID: input.fonctionID,
      categorieID: input.categorieID,
      codeDirection: input.codeDirection,
      codeAgence: input.codeAgence,
      codeService: input.codeService,
      statutPEC: input.statutPEC,
      agentType:
        input.backOfficeFrontOffice === undefined
          ? undefined
          : input.backOfficeFrontOffice === "RETRAITE"
            ? AgentType.AGENT_RETRAITE
            : AgentType.AGENT_ACTIF,
      structureID: input.codeAgence ?? input.codeDirection,
    };

    return { personne, agent };
  }


  async changePartialAttribut(input: AgentUpdatePartial):Promise<void>{
    const { personne, agent } = this.splitPartialInput(input);

    await this.prisma.$transaction(async (tx) => {
      const existingAgent = await this.agentRepository.findByMatricule(
        input.matricule,
        tx,
      );
      if (!existingAgent) throw new RecordNotFoundError("Agent");

      await this.agentRepository.updatePartial(existingAgent.id, agent, tx);      
      await this.personneRepository.update(existingAgent.id, personne, tx);

      const updatedPersonne = await this.personneRepository.findOne(
        existingAgent.id,
        tx,
      );
      if (!updatedPersonne) throw new RecordNotFoundError("Personne");
    });
  }


  async changeAgentProfCard(input: AgentUpdateProfCard): Promise<void> {
    const oldPath = await this.prisma.$transaction(async (tx) => {
      const existingAgent = await this.agentRepository.findByMatricule(
        input.matricule,
        tx,
      );
      if (!existingAgent) throw new RecordNotFoundError("Agent");

      await this.agentRepository.updateProfCard(
        existingAgent.id,
        input.carteProfessionnellePath,
        tx,
      );

      return existingAgent.carteProfessionnellePath;
    });

    if (oldPath && oldPath !== input.carteProfessionnellePath) {
      await this.fileStorage.deleteImage(oldPath);
    }
  }
}