import { Injectable } from "@nestjs/common";
import { PrismaClient } from "../../../generated/prisma/client.js";
import { RecordNotFoundError } from "../../../utils/errors/database.errors.js";
import { AgentRepository } from "../repositories/agent.repository.js";
import { PersonneRepository } from "../repositories/personne.repository.js";
import { AgentType } from "../types/agent.types.js";
import type { AgentUseCaseTypes } from "../types/use-case.agent.types.js";
import type { UpdateAgent } from "../types/agent.types.js";
import type { UpdatePersonne } from "../types/personne.types.js";

@Injectable()
export class UpdateAgentUseCase {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly personneRepository: PersonneRepository,
    private readonly agentRepository: AgentRepository,
  ) {}

  private splitInput(input: AgentUseCaseTypes): {
    personne: UpdatePersonne;
    agent: UpdateAgent;
  } {
    const personne: UpdatePersonne = {
      nom: input.nom,
      prenom: input.prenom,
      dateNaissance: input.dateNaissance,
      sexe:input.sexe
    };

    const agent: UpdateAgent = {
      matricule: input.matricule,
      observationMatricule: input.observationMatricule,
      carteProfessionnellePath: input.carteProfessionnellePath,
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

  async execute(input: AgentUseCaseTypes): Promise<AgentUseCaseTypes> {
    const { personne, agent } = this.splitInput(input);

    await this.prisma.$transaction(async (tx) => {
      const existingAgent = await this.agentRepository.findByMatricule(
        input.matricule,
        tx,
      );
      if (!existingAgent) throw new RecordNotFoundError("Agent");

      await this.agentRepository.update(existingAgent.id, agent, tx);      
      await this.personneRepository.update(existingAgent.id, personne, tx);

      const updatedPersonne = await this.personneRepository.findOne(
        existingAgent.id,
        tx,
      );
      if (!updatedPersonne) throw new RecordNotFoundError("Personne");
    });

    return input;
  }
}