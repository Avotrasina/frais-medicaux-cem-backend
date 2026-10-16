import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../infrastructure/prisma/prisma.service.js";
import { AgentRepository } from "../repositories/agent.repository.js";
import { PersonneRepository } from "../../personne/personne.repository.js";
import {BeneficiaryRepository} from "../../beneficiary/beneficiary.repository.js"
import {AgentType} from "../types/agent.types.js"
import type { AgentUseCaseTypes } from "../types/use-case.agent.types.js";
import type { CreateAgent} from "../types/agent.types.js";
import type { CreatePersonne} from "../../personne/personne.types.js";
import type { CreateBeneficiary } from "../../beneficiary/types/beneficiary.types.js";



@Injectable()
export class SaveAgentUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly personneRepository: PersonneRepository,
    private readonly agentRepository: AgentRepository,
    private readonly beneficiaryRepository: BeneficiaryRepository
  ) {}

  private splitInput(input: AgentUseCaseTypes): {
    personne: CreatePersonne;
    agent: Omit<CreateAgent, "id">;
  } {
    const personne: CreatePersonne = {
      nom: input.nom,
      prenom: input.prenom,
      dateNaissance: input.dateNaissance,
      sexe: input.sexe,
    };

    const agent: Omit<CreateAgent, "id"> = {
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
      agentType : input.backOfficeFrontOffice == "RETRAITE" ? AgentType.AGENT_RETRAITE : AgentType.AGENT_ACTIF,
      structureID: input.codeAgence ? input.codeAgence : input.codeDirection,
    };

    return { personne, agent };
  }

  async execute(
    input: AgentUseCaseTypes,
  ): Promise<AgentUseCaseTypes> {
    const { personne, agent } = this.splitInput(input);

    await this.prisma.$transaction(async (tx) => {
      const createdPersonne = await this.personneRepository.create(personne, tx);
      await this.agentRepository.create(
        { ...agent, id: createdPersonne.id },
        tx,
      );
      const beneficiary : CreateBeneficiary = {
        id:createdPersonne.id,
        codeFamille:"AGENT",
      }
      await this.beneficiaryRepository.create(beneficiary, tx)
    });
    return input;
  }
}
